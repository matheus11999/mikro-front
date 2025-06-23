import React, { useState, useEffect } from 'react';
import { 
  Banknote, 
  Filter, 
  Search, 
  Check, 
  X, 
  Clock, 
  TrendingUp,
  User,
  DollarSign,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  CreditCard,
  RefreshCw,
  Upload,
  Image,
  FileText
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

interface Withdrawal {
  id: string;
  cliente_id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  requestdate: string;
  processeddate?: string;
  proof_of_payment_url?: string;
  approved_by?: string;
  rejection_reason?: string;
  clientes?: {
    nome: string;
    email: string;
    chave_pix: string;
  };
}

export default function WithdrawalsManagement() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [processing, setProcessing] = useState<string | null>(null);
  
  // Estados para modal de comprovante
  const [showProofModal, setShowProofModal] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofUrl, setProofUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  
  // Estados para modal de rejeição
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadWithdrawals();
  }, []);

  const loadWithdrawals = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('withdrawals')
        .select(`
          *,
          clientes(nome, email, chave_pix)
        `)
        .order('requestdate', { ascending: false });

      if (error) throw error;
      setWithdrawals(data || []);
    } catch (error) {
      console.error('Erro ao carregar saques:', error);
      toast.error('Erro ao carregar saques');
    } finally {
      setLoading(false);
    }
  };

  const processWithdrawal = async (id: string, status: 'approved' | 'rejected', additionalData?: any) => {
    try {
      setProcessing(id);
      
      const updateData: any = {
        status,
        processeddate: new Date().toISOString(),
        ...additionalData
      };

      const { error } = await supabase
        .from('withdrawals')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      
      toast.success(`Saque ${status === 'approved' ? 'aprovado' : 'rejeitado'} com sucesso!`);
      await loadWithdrawals();
      
      // Fechar modais
      setShowRejectModal(false);
      setShowProofModal(false);
      setSelectedWithdrawal(null);
      setRejectionReason('');
      setProofFile(null);
      setProofUrl('');
      
    } catch (error) {
      console.error('Erro ao processar saque:', error);
      toast.error('Erro ao processar saque');
    } finally {
      setProcessing(null);
    }
  };

  const handleApprove = (withdrawal: Withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setShowProofModal(true);
  };

  const handleReject = (withdrawal: Withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setShowRejectModal(true);
  };

  const handleSubmitApproval = async () => {
    if (!selectedWithdrawal) return;

    let finalProofUrl = proofUrl;

    // Se há arquivo para upload
    if (proofFile) {
      try {
        setUploading(true);
        
        // Validar tipo de arquivo
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
        if (!allowedTypes.includes(proofFile.type)) {
          toast.error('Tipo de arquivo não suportado. Use JPG, PNG, GIF ou PDF.');
          return;
        }

        // Validar tamanho (máx 10MB)
        if (proofFile.size > 10 * 1024 * 1024) {
          toast.error('Arquivo muito grande. Máximo 10MB.');
          return;
        }
        
        // Gerar nome único para o arquivo
        const fileExt = proofFile.name.split('.').pop()?.toLowerCase();
        const fileName = `withdrawal_${selectedWithdrawal.id}_${Date.now()}.${fileExt}`;
        
        // Tentar upload para o Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('withdrawal-proofs')
          .upload(fileName, proofFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Erro no upload:', uploadError);
          
          // Se o bucket não existe, mostrar mensagem específica
          if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('does not exist')) {
            toast.error('Storage não configurado. Use a opção de URL ou configure o bucket no Supabase.');
            return;
          }
          
          toast.error(`Erro no upload: ${uploadError.message}`);
          return;
        }

        // Obter URL pública do arquivo
        const { data: urlData } = supabase.storage
          .from('withdrawal-proofs')
          .getPublicUrl(fileName);

        finalProofUrl = urlData.publicUrl;
        toast.success('Arquivo enviado com sucesso!');
        
      } catch (error: any) {
        console.error('Erro no upload:', error);
        toast.error(`Erro inesperado no upload: ${error.message || 'Tente novamente'}`);
        return;
      } finally {
        setUploading(false);
      }
    }

    // Verificar se há pelo menos uma opção (arquivo ou URL)
    if (!finalProofUrl && !proofFile) {
      // Permitir aprovação sem comprovante
      const confirm = window.confirm('Aprovar saque sem comprovante? Você pode enviar o comprovante posteriormente.');
      if (!confirm) return;
    }

    // Aprovar com comprovante
    await processWithdrawal(selectedWithdrawal.id, 'approved', {
      proof_of_payment_url: finalProofUrl || null,
      approved_by: 'Admin' // Você pode pegar do user context se disponível
    });
  };

  const handleSubmitRejection = async () => {
    if (!selectedWithdrawal || !rejectionReason.trim()) {
      toast.error('Motivo da rejeição é obrigatório');
      return;
    }

    await processWithdrawal(selectedWithdrawal.id, 'rejected', {
      rejection_reason: rejectionReason.trim(),
      approved_by: 'Admin'
    });
  };

  const filteredWithdrawals = withdrawals.filter(withdrawal => {
    const matchesSearch = withdrawal.clientes?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         withdrawal.clientes?.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || withdrawal.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: withdrawals.length,
    pending: withdrawals.filter(w => w.status === 'pending').length,
    approved: withdrawals.filter(w => w.status === 'approved').length,
    rejected: withdrawals.filter(w => w.status === 'rejected').length,
    totalAmount: withdrawals.reduce((sum, w) => sum + w.amount, 0),
    pendingAmount: withdrawals.filter(w => w.status === 'pending').reduce((sum, w) => sum + w.amount, 0)
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'approved':
        return 'Aprovado';
      case 'rejected':
        return 'Rejeitado';
      default:
        return 'Desconhecido';
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 rounded"></div>
            ))}
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciar Saques</h1>
          <p className="text-gray-600 mt-1">
            {filteredWithdrawals.length} saque{filteredWithdrawals.length !== 1 ? 's' : ''} encontrado{filteredWithdrawals.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={loadWithdrawals}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Saques</p>
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Banknote className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xs text-gray-500">
              Total: R$ {stats.totalAmount.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pendentes</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xs text-gray-500">
              Valor: R$ {stats.pendingAmount.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Aprovados</p>
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xs text-green-600 font-medium">
              {stats.total > 0 && `${Math.round((stats.approved / stats.total) * 100)}% aprovados`}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rejeitados</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="all">Todos os status</option>
              <option value="pending">Pendentes</option>
              <option value="approved">Aprovados</option>
              <option value="rejected">Rejeitados</option>
            </select>
          </div>
        </div>
      </div>

      {/* Withdrawals Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Solicitado em
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Comprovante
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredWithdrawals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Banknote className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhum saque encontrado</p>
                  </td>
                </tr>
              ) : (
                filteredWithdrawals.map((withdrawal) => (
                  <tr key={withdrawal.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {withdrawal.clientes?.nome || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {withdrawal.clientes?.email || 'N/A'}
                          </div>
                          {withdrawal.clientes?.chave_pix && (
                            <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                              <CreditCard className="w-3 h-3" />
                              PIX: {withdrawal.clientes.chave_pix.substring(0, 15)}...
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="text-lg font-bold text-green-600">
                          R$ {withdrawal.amount.toFixed(2)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(withdrawal.status)}`}>
                        {getStatusIcon(withdrawal.status)}
                        {getStatusText(withdrawal.status)}
                      </span>
                      {withdrawal.processeddate && (
                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Processado: {new Date(withdrawal.processeddate).toLocaleDateString('pt-BR')}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(withdrawal.requestdate).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(withdrawal.requestdate).toLocaleTimeString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {withdrawal.proof_of_payment_url ? (
                        <a 
                          href={withdrawal.proof_of_payment_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver Comprovante
                        </a>
                      ) : withdrawal.status === 'approved' ? (
                        <span className="text-yellow-600 text-xs font-medium">
                          <AlertCircle className="w-3 h-3 inline mr-1" />
                          Sem comprovante
                        </span>
                      ) : withdrawal.status === 'rejected' && withdrawal.rejection_reason ? (
                        <div className="max-w-32">
                          <span className="text-red-600 text-xs block truncate" title={withdrawal.rejection_reason}>
                            Motivo: {withdrawal.rejection_reason}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {withdrawal.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApprove(withdrawal)}
                            disabled={processing === withdrawal.id}
                            className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            <Check className="w-3 h-3" />
                            {processing === withdrawal.id ? 'Processando...' : 'Aprovar'}
                          </button>
                          <button
                            onClick={() => handleReject(withdrawal)}
                            disabled={processing === withdrawal.id}
                            className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white text-xs rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                          >
                            <X className="w-3 h-3" />
                            {processing === withdrawal.id ? 'Processando...' : 'Rejeitar'}
                          </button>
                        </div>
                      ) : withdrawal.status === 'approved' ? (
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-green-600 text-xs font-medium">✓ Aprovado</span>
                          {!withdrawal.proof_of_payment_url && (
                            <button
                              onClick={() => {
                                setSelectedWithdrawal(withdrawal);
                                setShowProofModal(true);
                              }}
                              className="text-xs text-blue-600 hover:text-blue-800 underline transition-colors"
                            >
                              Enviar Comprovante
                            </button>
                          )}
                        </div>
                      ) : withdrawal.status === 'rejected' ? (
                        <span className="text-red-600 text-xs font-medium">✗ Rejeitado</span>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions for Pending Withdrawals */}
      {stats.pending > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Saques Pendentes</h3>
                <p className="text-sm text-gray-600">
                  Você tem {stats.pending} saque{stats.pending !== 1 ? 's' : ''} pendente{stats.pending !== 1 ? 's' : ''} 
                  no valor total de R$ {stats.pendingAmount.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Processar em lote:</span>
              <button
                onClick={() => {
                  const pendingIds = withdrawals
                    .filter(w => w.status === 'pending')
                    .map(w => w.id);
                  
                  if (confirm(`Aprovar todos os ${stats.pending} saques pendentes?`)) {
                    pendingIds.forEach(id => processWithdrawal(id, 'approved'));
                  }
                }}
                className="px-3 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 transition-colors"
              >
                Aprovar Todos
              </button>
            </div>
          </div>
        </div>
      )}

              {/* Modal de Aprovação com Comprovante */}
        {showProofModal && selectedWithdrawal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <Check className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Aprovar Saque</h2>
                  <p className="text-sm text-gray-600">R$ {selectedWithdrawal.amount.toFixed(2)} para {selectedWithdrawal.clientes?.nome}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Upload className="w-4 h-4 inline mr-1" />
                    Upload do Comprovante (JPG, PNG, GIF, PDF - máx 10MB)
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,application/pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        
                        // Validação client-side
                        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
                        if (!allowedTypes.includes(file.type)) {
                          toast.error('Tipo de arquivo não suportado. Use JPG, PNG, GIF ou PDF.');
                          e.target.value = '';
                          return;
                        }

                        if (file.size > 10 * 1024 * 1024) {
                          toast.error('Arquivo muito grande. Máximo 10MB.');
                          e.target.value = '';
                          return;
                        }

                        setProofFile(file);
                        setProofUrl(''); // Limpar URL se arquivo foi selecionado
                      }
                    }}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  {proofFile && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-xs text-green-700 flex items-center">
                        <FileText className="w-3 h-3 mr-1" />
                        <span className="font-medium">{proofFile.name}</span>
                        <span className="ml-2 text-green-600">({(proofFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                      </p>
                    </div>
                  )}
                </div>

                <div className="text-center">
                  <span className="text-sm text-gray-500">ou</span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Image className="w-4 h-4 inline mr-1" />
                    URL do Comprovante
                  </label>
                  <input
                    type="url"
                    placeholder="https://exemplo.com/comprovante.jpg"
                    value={proofUrl}
                    onChange={(e) => {
                      setProofUrl(e.target.value);
                      if (e.target.value.trim()) {
                        setProofFile(null); // Limpar arquivo se URL foi preenchida
                      }
                    }}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-start">
                    <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 mr-2" />
                    <div className="text-xs text-yellow-800">
                      <p className="font-medium">Opcional:</p>
                      <p>Você pode aprovar sem comprovante. O comprovante pode ser enviado posteriormente.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowProofModal(false);
                    setSelectedWithdrawal(null);
                    setProofFile(null);
                    setProofUrl('');
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={uploading || processing}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmitApproval}
                  disabled={uploading || processing}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Enviando...' : processing ? 'Aprovando...' : 'Aprovar Saque'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Rejeição */}
        {showRejectModal && selectedWithdrawal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                  <X className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Rejeitar Saque</h2>
                  <p className="text-sm text-gray-600">R$ {selectedWithdrawal.amount.toFixed(2)} para {selectedWithdrawal.clientes?.nome}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motivo da Rejeição <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Ex: Chave PIX inválida, dados incorretos, etc."
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {rejectionReason.length}/500 caracteres
                  </p>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-start">
                    <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 mr-2" />
                    <div className="text-xs text-red-800">
                      <p className="font-medium">Atenção:</p>
                      <p>O valor será devolvido ao saldo do cliente após a rejeição.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowRejectModal(false);
                    setSelectedWithdrawal(null);
                    setRejectionReason('');
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={processing}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmitRejection}
                  disabled={!rejectionReason.trim() || processing}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? 'Rejeitando...' : 'Rejeitar Saque'}
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
} 