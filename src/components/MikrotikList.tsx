import { useState, useEffect } from 'react';
import { Pencil, Trash2, Router } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import { formatCurrency } from '@/lib/utils';

interface Mikrotik {
  id: string;
  nome: string;
  token: string;
  online: boolean;
  heartbeat_version?: string;
  macs_conectados: number;
  total_macs: number;
  total_vendas: number;
  total_valor: number;
}

function MikrotikList() {
  const [mikrotiks, setMikrotiks] = useState<Mikrotik[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMikrotiks();
  }, []);

  async function loadMikrotiks() {
    try {
      const { data } = await supabase
        .from('mikrotiks')
        .select('*')
        .order('created_at', { ascending: false });
      
      setMikrotiks(data || []);
    } catch (error) {
      console.error('Erro ao carregar MikroTiks:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleEdit(mikrotik: Mikrotik) {
    // Implement edit functionality
  }

  async function handleDelete(mikrotik: Mikrotik) {
    // Implement delete functionality
  }

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      {mikrotiks.map((mikrotik) => (
        <div key={mikrotik.id} className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className={`w-3 h-3 rounded-full ${mikrotik.online ? 'bg-green-500' : 'bg-red-500'}`} />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">{mikrotik.nome}</h3>
                <p className="text-sm text-gray-500">{mikrotik.token}</p>
                {mikrotik.heartbeat_version && (
                  <p className="text-sm text-gray-600 mt-1">
                    RouterOS {mikrotik.heartbeat_version}
                  </p>
                )}
                <div className="mt-2 grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500">MACs Ativos</span>
                    <span className="font-medium">{mikrotik.macs_conectados || 0}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500">Total de MACs</span>
                    <span className="font-medium">{mikrotik.total_macs || 0}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500">Vendas</span>
                    <span className="font-medium">{mikrotik.total_vendas || 0}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500">Valor Total</span>
                    <span className="font-medium">{formatCurrency(mikrotik.total_valor || 0)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit(mikrotik)}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700"
                onClick={() => handleDelete(mikrotik)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
      {mikrotiks.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Router className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Nenhum MikroTik cadastrado</p>
          <p className="text-sm">Clique no botão acima para adicionar</p>
        </div>
      )}
    </div>
  );
}

export default MikrotikList; 