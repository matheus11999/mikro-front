import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { supabasePublic as supabase } from '@/lib/supabaseClient';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Loader2, 
  Copy, 
  Download, 
  RefreshCw,
  Wifi,
  QrCode,
  CreditCard,
  AlertCircle,
  CheckCheck,
  Timer,
  User,
  Key
} from 'lucide-react';
import { toast } from 'sonner';

interface Mikrotik {
  id: string;
  nome: string;
}

interface Plano {
  id: string;
  nome: string;
  preco: number;
  duracao: number;
}

interface LogEntry {
  type: 'info' | 'error' | 'success' | 'payload';
  message: string;
  data?: any;
  timestamp: string;
}

interface PaymentStatus {
  status: string;
  mac: string;
  mikrotik_id: string;
  total_vendas: number;
  total_gasto: number;
  ultimo_valor?: number;
  ultimo_plano?: string;
  username?: string;
  password?: string;
  plano?: string;
  duracao?: number;
  fim?: string;
  pagamento_pendente?: {
    status: string;
    pagamento_gerado_em: string;
    chave_pix: string;
    qrcode: string;
    valor: number;
    ticket_url: string;
    payment_id: string;
  };
}

export default function TestePix() {
  const [apiUrl, setApiUrl] = useState('');
  const [mac, setMac] = useState('');
  const [selectedMikrotik, setSelectedMikrotik] = useState('');
  const [selectedPlano, setSelectedPlano] = useState('');
  const [precoPersonalizado, setPrecoPersonalizado] = useState('');
  const [descricao, setDescricao] = useState('');
  const [mikrotiks, setMikrotiks] = useState<Mikrotik[]>([]);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [response, setResponse] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [pollingActive, setPollingActive] = useState(false);
  const [pollingTime, setPollingTime] = useState(0);
  const [pollingProgress, setPollingProgress] = useState(0);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Função para adicionar logs
  const addLog = useCallback((type: LogEntry['type'], message: string, data?: any) => {
    setLogs(prev => [...prev, {
      type,
      message,
      data,
      timestamp: new Date().toLocaleTimeString()
    }]);
  }, []);

  // Função para gerar MAC aleatório
  const generateRandomMac = () => {
    const hex = '0123456789ABCDEF';
    let mac = '';
    for (let i = 0; i < 6; i++) {
      if (i > 0) mac += ':';
      mac += hex[Math.floor(Math.random() * 16)] + hex[Math.floor(Math.random() * 16)];
    }
    setMac(mac);
    addLog('info', `MAC gerado: ${mac}`);
  };

  // Função para copiar texto
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  // Função segura para renderizar valores
  const safeRender = (value: any): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') {
      if (value instanceof Date) return value.toLocaleString();
      return JSON.stringify(value);
    }
    return String(value);
  };

  // Função para formatar data
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleString('pt-BR');
    } catch {
      return dateString;
    }
  };

  // Carregar Mikrotiks iniciais
  useEffect(() => {
    const loadMikrotiks = async () => {
      try {
        addLog('info', 'Buscando Mikrotiks...');
        
        const { data: mikrotiksData, error } = await supabase
          .from('mikrotiks')
          .select('id, nome')
          .eq('ativo', true)
          .order('nome');

        if (error) {
          addLog('error', 'Erro ao carregar Mikrotiks', error);
          return;
        }

        if (mikrotiksData) {
          setMikrotiks(mikrotiksData);
          addLog('success', `${mikrotiksData.length} Mikrotiks carregados com sucesso.`);
        }
      } catch (error) {
        addLog('error', 'Erro ao carregar Mikrotiks', error);
      }
    };

    // Definir API URL do ambiente
    const envApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/captive-check/';
    setApiUrl(envApiUrl);

    loadMikrotiks();
  }, [addLog]);

  // Carregar planos quando um Mikrotik é selecionado
  useEffect(() => {
    const loadPlanos = async () => {
      if (!selectedMikrotik) {
        setPlanos([]);
        setSelectedPlano('');
        return;
      }

      try {
        addLog('info', `Buscando planos do Mikrotik selecionado...`);
        
        const { data: planosData, error } = await supabase
          .from('planos')
          .select('id, nome, preco, duracao')
          .eq('mikrotik_id', selectedMikrotik)
          .eq('ativo', true)
          .order('preco');

        if (error) {
          addLog('error', 'Erro ao carregar planos', error);
          return;
        }

        if (planosData) {
          setPlanos(planosData);
          addLog('success', `${planosData.length} planos carregados para o Mikrotik selecionado.`);
        }
      } catch (error) {
        addLog('error', 'Erro ao carregar planos', error);
      }
    };

    loadPlanos();
  }, [selectedMikrotik, addLog]);

  // Função para parar polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
    setPollingActive(false);
    setPollingTime(0);
    setPollingProgress(0);
  }, []);

  // Função para iniciar polling
  const startPolling = useCallback(() => {
    if (!mac || !selectedMikrotik || !response?.pagamento_pendente) return;

    setPollingActive(true);
    setPollingTime(0);
    setPollingProgress(0);
    
    const maxTime = 600; // 10 minutos em segundos
    
    // Timer para contar o tempo
    pollingTimerRef.current = setInterval(() => {
      setPollingTime(prev => {
        const newTime = prev + 1;
        setPollingProgress((newTime / maxTime) * 100);
        
        if (newTime >= maxTime) {
          stopPolling();
          addLog('error', 'Tempo limite de verificação atingido (10 minutos)');
          toast.error('Tempo limite de verificação atingido');
        }
        
        return newTime;
      });
    }, 1000);

    // Polling a cada 5 segundos
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const statusResponse = await fetch(`${apiUrl}status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mac, mikrotik_id: selectedMikrotik })
        });

        const data = await statusResponse.json();
        setResponse(data);
        
        addLog('info', 'Verificação automática de pagamento', data);

        // Se o pagamento foi aprovado ou o status mudou
        if (data.status === 'autenticado' || 
            (data.pagamento_pendente && data.pagamento_pendente.status === 'approved' && data.username)) {
          stopPolling();
          addLog('success', '🎉 Pagamento aprovado! Senha liberada!');
          toast.success('Pagamento aprovado com sucesso!');
        }
      } catch (error) {
        addLog('error', 'Erro na verificação automática', error);
      }
    }, 5000);
  }, [mac, selectedMikrotik, response, apiUrl, stopPolling, addLog]);

  // Verificar status
  const handleVerifyStatus = async () => {
    if (!mac || !selectedMikrotik) {
      toast.error('Preencha o MAC e selecione um Mikrotik');
      return;
    }

    setLoading(true);
    stopPolling();

    try {
      addLog('info', `Iniciando chamada para ${apiUrl}status`);
      addLog('payload', 'Payload enviado:', { mac, mikrotik_id: selectedMikrotik });

      const statusResponse = await fetch(`${apiUrl}status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mac, mikrotik_id: selectedMikrotik })
      });

      const data = await statusResponse.json();
      setResponse(data);
      addLog('success', 'Resposta recebida de status:', data);

      // Se tem pagamento pendente, inicia polling
      if (data.pagamento_pendente && data.pagamento_pendente.status !== 'approved') {
        startPolling();
      }
    } catch (error) {
      addLog('error', 'Erro ao verificar status', error);
      toast.error('Erro ao verificar status');
    } finally {
      setLoading(false);
    }
  };

  // Gerar PIX
  const handleGeneratePix = async () => {
    if (!mac || !selectedMikrotik || !selectedPlano) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const plano = planos.find(p => p.id === selectedPlano);
    if (!plano) {
      toast.error('Plano inválido');
      return;
    }

    const preco = precoPersonalizado ? parseFloat(precoPersonalizado) : plano.preco;
    if (isNaN(preco) || preco <= 0) {
      toast.error('Preço inválido');
      return;
    }

    setLoading(true);
    stopPolling();

    try {
      addLog('info', `Iniciando geração de PIX para ${apiUrl}pix`);
      addLog('payload', 'Payload enviado:', {
        mac,
        plano_id: selectedPlano,
        mikrotik_id: selectedMikrotik,
        preco,
        descricao: descricao || plano.nome
      });

      const pixResponse = await fetch(`${apiUrl}pix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mac,
          plano_id: selectedPlano,
          mikrotik_id: selectedMikrotik,
          preco,
          descricao: descricao || plano.nome
        })
      });

      const pixData = await pixResponse.json();
      
      if (!pixResponse.ok) {
        throw new Error(pixData.error || 'Erro ao gerar PIX');
      }

      addLog('success', 'PIX gerado com sucesso!', pixData);
      
      // Atualiza o response com os dados do pagamento
      setResponse({
        status: 'pendente',
        mac,
        mikrotik_id: selectedMikrotik,
        total_vendas: 0,
        total_gasto: 0,
        pagamento_pendente: {
          status: pixData.status || 'pending',
          pagamento_gerado_em: new Date().toISOString(),
          chave_pix: pixData.chave_pix,
          qrcode: pixData.qrcode,
          valor: preco,
          ticket_url: pixData.ticket_url,
          payment_id: pixData.id
        }
      });

      // Inicia polling automático
      startPolling();
      toast.success('PIX gerado com sucesso!');
    } catch (error: any) {
      addLog('error', 'Erro ao gerar PIX', error);
      toast.error(error.message || 'Erro ao gerar PIX');
    } finally {
      setLoading(false);
    }
  };

  // Baixar logs
  const downloadLogs = () => {
    const logText = logs.map(log => 
      `[${log.timestamp}] [${log.type.toUpperCase()}]\n${log.message}\n${log.data ? JSON.stringify(log.data, null, 2) : ''}\n`
    ).join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `testepix-logs-${new Date().toISOString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Renderizar status badge
  const renderStatusBadge = (status: string) => {
    const statusConfig = {
      'pendente': { variant: 'secondary' as const, icon: Clock, label: 'Pendente' },
      'autenticado': { variant: 'default' as const, icon: CheckCircle2, label: 'Autenticado' },
      'precisa_comprar': { variant: 'destructive' as const, icon: XCircle, label: 'Precisa Comprar' },
      'approved': { variant: 'default' as const, icon: CheckCheck, label: 'Aprovado' }
    };

    const config = statusConfig[status] || { variant: 'outline' as const, icon: AlertCircle, label: status };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Teste PIX - Mercado Pago</h1>
        <p className="text-muted-foreground">
          Ferramenta de teste para pagamentos PIX integrados com o sistema de hotspot
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna Esquerda - Formulário */}
        <div className="space-y-6">
          {/* Configuração */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="w-5 h-5" />
                Configuração do Teste
              </CardTitle>
              <CardDescription>
                Configure os parâmetros para testar o pagamento PIX
                {mikrotiks.length > 0 && (
                  <span className="block mt-1 text-xs">
                    {mikrotiks.length} Mikrotik{mikrotiks.length !== 1 ? 's' : ''} disponível{mikrotiks.length !== 1 ? 'eis' : ''}
                    {selectedMikrotik && planos.length > 0 && (
                      <span> • {planos.length} plano{planos.length !== 1 ? 's' : ''} no Mikrotik selecionado</span>
                    )}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiUrl">API URL</Label>
                <Input
                  id="apiUrl"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="https://api.exemplo.com/api/captive-check/"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mac">MAC Address</Label>
                <div className="flex gap-2">
                  <Input
                    id="mac"
                    value={mac}
                    onChange={(e) => setMac(e.target.value)}
                    placeholder="XX:XX:XX:XX:XX:XX"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={generateRandomMac}
                    title="Gerar MAC aleatório"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mikrotik">Mikrotik</Label>
                <Select 
                  value={selectedMikrotik} 
                  onValueChange={(value) => {
                    setSelectedMikrotik(value);
                    const mikrotik = mikrotiks.find(mk => mk.id === value);
                    if (mikrotik) {
                      addLog('info', `Mikrotik selecionado: ${mikrotik.nome}`);
                    }
                  }}
                >
                  <SelectTrigger id="mikrotik">
                    <SelectValue placeholder="Selecione um Mikrotik" />
                  </SelectTrigger>
                  <SelectContent>
                    {mikrotiks.length === 0 ? (
                      <SelectItem value="" disabled>
                        Nenhum Mikrotik encontrado
                      </SelectItem>
                    ) : (
                      mikrotiks.map((mk) => (
                        <SelectItem key={mk.id} value={mk.id}>
                          {mk.nome}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="plano">Plano</Label>
                <Select 
                  value={selectedPlano} 
                  onValueChange={(value) => {
                    setSelectedPlano(value);
                    const plano = planos.find(p => p.id === value);
                    if (plano) {
                      addLog('info', `Plano selecionado: ${plano.nome} (R$ ${plano.preco})`);
                    }
                  }}
                  disabled={!selectedMikrotik}
                >
                  <SelectTrigger id="plano">
                    <SelectValue 
                      placeholder={
                        !selectedMikrotik 
                          ? "Selecione um Mikrotik primeiro" 
                          : planos.length === 0 
                            ? "Nenhum plano disponível" 
                            : "Selecione um plano"
                      } 
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {!selectedMikrotik ? (
                      <SelectItem value="" disabled>
                        Selecione um Mikrotik primeiro
                      </SelectItem>
                    ) : planos.length === 0 ? (
                      <SelectItem value="" disabled>
                        Nenhum plano disponível para este Mikrotik
                      </SelectItem>
                    ) : (
                      planos.map((plano) => (
                        <SelectItem key={plano.id} value={plano.id}>
                          {plano.nome} - R$ {plano.preco.toFixed(2)} ({plano.duracao} min)
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="preco">Preço personalizado (opcional)</Label>
                <Input
                  id="preco"
                  type="number"
                  step="0.01"
                  value={precoPersonalizado}
                  onChange={(e) => setPrecoPersonalizado(e.target.value)}
                  placeholder={selectedPlano ? planos.find(p => p.id === selectedPlano)?.preco.toString() : "10.00"}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição PIX (opcional)</Label>
                <Input
                  id="descricao"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Acesso WiFi"
                />
              </div>

              <Separator />

              <div className="flex gap-2">
                <Button
                  onClick={handleVerifyStatus}
                  disabled={loading || !mac || !selectedMikrotik}
                  className="flex-1"
                  variant="outline"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  )}
                  Ver Status
                </Button>
                <Button
                  onClick={handleGeneratePix}
                  disabled={loading || !mac || !selectedMikrotik || !selectedPlano}
                  className="flex-1"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <QrCode className="w-4 h-4 mr-2" />
                  )}
                  Gerar PIX
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Logs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Logs da Sessão</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={downloadLogs}
                  disabled={logs.length === 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Baixar Logs
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm space-y-2">
                {logs.length === 0 ? (
                  <p className="text-muted-foreground">Nenhum log ainda...</p>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className={`
                      ${log.type === 'error' ? 'text-destructive' : ''}
                      ${log.type === 'success' ? 'text-green-600' : ''}
                      ${log.type === 'payload' ? 'text-blue-600' : ''}
                    `}>
                      <span className="text-muted-foreground">[{log.timestamp}]</span>{' '}
                      <span className="font-semibold">[{log.type.toUpperCase()}]</span>
                      <div>{log.message}</div>
                      {log.data && (
                        <pre className="text-xs mt-1 opacity-80">
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coluna Direita - Resposta */}
        <div className="space-y-6">
          {/* Status da Resposta */}
          {response && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Resposta da API</span>
                  {renderStatusBadge(response.status)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Informações do MAC */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">MAC</p>
                    <p className="font-medium">{response.mac}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Mikrotik ID</p>
                    <p className="font-medium text-xs">{response.mikrotik_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total de vendas aprovadas</p>
                    <p className="font-medium">{response.total_vendas}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total gasto</p>
                    <p className="font-medium">R$ {response.total_gasto.toFixed(2)}</p>
                  </div>
                  {response.ultimo_valor && (
                    <div>
                      <p className="text-sm text-muted-foreground">Último valor pago</p>
                      <p className="font-medium">R$ {response.ultimo_valor.toFixed(2)}</p>
                    </div>
                  )}
                  {response.ultimo_plano && (
                    <div>
                      <p className="text-sm text-muted-foreground">Último plano</p>
                      <p className="font-medium">{response.ultimo_plano}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pagamento PIX */}
          {response?.pagamento_pendente && (
            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Pagamento PIX
                  </span>
                  {renderStatusBadge(response.pagamento_pendente.status)}
                </CardTitle>
                {pollingActive && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Verificando pagamento...
                      </span>
                      <span className="font-medium">
                        {Math.floor(pollingTime / 60)}:{(pollingTime % 60).toString().padStart(2, '0')} / 10:00
                      </span>
                    </div>
                    <Progress value={pollingProgress} className="h-2" />
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Valor</p>
                    <p className="font-bold text-lg">R$ {response.pagamento_pendente.valor.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Gerado em</p>
                    <p className="font-medium text-sm">{formatDate(response.pagamento_pendente.pagamento_gerado_em)}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Chave PIX (copia e cola)</Label>
                  <div className="flex gap-2">
                    <Input
                      value={response.pagamento_pendente.chave_pix}
                      readOnly
                      className="font-mono text-xs"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => copyToClipboard(response.pagamento_pendente!.chave_pix, 'Chave PIX')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {response.pagamento_pendente.qrcode && (
                  <div className="space-y-2">
                    <Label>QR Code</Label>
                    <div className="flex justify-center p-4 bg-white rounded-lg">
                      <img
                        src={`data:image/png;base64,${response.pagamento_pendente.qrcode}`}
                        alt="QR Code PIX"
                        className="w-64 h-64"
                      />
                    </div>
                  </div>
                )}

                {response.pagamento_pendente.payment_id && (
                  <div className="text-xs text-muted-foreground text-center">
                    Payment ID: {response.pagamento_pendente.payment_id}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Senha Liberada */}
          {response?.status === 'autenticado' && response.username && (
            <Card className="border-green-500 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="w-5 h-5" />
                  Acesso Liberado!
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="border-green-200 bg-green-100">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800">Pagamento Aprovado!</AlertTitle>
                  <AlertDescription className="text-green-700">
                    O pagamento foi processado com sucesso e a senha foi liberada.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Usuário
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        value={response.username}
                        readOnly
                        className="font-mono font-bold"
                      />
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => copyToClipboard(response.username!, 'Usuário')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Key className="w-4 h-4" />
                      Senha
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        value={response.password}
                        readOnly
                        className="font-mono font-bold"
                      />
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => copyToClipboard(response.password!, 'Senha')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Plano</p>
                    <p className="font-medium">{response.plano}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Duração</p>
                    <p className="font-medium flex items-center gap-1">
                      <Timer className="w-4 h-4" />
                      {response.duracao} minutos
                    </p>
                  </div>
                  {response.fim && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Válido até</p>
                      <p className="font-medium">{formatDate(response.fim)}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Debug JSON */}
          {response && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">JSON completo da resposta (debug)</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-64">
                  {JSON.stringify(response, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
} 