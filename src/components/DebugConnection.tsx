import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function DebugConnection() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (title: string, data: any, error?: any) => {
    setResults(prev => [...prev, {
      title,
      data,
      error,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const testConnection = async () => {
    setLoading(true);
    setResults([]);

    try {
      // 1. Testar auth
      addResult('1. Auth getUser()', null);
      const { data: authData, error: authError } = await supabase.auth.getUser();
      addResult('1. Auth getUser() - Result', authData, authError);

      // 2. Testar sessão
      addResult('2. Auth getSession()', null);
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      addResult('2. Auth getSession() - Result', sessionData, sessionError);

      // 3. Testar cliente específico
      addResult('3. Buscar cliente mateus12martins@gmail.com', null);
      const { data: clienteData, error: clienteError } = await supabase
        .from('clientes')
        .select('*')
        .eq('email', 'mateus12martins@gmail.com')
        .single();
      addResult('3. Buscar cliente - Result', clienteData, clienteError);

      // 4. Testar mikrotiks do cliente
      if (clienteData?.id) {
        addResult('4. Buscar MikroTiks do cliente', null);
        const { data: mikrotikData, error: mikrotikError } = await supabase
          .from('mikrotiks')
          .select('*')
          .eq('cliente_id', clienteData.id);
        addResult('4. Buscar MikroTiks - Result', mikrotikData, mikrotikError);

        // 5. Testar planos
        if (mikrotikData?.length > 0) {
          addResult('5. Buscar Planos', null);
          const mikrotikIds = mikrotikData.map(m => m.id);
          const { data: planosData, error: planosError } = await supabase
            .from('planos')
            .select('*')
            .in('mikrotik_id', mikrotikIds);
          addResult('5. Buscar Planos - Result', planosData, planosError);
        }
      }

      // 6. Testar variáveis de ambiente
      addResult('6. Variáveis de Ambiente', {
        VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
        VITE_SUPABASE_KEY: !!import.meta.env.VITE_SUPABASE_KEY,
        VITE_SUPABASE_SERVICE_ROLE: !!import.meta.env.VITE_SUPABASE_SERVICE_ROLE,
        VITE_API_URL: import.meta.env.VITE_API_URL,
        VITE_MODE: import.meta.env.VITE_MODE
      });

    } catch (error) {
      addResult('ERRO GERAL', null, error);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>🔍 Debug de Conexão - VPS/EasyPanel</CardTitle>
        <div className="flex gap-2">
          <Button onClick={testConnection} disabled={loading}>
            {loading ? 'Testando...' : 'Testar Conexão'}
          </Button>
          <Button onClick={clearResults} variant="outline">
            Limpar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {results.map((result, index) => (
            <div key={index} className="border rounded p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-sm">{result.title}</h4>
                <span className="text-xs text-gray-500">{result.timestamp}</span>
              </div>
              
              {result.error && (
                <div className="bg-red-50 border border-red-200 rounded p-2 mb-2">
                  <p className="text-red-800 text-sm font-medium">❌ Erro:</p>
                  <pre className="text-red-700 text-xs overflow-x-auto">
                    {JSON.stringify(result.error, null, 2)}
                  </pre>
                </div>
              )}
              
              {result.data && (
                <div className="bg-green-50 border border-green-200 rounded p-2">
                  <p className="text-green-800 text-sm font-medium">✅ Dados:</p>
                  <pre className="text-green-700 text-xs overflow-x-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              )}
              
              {!result.data && !result.error && (
                <div className="bg-blue-50 border border-blue-200 rounded p-2">
                  <p className="text-blue-800 text-sm">🔄 Executando teste...</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 