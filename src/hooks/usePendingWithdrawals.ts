import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export function usePendingWithdrawals() {
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPendingWithdrawals = async () => {
      try {
        const { data, error } = await supabase
          .from('withdrawals')
          .select('id')
          .eq('status', 'pending');

        if (error) {
          console.error('Erro ao buscar saques pendentes:', error);
          return;
        }

        setPendingCount(data?.length || 0);
      } catch (error) {
        console.error('Erro ao buscar saques pendentes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingWithdrawals();

    // Configurar real-time subscription
    const channel = supabase
      .channel('withdrawals-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'withdrawals' 
        }, 
        () => {
          fetchPendingWithdrawals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { pendingCount, loading };
} 