import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { supabasePublic as supabase } from '@/lib/supabaseClient';

interface Mikrotik {
  id: string;
  nome: string;
}

interface Plano {
  id: string;
  nome: string;
  preco: number;
}

interface LogEntry {
  type: 'info' | 'error' | 'success' | 'payload';
  message: string;
  data?: any;
  timestamp: string;
}

export default function TestePix() {
  const [apiUrl, setApiUrl] = useState('http://localhost:3000/api/captive-check');
  const [mac, setMac] = useState('');
  const [mikrotiks, setMikrotiks] = useState<Mikrotik[]>([]);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [selectedMikrotik, setSelectedMikrotik] = useState('');
  const [selectedPlano, setSelectedPlano] = useState('');
  const [preco, setPreco] = useState('');
  const [descricao, setDescricao] = useState('Acesso WiFi');
  
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [apiStatus, setApiStatus] = useState<'idle' | 'ok' | 'fail' | 'loading'>('idle');
  const [apiStatusMsg, setApiStatusMsg] = useState('');
  const [backendVars, setBackendVars] = useState<any>(null);
  const [backendVarsError, setBackendVarsError] = useState<string | null>(null);

  const addLog = (type: LogEntry['type'], message: string, data?: any) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prevLogs => [{ type, message, data, timestamp }, ...prevLogs]);
  };

  const checkApiStatus = useCallback(async () => {
    setApiStatus('loading');
    setApiStatusMsg('Testando conexão com a API...');
    try {
      const url = apiUrl.replace(/\/$/, '');
      const res = await fetch(url, { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        setApiStatus('ok');
        setApiStatusMsg(data.message || 'API acessível!');
      } else {
        setApiStatus('fail');
        setApiStatusMsg('API respondeu, mas não está OK.');
      }
    } catch (err) {
      setApiStatus('fail');
      setApiStatusMsg('Não foi possível conectar à API.');
    }
  }, [apiUrl]);

  const fetchBackendVars = useCallback(async () => {
    setBackendVarsError(null);
    setBackendVars(null);
    try {
      const url = apiUrl.replace(/\/api\/captive-check.*/, '/api/captive-check/env');
      const res = await fetch(url, { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        setBackendVars(data);
      } else {
        setBackendVarsError('Não foi possível obter variáveis do backend.');
      }
    } catch (err) {
      setBackendVarsError('Erro ao buscar variáveis do backend.');
    }
  }, [apiUrl]);

  useEffect(() => {
    // Testa automaticamente ao abrir a página
    checkApiStatus();
  }, [checkApiStatus]);

  useEffect(() => {
    async function fetchData() {
      addLog('info', 'Buscando dados iniciais (Mikrotiks e Planos)...');
      try {
        const { data: mikrotiksData, error: mikrotiksError } = await supabase.from('mikrotiks').select('id, nome');
        if (mikrotiksError) throw mikrotiksError;
        setMikrotiks(mikrotiksData || []);

        const { data: planosData, error: planosError } = await supabase.from('planos').select('id, nome, preco');
        if (planosError) throw planosError;
        setPlanos(planosData || []);

        addLog('success', 'Mikrotiks e Planos carregados com sucesso.');
      } catch (err: any) {
        addLog('error', 'Erro ao buscar dados iniciais.', err);
        setError({ message: 'Erro ao carregar dados do Supabase', details: err });
      }
    }
    fetchData();
  }, []);

  const generateRandomMac = () => {
    const macAddr = [...Array(6)].map(() => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join(':').toUpperCase();
    setMac(macAddr);
    addLog('info', `MAC aleatório gerado: ${macAddr}`);
  };

  const handlePlanoChange = (planoId: string) => {
    const plano = planos.find(p => p.id === planoId);
    if (plano) {
      setSelectedPlano(planoId);
      setPreco(plano.preco.toString());
      addLog('info', `Plano selecionado: ${plano.nome} (R$ ${plano.preco})`);
    }
  };

  const handleApiCall = async (endpoint: 'status' | 'pix') => {
    setLoading(true);
    setResponse(null);
    setError(null);

    const fullUrl = `${apiUrl}/${endpoint}`;
    addLog('info', `Iniciando chamada para ${fullUrl}`);

    const planoSelecionado = planos.find(p => p.id === selectedPlano);
    const precoFinal = preco || planoSelecionado?.preco.toString() || '0';

    const payload: any = {
      mac,
      mikrotik_id: selectedMikrotik,
    };

    if (endpoint === 'pix') {
      payload.plano_id = selectedPlano;
      payload.preco = parseFloat(precoFinal);
      if (descricao) payload.descricao = descricao;
      // Dados padrão de pagador válidos para Mercado Pago
      payload.payer = {
        email: 'comprador@email.com',
        first_name: 'Joao',
        last_name: 'Silva',
        identification: {
          type: 'CPF',
          number: '19119119100'
        },
        address: {
          zip_code: '06233200',
          street_name: 'Av. das Nações Unidas',
          street_number: '3003',
          neighborhood: 'Bonfim',
          city: 'Osasco',
          federal_unit: 'SP'
        }
      };
    }
    
    addLog('payload', 'Payload enviado:', payload);

    try {
      const res = await fetch(fullUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw data;
      }
      
      setResponse(data);
      addLog('success', `Resposta recebida de ${endpoint}:`, data);
    } catch (err: any) {
      setError(err);
      addLog('error', `Erro na chamada para ${endpoint}:`, err);
    } finally {
      setLoading(false);
    }
  };

  const downloadLogs = () => {
    const logContent = logs.map(log => 
      `[${log.timestamp}] [${log.type.toUpperCase()}] ${log.message}` +
      (log.data ? `\n${JSON.stringify(log.data, null, 2)}` : '')
    ).join('\n\n');
    const blob = new Blob([logContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-teste-pix-${new Date().toISOString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="container mx-auto p-4 space-y-8">
      <div className="mb-4 p-2 bg-gray-50 border rounded">
        <div className="flex items-center gap-4 mb-2">
          <Button onClick={checkApiStatus} variant="outline" size="sm">Testar conexão com API</Button>
          <span className={
            apiStatus === 'ok' ? 'text-green-600 font-bold' :
            apiStatus === 'fail' ? 'text-red-600 font-bold' :
            apiStatus === 'loading' ? 'text-yellow-600 font-bold' : ''
          }>
            {apiStatus === 'ok' && 'API Online'}
            {apiStatus === 'fail' && 'API Offline'}
            {apiStatus === 'loading' && 'Testando...'}
            {apiStatus === 'idle' && 'Status desconhecido'}
          </span>
          <span className="text-xs text-gray-500">{apiStatusMsg}</span>
        </div>
        <div><strong>API URL:</strong> {apiUrl}</div>
        <div><strong>Frontend URL:</strong> {window.location.origin}</div>
        <div><strong>VITE_API_URL:</strong> {import.meta.env.VITE_API_URL}</div>
        <div><strong>VITE_SUPABASE_URL:</strong> {import.meta.env.VITE_SUPABASE_URL}</div>
        <div><strong>VITE_SUPABASE_KEY:</strong> {import.meta.env.VITE_SUPABASE_KEY ? '***' : '(não definida)'}</div>
        <div className="mb-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold">Variáveis do Frontend (VITE_*)</span>
          </div>
          <pre className="bg-gray-100 p-2 rounded text-xs whitespace-pre-wrap">
{JSON.stringify({
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_KEY: import.meta.env.VITE_SUPABASE_KEY,
  NODE_ENV: import.meta.env.NODE_ENV,
  MODE: import.meta.env.MODE,
  BASE_URL: import.meta.env.BASE_URL,
  PROD: import.meta.env.PROD,
  DEV: import.meta.env.DEV,
}, null, 2)}
          </pre>
          <div className="flex items-center gap-2 mt-2">
            <span className="font-bold">Variáveis do Backend</span>
            <Button onClick={fetchBackendVars} size="sm" variant="outline">Buscar variáveis do backend</Button>
          </div>
          {backendVars && (
            <pre className="bg-gray-100 p-2 rounded text-xs whitespace-pre-wrap">
{JSON.stringify(backendVars, null, 2)}
            </pre>
          )}
          {backendVarsError && (
            <div className="text-red-600 text-xs">{backendVarsError}</div>
          )}
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Teste Pix Mercado Pago</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-url">API URL</Label>
            <Input id="api-url" value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mac">MAC</Label>
              <div className="flex items-center gap-2">
                <Input id="mac" value={mac} onChange={(e) => setMac(e.target.value.toUpperCase())} placeholder="XX:XX:XX:XX:XX:XX" />
                <Button onClick={generateRandomMac}>Gerar</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mikrotik">Mikrotik</Label>
              <Select onValueChange={setSelectedMikrotik} value={selectedMikrotik}>
                <SelectTrigger id="mikrotik">
                  <SelectValue placeholder="Selecione um Mikrotik" />
                </SelectTrigger>
                <SelectContent>
                  {mikrotiks.map(m => <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="plano">Plano</Label>
              <Select onValueChange={handlePlanoChange} value={selectedPlano}>
                <SelectTrigger id="plano">
                  <SelectValue placeholder="Selecione um Plano" />
                </SelectTrigger>
                <SelectContent>
                  {planos.map(p => <SelectItem key={p.id} value={p.id}>{p.nome} (R$ {p.preco})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="preco">Preço personalizado (opcional)</Label>
              <Input id="preco" value={preco} onChange={(e) => setPreco(e.target.value)} placeholder="Deixe em branco para usar o preço do plano" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição Pix (opcional)</Label>
            <Input id="descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => handleApiCall('status')} disabled={loading || !mac || !selectedMikrotik}>
              {loading ? 'Verificando...' : 'Ver Status'}
            </Button>
            <Button onClick={() => handleApiCall('pix')} disabled={loading || !mac || !selectedMikrotik || !selectedPlano}>
              {loading ? 'Gerando...' : 'Gerar Pix'}
            </Button>
            <Button onClick={downloadLogs} variant="outline" disabled={logs.length === 0}>
              Baixar Logs
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Resposta da API</CardTitle></CardHeader>
          <CardContent>
            {loading && <p>Carregando...</p>}
            {error && (
              <div>
                <h3 className="text-red-600 font-bold">Erro: {error.message || error.error || 'Ocorreu um erro'}</h3>
                <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded mt-2 text-sm whitespace-pre-wrap">
                  {JSON.stringify(error, null, 2)}
                </pre>
                {error.status && (
                  <div className="mt-2">
                    <strong>Status HTTP:</strong> {error.status} {error.statusText || ''}
                  </div>
                )}
                {error.headers && (
                  <div className="mt-2">
                    <strong>Headers:</strong>
                    <pre className="bg-gray-50 dark:bg-gray-900 p-2 rounded text-xs whitespace-pre-wrap">
                      {JSON.stringify(error.headers, null, 2)}
                    </pre>
                  </div>
                )}
                {error.payload_enviado && (
                  <div className="mt-2">
                    <strong>Payload Enviado:</strong>
                    <pre className="bg-gray-50 dark:bg-gray-900 p-2 rounded text-xs whitespace-pre-wrap">
                      {JSON.stringify(error.payload_enviado, null, 2)}
                    </pre>
                  </div>
                )}
                {error.body && (
                  <div className="mt-2">
                    <strong>Corpo da resposta do Mercado Pago:</strong>
                    <pre className="bg-gray-50 dark:bg-gray-900 p-2 rounded text-xs whitespace-pre-wrap">
                      {JSON.stringify(error.body, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
            {response && (
              <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm whitespace-pre-wrap">
                {JSON.stringify(response, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Logs da Sessão</CardTitle></CardHeader>
          <CardContent className="h-96 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index} className={`p-2 border-b ${log.type === 'error' ? 'text-red-500' : log.type === 'success' ? 'text-green-500' : ''}`}>
                <p className="font-mono text-xs">[{log.timestamp}] <strong>[{log.type.toUpperCase()}]</strong></p>
                <p className="font-mono text-sm">{log.message}</p>
                {log.data && (
                  <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1 text-xs whitespace-pre-wrap">
                    {JSON.stringify(log.data, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 