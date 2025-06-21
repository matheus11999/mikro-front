import React, { useState, useEffect } from 'react';
import { Wallet, Clock, CheckCircle, XCircle, Plus, Search, Filter, DollarSign, AlertCircle, Eye, Download } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';

interface Withdrawal {
  id: string;
  cliente_id: string;
  amount: number;
  pixkey: string;
  status: string;
  requestdate: string;
  processeddate?: string;
  proof_of_payment_url?: string;
  approved_by?: string;
  rejection_reason?: string;
  approved_at?: string;
}

interface Cliente {
  id: string;
  nome: string;
  email: string;
  saldo: number;
  chave_pix?: string;
}

const ClientWithdrawals = () => {
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  const [selectedProofUrl, setSelectedProofUrl] = useState('');
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [userWithdrawals, setUserWithdrawals] = useState<Withdrawal[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<Cliente | null>(null);

  useEffect(() => {
    async function initializeData() {
      await getCurrentUser();
    }
    initializeData();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchWithdrawals();
    }
  }, [currentUser]);

  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('Usuário não autenticado');
        setLoading(false);
        return;
      }

      const { data: cliente, error } = await supabase
        .from('clientes')
        .select('id, nome, email, saldo, chave_pix')
        .eq('email', user.email)
        .single();

      if (error) {
        console.error('Erro ao buscar cliente:', error);
        setLoading(false);
        return;
      }

      if (cliente) {
        setCurrentUser(cliente);
        // Pre-preencher chave PIX se existir
        if (cliente.chave_pix) {
          setPixKey(cliente.chave_pix);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      setLoading(false);
    }
  };

  const fetchWithdrawals = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('cliente_id', currentUser.id)
        .order('requestdate', { ascending: false });

      if (error) {
        console.error('Erro ao buscar saques:', error);
        toast.error('Erro ao carregar histórico de saques');
        setUserWithdrawals([]);
        return;
      }

      setUserWithdrawals(data || []);
    } catch (error) {
      console.error('Erro ao buscar saques:', error);
      toast.error('Erro inesperado ao carregar dados');
      setUserWithdrawals([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredWithdrawals = userWithdrawals.filter(withdrawal => {
    const matchesSearch = withdrawal.pixkey.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || withdrawal.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = userWithdrawals.filter(w => w.status === 'pending').length;
  const completedCount = userWithdrawals.filter(w => w.status === 'completed').length;
  const rejectedCount = userWithdrawals.filter(w => w.status === 'rejected').length;
  const totalPending = userWithdrawals
    .filter(w => w.status === 'pending')
    .reduce((sum, w) => sum + Number(w.amount || 0), 0);

  const handleRequestWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      toast.error('Usuário não encontrado');
      return;
    }

    const amount = parseFloat(withdrawalAmount);
    
    // Validações
    if (!amount || amount <= 0) {
      toast.error('Valor deve ser maior que zero');
      return;
    }

    if (amount > currentUser.saldo) {
      toast.error('Saldo insuficiente');
      return;
    }

    if (!pixKey.trim()) {
      toast.error('Chave PIX é obrigatória');
      return;
    }

    // Valor mínimo para saque
    if (amount < 50) {
      toast.error('Valor mínimo para saque é R$ 50,00');
      return;
    }

    setSubmitting(true);
    try {
      // Iniciar transação para descontar saldo e criar saque
      const { data: withdrawal, error: withdrawalError } = await supabase
        .from('withdrawals')
        .insert({
          cliente_id: currentUser.id,
          amount: amount,
          pixkey: pixKey.trim(),
          status: 'pending',
          requestdate: new Date().toISOString()
        })
        .select()
        .single();

      if (withdrawalError) {
        console.error('Erro ao solicitar saque:', withdrawalError);
        toast.error('Erro ao solicitar saque. Tente novamente.');
        return;
      }

      // Descontar o valor do saldo do cliente
      const { error: updateError } = await supabase
        .from('clientes')
        .update({ saldo: currentUser.saldo - amount })
        .eq('id', currentUser.id);

      if (updateError) {
        console.error('Erro ao atualizar saldo:', updateError);
        // Reverter o saque se não conseguir atualizar saldo
        await supabase.from('withdrawals').delete().eq('id', withdrawal.id);
        toast.error('Erro ao processar saque. Tente novamente.');
        return;
      }

      // Atualizar chave PIX do cliente se não existir
      if (!currentUser.chave_pix && pixKey.trim()) {
        await supabase
          .from('clientes')
          .update({ chave_pix: pixKey.trim() })
          .eq('id', currentUser.id);
      }

      toast.success('Saque solicitado com sucesso! O valor foi descontado do seu saldo.');
      setShowRequestModal(false);
      setWithdrawalAmount('');
      await fetchWithdrawals();
      
      // Atualizar dados do usuário
      await getCurrentUser();

    } catch (error) {
      console.error('Erro inesperado:', error);
      toast.error('Erro inesperado. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const openProofModal = (url: string) => {
    setSelectedProofUrl(url);
    setShowProofModal(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Pendente</span>;
      case 'completed':
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Aprovado</span>;
      case 'rejected':
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Rejeitado</span>;
      default:
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-6 space-y-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando saques...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center">
            <Wallet className="w-7 h-7 mr-2 text-green-600" />
            Meus Saques
          </h1>
          <p className="text-gray-600 mt-1">Gerencie suas solicitações de saque</p>
          {currentUser && (
            <p className="text-sm text-gray-500 mt-1">
              Saldo disponível: <span className="font-semibold text-green-600">R$ {Number(currentUser.saldo || 0).toFixed(2)}</span>
            </p>
          )}
        </div>
        <button 
          onClick={() => setShowRequestModal(true)}
          className="btn-primary flex items-center gap-2 mt-4 sm:mt-0"
          disabled={!currentUser || currentUser.saldo < 50}
        >
          <Plus className="w-4 h-4" />
          Solicitar Saque
        </button>
      </div>

      {/* Aviso sobre valor mínimo */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-blue-800">Informações importantes</h3>
            <div className="text-sm text-blue-700 mt-1">
              <ul className="list-disc list-inside space-y-1">
                <li>Valor mínimo para saque: R$ 50,00</li>
                <li>O valor é descontado imediatamente do seu saldo</li>
                <li>Processamento em até 24 horas úteis</li>
                <li>Confirme sua chave PIX antes de solicitar</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-lg font-bold text-gray-900">{pendingCount}</p>
              <p className="text-sm text-gray-600">Pendentes</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-lg font-bold text-gray-900">{completedCount}</p>
              <p className="text-sm text-gray-600">Aprovados</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-lg font-bold text-gray-900">{rejectedCount}</p>
              <p className="text-sm text-gray-600">Rejeitados</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-lg font-bold text-gray-900">R$ {totalPending.toFixed(2)}</p>
              <p className="text-sm text-gray-600">Valor Pendente</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-group">
            <label className="form-label flex items-center gap-2">
              <Search className="w-4 h-4" />
              Buscar
            </label>
            <input
              type="text"
              placeholder="Digite a chave PIX..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field"
            />
          </div>

          <div className="form-group">
            <label className="form-label flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">Todos os status</option>
              <option value="pending">Pendente</option>
              <option value="completed">Aprovado</option>
              <option value="rejected">Rejeitado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Withdrawals Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Histórico de Saques ({filteredWithdrawals.length})</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chave PIX</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Solicitação</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Processamento</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comprovante</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredWithdrawals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">
                    <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhum saque encontrado</p>
                  </td>
                </tr>
              ) : (
                filteredWithdrawals.map((withdrawal) => (
                  <tr key={withdrawal.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">R$ {Number(withdrawal.amount || 0).toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded">
                        {withdrawal.pixkey}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        {getStatusBadge(withdrawal.status)}
                        {withdrawal.status === 'rejected' && withdrawal.rejection_reason && (
                          <p className="text-xs text-red-600 max-w-xs">
                            {withdrawal.rejection_reason}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(withdrawal.requestdate).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {withdrawal.processeddate ? 
                        new Date(withdrawal.processeddate).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 
                        '-'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {withdrawal.proof_of_payment_url ? (
                        <button
                          onClick={() => openProofModal(withdrawal.proof_of_payment_url!)}
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          Ver Comprovante
                        </button>
                      ) : (
                        withdrawal.status === 'completed' ? 'Sem comprovante' : '-'
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Request Withdrawal Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Solicitar Saque</h2>
            
            <form onSubmit={handleRequestWithdrawal} className="space-y-4">
              <div className="form-group">
                <label className="form-label">Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="50"
                  max={currentUser?.saldo || 0}
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                  className="input-field"
                  placeholder="0,00"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Disponível: R$ {Number(currentUser?.saldo || 0).toFixed(2)} | Mínimo: R$ 50,00
                </p>
              </div>
              
              <div className="form-group">
                <label className="form-label">Chave PIX</label>
                <input
                  type="text"
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  className="input-field"
                  placeholder="CPF, e-mail, telefone ou chave aleatória"
                  required
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="btn-secondary flex-1"
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={submitting}
                >
                  {submitting ? 'Solicitando...' : 'Solicitar Saque'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Proof of Payment Modal */}
      {showProofModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Comprovante de Pagamento</h2>
              <button
                onClick={() => setShowProofModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="text-center">
              <img 
                src={selectedProofUrl} 
                alt="Comprovante de Pagamento" 
                className="max-w-full max-h-96 mx-auto rounded-lg shadow-lg"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgMTMwQzEwNy4yODkgMTMwIDExMy4xNjkgMTI0LjEyIDExMy4xNjkgMTE2LjgzMUMxMTMuMTY5IDEwOS41NDIgMTA3LjI4OSAxMDMuNjYyIDEwMCAxMDMuNjYyQzkyLjcxMDkgMTAzLjY2MiA4Ni44MzA3IDEwOS41NDIgODYuODMwNyAxMTYuODMxQzg2LjgzMDcgMTI0LjEyIDkyLjcxMDkgMTMwIDEwMCAxMzBaIiBmaWxsPSIjOUI5QjlCIi8+CjxwYXRoIGQ9Ik03NSA3MEgxMjVWODVINzVWNzBaIiBmaWxsPSIjOUI5QjlCIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTYwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOUI5QjlCIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMiI+SW1hZ2VtIG7Do28gZW5jb250cmFkYTwvdGV4dD4KPC9zdmc+';
                }}
              />
              
              <div className="mt-4 flex justify-center">
                <a
                  href={selectedProofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Baixar Comprovante
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientWithdrawals;
