import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface MikrotikStatus {
  id: string;
  nome: string;
  provider_name: string | null;
  status: string;
  cliente_id: string | null;
  criado_em: string;
  profitpercentage: string;
  ultimo_heartbeat: string | null;
  heartbeat_version: string | null;
  heartbeat_uptime: string | null;
  api_token: string | null;
  status_heartbeat: 'online' | 'offline' | 'never_connected';
  status_descricao: string;
  segundos_desde_ultimo_heartbeat: number | null;
  is_online: boolean;
  minutos_offline: number | null;
  status_conexao: 'online' | 'offline' | 'nunca_conectou';
}

export interface StatusEstatisticas {
  total: number;
  online: number;
  offline: number;
  nunca_conectou: number;
  porcentagem_online: number;
}

export function useMikrotikStatus() {
  const [mikrotiks, setMikrotiks] = useState<MikrotikStatus[]>([]);
  const [estatisticas, setEstatisticas] = useState<StatusEstatisticas>({
    total: 0,
    online: 0,
    offline: 0,
    nunca_conectou: 0,
    porcentagem_online: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMikrotikStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar dados da view que calcula automaticamente o status online/offline
      const { data, error: supabaseError } = await supabase
        .from('vw_mikrotiks_status')
        .select('*')
        .order('nome');

      if (supabaseError) {
        throw supabaseError;
      }

      // Mapear dados e calcular status
      const mikrotiksComStatus = (data || []).map(mikrotik => ({
        ...mikrotik,
        is_online: mikrotik.status_heartbeat === 'online',
        minutos_offline: mikrotik.segundos_desde_ultimo_heartbeat 
          ? Math.floor(mikrotik.segundos_desde_ultimo_heartbeat / 60) 
          : null,
        status_conexao: mikrotik.status_heartbeat === 'online' 
          ? 'online' as const
          : mikrotik.status_heartbeat === 'never_connected' 
            ? 'nunca_conectou' as const 
            : 'offline' as const
      }));
      
      setMikrotiks(mikrotiksComStatus);

      // Calcular estatísticas
      const total = mikrotiksComStatus.length;
      const online = mikrotiksComStatus.filter(m => m.status_heartbeat === 'online').length;
      const offline = mikrotiksComStatus.filter(m => m.status_heartbeat === 'offline').length;
      const nunca_conectou = mikrotiksComStatus.filter(m => m.status_heartbeat === 'never_connected').length;
      const porcentagem_online = total > 0 ? Math.round((online / total) * 100) : 0;

      setEstatisticas({
        total,
        online,
        offline,
        nunca_conectou,
        porcentagem_online
      });

    } catch (err) {
      console.error('Erro ao buscar status dos MikroTiks:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMikrotikStatus();

    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchMikrotikStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  return {
    mikrotiks,
    estatisticas,
    loading,
    error,
    refresh: fetchMikrotikStatus
  };
}

// Hook específico para um MikroTik
export function useSingleMikrotikStatus(mikrotikId: string) {
  const [mikrotik, setMikrotik] = useState<MikrotikStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSingleStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('vw_mikrotiks_status')
        .select('*')
        .eq('id', mikrotikId)
        .single();

      if (supabaseError) {
        throw supabaseError;
      }

      setMikrotik(data);

    } catch (err) {
      console.error('Erro ao buscar status do MikroTik:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mikrotikId) {
      fetchSingleStatus();

      // Atualizar a cada 30 segundos
      const interval = setInterval(fetchSingleStatus, 30000);

      return () => clearInterval(interval);
    }
  }, [mikrotikId]);

  return {
    mikrotik,
    loading,
    error,
    refresh: fetchSingleStatus
  };
} 