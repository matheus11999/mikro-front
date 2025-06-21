import React, { useState, useEffect } from 'react';
import { Wallet, Clock, CheckCircle, XCircle, Search, Filter, DollarSign, TrendingUp, Users, Upload, Eye, Download, AlertCircle } from 'lucide-react';
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
  clientes?: {
    nome: string;
    email: string;
  };
}

const WithdrawalsManagement = () => {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [selectedProofUrl, setSelectedProofUrl] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('withdrawals')
        .select(`
          *,
          clientes (
            nome,
            email
          )
        `)
        .order('requestdate', { ascending: false });

      if (error) {
        console.error('Erro ao buscar saques:', error);
        toast.error('Erro ao carregar saques');
        setWithdrawals([]);
        return;
      }

      setWithdrawals(data || []);
    } catch (error) {
      console.error('Erro inesperado:', error);
      toast.error('Erro inesperado ao carregar dados');
      setWithdrawals([]);
    } finally {
      setLoading(false);
    }
  };

  const openApprovalModal = (withdrawal: Withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setShowApprovalModal(true);
    setProofFile(null);
  };

  const openRejectionModal = (withdrawal: Withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setShowRejectionModal(true);
    setRejectionReason('');
  };

  const openProofModal = (url: string) => {
    setSelectedProofUrl(url);
    setShowProofModal(true);
  };

  const uploadProofOfPayment = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `withdrawal-proofs/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('withdrawal-proofs')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Erro no upload:', uploadError);
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('withdrawal-proofs')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Erro inesperado no upload:', error);
      return null;
    }
  };

  const handleApproveWithdrawal = async () => {
    if (!selectedWithdrawal) return;

    setProcessing(true);
    try {
      let proofUrl = null;

      // Upload do comprovante se foi fornecido
      if (proofFile) {
        setUploading(true);
        proofUrl = await uploadProofOfPayment(proofFile);
        if (!proofUrl) {
          toast.error('Erro no upload do comprovante');
          return;
        }
        setUploading(false);
      }

      // Obter dados do usuário atual (admin)
      const { data: { user } } = await supabase.auth.getUser();
      const adminEmail = user?.email || 'Admin';

      // Atualizar o saque
      const { error } = await supabase
        .from('withdrawals')
        .update({
          status: 'completed',
          processeddate: new Date().toISOString(),
          proof_of_payment_url: proofUrl,
          approved_by: adminEmail,
          approved_at: new Date().toISOString()
        })
        .eq('id', selectedWithdrawal.id);

      if (error) {
        console.error('Erro ao aprovar saque:', error);
        toast.error('Erro ao aprovar saque');
        return;
      }

      toast.success('Saque aprovado com sucesso!');
      setShowApprovalModal(false);
      setSelectedWithdrawal(null);
      setProofFile(null);
      await fetchWithdrawals();

    } catch (error) {
      console.error('Erro inesperado:', error);
      toast.error('Erro inesperado ao processar saque');
    } finally {
      setProcessing(false);
      setUploading(false);
    }
  };

  const handleRejectWithdrawal = async () => {
    if (!selectedWithdrawal || !rejectionReason.trim()) {
      toast.error('Motivo da rejeição é obrigatório');
      return;
    }

    setProcessing(true);
    try {
      // Obter dados do usuário atual (admin)
      const { data: { user } } = await supabase.auth.getUser();
      const adminEmail = user?.email || 'Admin';

      // Reverter o saldo do cliente
      const { error: balanceError } = await supabase.rpc('increment_client_balance', {
        client_id: selectedWithdrawal.cliente_id,
        amount: selectedWithdrawal.amount
      });

      if (balanceError) {
        console.error('Erro ao reverter saldo:', balanceError);
        // Continuar mesmo se não conseguir reverter automaticamente
      }

      // Atualizar o saque
      const { error } = await supabase
        .from('withdrawals')
        .update({
          status: 'rejected',
          processeddate: new Date().toISOString(),
          rejection_reason: rejectionReason.trim(),
          approved_by: adminEmail
        })
        .eq('id', selectedWithdrawal.id);

      if (error) {
        console.error('Erro ao rejeitar saque:', error);
        toast.error('Erro ao rejeitar saque');
        return;
      }

      toast.success('Saque rejeitado e saldo revertido!');
      setShowRejectionModal(false);
      setSelectedWithdrawal(null);
      setRejectionReason('');
      await fetchWithdrawals();

    } catch (error) {
      console.error('Erro inesperado:', error);
      toast.error('Erro inesperado ao processar saque');
    } finally {
      setProcessing(false);
    }
  };

  const filteredWithdrawals = withdrawals.filter(withdrawal => {
    const userName = withdrawal.clientes?.nome || '';
    const userEmail = withdrawal.clientes?.email || '';
    const matchesSearch = userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         withdrawal.pixkey.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || withdrawal.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = withdrawals.filter(w => w.status === 'pending').length;
  const completedCount = withdrawals.filter(w => w.status === 'completed').length;
  const rejectedCount = withdrawals.filter(w => w.status === 'rejected').length;
  const totalPending = withdrawals
    .filter(w => w.status === 'pending')
    .reduce((sum, w) => sum + Number(w.amount || 0), 0);

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
            Gerenciar Saques
          </h1>
          <p className="text-gray-600 mt-1">Processamento de solicitações de saque</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-xl font-bold text-gray-900">{pendingCount}</p>
              <p className="text-sm text-gray-600">Pendentes</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-xl font-bold text-gray-900">{completedCount}</p>
              <p className="text-sm text-gray-600">Aprovados</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-xl font-bold text-gray-900">{rejectedCount}</p>
              <p className="text-sm text-gray-600">Rejeitados</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-xl font-bold text-gray-900">R$ {totalPending.toFixed(2)}</p>
              <p className="text-sm text-gray-600">Valor Pendente</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-group">
            <label className="form-label flex items-center gap-2">
              <Search className="w-4 h-4" />
              Buscar
            </label>
            <input
              type="text"
              placeholder="Digite nome do usuário, email ou chave PIX..."
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Solicitações de Saque ({filteredWithdrawals.length})</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuário</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chave PIX</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Solicitação</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comprovante</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredWithdrawals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center">
                    <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhum saque encontrado</p>
                  </td>
                </tr>
              ) : (
                filteredWithdrawals.map((withdrawal) => (
                  <tr key={withdrawal.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                          <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {withdrawal.clientes?.nome || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {withdrawal.clientes?.email || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
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
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          withdrawal.status === 'pending' 
                            ? 'bg-yellow-100 text-yellow-800'
                            : withdrawal.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {withdrawal.status === 'pending' ? 'Pendente' : 
                           withdrawal.status === 'completed' ? 'Aprovado' : 'Rejeitado'}
                        </span>
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
                      {withdrawal.proof_of_payment_url ? (
                        <button
                          onClick={() => openProofModal(withdrawal.proof_of_payment_url!)}
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          Ver
                        </button>
                      ) : (
                        withdrawal.status === 'completed' ? 'Sem comprovante' : '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {withdrawal.status === 'pending' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openApprovalModal(withdrawal)}
                            className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded-md transition-colors"
                          >
                            Aprovar
                          </button>
                          <button
                            onClick={() => openRejectionModal(withdrawal)}
                            className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 rounded-md transition-colors"
                          >
                            Rejeitar
                          </button>
                        </div>
                      )}
                      {withdrawal.status !== 'pending' && withdrawal.approved_by && (
                        <div className="text-xs text-gray-500">
                          Por: {withdrawal.approved_by}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approval Modal */}
      {showApprovalModal && selectedWithdrawal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Aprovar Saque</h2>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">Cliente: <span className="font-medium">{selectedWithdrawal.clientes?.nome}</span></p>
                <p className="text-sm text-gray-600">Valor: <span className="font-medium">R$ {Number(selectedWithdrawal.amount).toFixed(2)}</span></p>
                <p className="text-sm text-gray-600">PIX: <span className="font-medium font-mono">{selectedWithdrawal.pixkey}</span></p>
              </div>

              <div className="form-group">
                <label className="form-label">Comprovante de Pagamento (opcional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                  className="input-field"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Formatos aceitos: JPG, PNG, PDF
                </p>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowApprovalModal(false)}
                  className="btn-secondary flex-1"
                  disabled={processing || uploading}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleApproveWithdrawal}
                  className="btn-primary flex-1"
                  disabled={processing || uploading}
                >
                  {uploading ? 'Enviando...' : processing ? 'Aprovando...' : 'Aprovar Saque'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && selectedWithdrawal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Rejeitar Saque</h2>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">Cliente: <span className="font-medium">{selectedWithdrawal.clientes?.nome}</span></p>
                <p className="text-sm text-gray-600">Valor: <span className="font-medium">R$ {Number(selectedWithdrawal.amount).toFixed(2)}</span></p>
                <p className="text-sm text-gray-600">PIX: <span className="font-medium font-mono">{selectedWithdrawal.pixkey}</span></p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" />
                  <div className="text-sm text-yellow-700">
                    <p className="font-medium">Importante:</p>
                    <p>O valor será devolvido ao saldo do cliente automaticamente.</p>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Motivo da Rejeição *</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="input-field"
                  rows={3}
                  placeholder="Explique o motivo da rejeição..."
                  required
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowRejectionModal(false)}
                  className="btn-secondary flex-1"
                  disabled={processing}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleRejectWithdrawal}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors flex-1"
                  disabled={processing || !rejectionReason.trim()}
                >
                  {processing ? 'Rejeitando...' : 'Rejeitar Saque'}
                </button>
              </div>
            </div>
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

export default WithdrawalsManagement;
