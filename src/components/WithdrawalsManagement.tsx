import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Search, 
  Filter, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Upload, 
  Eye, 
  Download, 
  AlertCircle,
  CheckCircle2,
  MoreHorizontal,
  FileText,
  Calendar,
  RefreshCw,
  CreditCard
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabaseClient';
import { useLogger } from '@/lib/logger';
import { toast } from 'sonner';

interface Withdrawal {
  id: string;
  cliente_id: string;
  amount: number;
  pixkey: string;
  status: 'pending' | 'completed' | 'rejected';
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
  const log = useLogger('WithdrawalsManagement');
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  
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
    log.mount();
    fetchWithdrawals();
    
    return () => {
      log.unmount();
    };
  }, []);

  const fetchWithdrawals = async () => {
    const timerId = log.startTimer('fetch-withdrawals');
    
    try {
      log.info('Fetching withdrawals');
      setLoading(true);
      setError('');
      
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
        log.error('Failed to fetch withdrawals', error);
        throw error;
      }

      setWithdrawals(data || []);
      log.info('Withdrawals fetched successfully', { count: data?.length });
      
    } catch (err) {
      log.error('Failed to fetch withdrawals', err);
      setError('Erro ao carregar saques');
      setWithdrawals([]);
    } finally {
      setLoading(false);
      log.endTimer(timerId, 'fetch-withdrawals');
    }
  };

  const uploadProofOfPayment = async (file: File): Promise<string | null> => {
    const timerId = log.startTimer('upload-proof');
    
    try {
      log.info('Uploading proof of payment');
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `withdrawal-proofs/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('withdrawal-proofs')
        .upload(filePath, file);

      if (uploadError) {
        log.error('Failed to upload proof', uploadError);
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('withdrawal-proofs')
        .getPublicUrl(filePath);

      log.info('Proof uploaded successfully');
      return publicUrl;
      
    } catch (err) {
      log.error('Failed to upload proof', err);
      return null;
    } finally {
      log.endTimer(timerId, 'upload-proof');
    }
  };

  const handleApproveWithdrawal = async () => {
    if (!selectedWithdrawal) return;

    const timerId = log.startTimer('approve-withdrawal');
    
    try {
      log.info('Approving withdrawal', { id: selectedWithdrawal.id });
      setProcessing(true);
      setError('');
      
      let proofUrl = null;

      // Upload do comprovante se foi fornecido
      if (proofFile) {
        setUploading(true);
        proofUrl = await uploadProofOfPayment(proofFile);
        if (!proofUrl) {
          throw new Error('Erro no upload do comprovante');
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

      if (error) throw error;

      setSuccess('Saque aprovado com sucesso!');
      setShowApprovalModal(false);
      setSelectedWithdrawal(null);
      setProofFile(null);
      await fetchWithdrawals();
      log.info('Withdrawal approved successfully');

    } catch (err) {
      log.error('Failed to approve withdrawal', err);
      setError(`Erro ao aprovar saque: ${err.message}`);
    } finally {
      setProcessing(false);
      setUploading(false);
      log.endTimer(timerId, 'approve-withdrawal');
    }
  };

  const handleRejectWithdrawal = async () => {
    if (!selectedWithdrawal || !rejectionReason.trim()) {
      setError('Motivo da rejeição é obrigatório');
      return;
    }

    const timerId = log.startTimer('reject-withdrawal');
    
    try {
      log.info('Rejecting withdrawal', { id: selectedWithdrawal.id });
      setProcessing(true);
      setError('');
      
      // Obter dados do usuário atual (admin)
      const { data: { user } } = await supabase.auth.getUser();
      const adminEmail = user?.email || 'Admin';

      // Reverter o saldo do cliente
      const { error: balanceError } = await supabase.rpc('increment_client_balance', {
        client_id: selectedWithdrawal.cliente_id,
        amount: selectedWithdrawal.amount
      });

      if (balanceError) {
        log.warn('Failed to revert balance automatically', balanceError);
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

      if (error) throw error;

      setSuccess('Saque rejeitado e saldo revertido!');
      setShowRejectionModal(false);
      setSelectedWithdrawal(null);
      setRejectionReason('');
      await fetchWithdrawals();
      log.info('Withdrawal rejected successfully');

    } catch (err) {
      log.error('Failed to reject withdrawal', err);
      setError(`Erro ao rejeitar saque: ${err.message}`);
    } finally {
      setProcessing(false);
      log.endTimer(timerId, 'reject-withdrawal');
    }
  };

  const filteredWithdrawals = withdrawals.filter(withdrawal => {
    const userName = withdrawal.clientes?.nome || '';
    const userEmail = withdrawal.clientes?.email || '';
    const pixKey = withdrawal.pixkey || '';
    
    const matchesSearch = 
      userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pixKey.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || withdrawal.status === statusFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const withdrawalDate = new Date(withdrawal.requestdate);
      const now = new Date();
      
      switch (dateFilter) {
        case 'today':
          matchesDate = withdrawalDate.toDateString() === now.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = withdrawalDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          matchesDate = withdrawalDate >= monthAgo;
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const stats = {
    total: withdrawals.length,
    pending: withdrawals.filter(w => w.status === 'pending').length,
    completed: withdrawals.filter(w => w.status === 'completed').length,
    rejected: withdrawals.filter(w => w.status === 'rejected').length,
    totalPending: withdrawals
      .filter(w => w.status === 'pending')
      .reduce((sum, w) => sum + Number(w.amount || 0), 0),
    totalCompleted: withdrawals
      .filter(w => w.status === 'completed')
      .reduce((sum, w) => sum + Number(w.amount || 0), 0)
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: Withdrawal['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">Pendente</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">Aprovado</Badge>;
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200">Rejeitado</Badge>;
      default:
        return <Badge variant="secondary">Desconhecido</Badge>;
    }
  };

  if (loading && withdrawals.length === 0) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Wallet className="w-8 h-8 text-green-600" />
            Gerenciamento de Saques
          </h1>
          <p className="text-gray-600 mt-1">
            Processamento de solicitações de saque dos clientes
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-4 h-4" />
            Filtros
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={fetchWithdrawals}>
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Alert Messages */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Saques Pendentes
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.pending}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <div className="flex items-center mt-4 gap-2">
              <div className="flex items-center gap-1 text-yellow-600">
                <span className="text-sm font-medium">
                  {formatCurrency(stats.totalPending)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Saques Aprovados
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.completed}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="flex items-center mt-4 gap-2">
              <div className="flex items-center gap-1 text-green-600">
                <span className="text-sm font-medium">
                  {formatCurrency(stats.totalCompleted)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Saques Rejeitados
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.rejected}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="flex items-center mt-4 gap-2">
              <div className="flex items-center gap-1 text-red-600">
                <span className="text-sm font-medium">
                  {Math.round((stats.rejected / stats.total) * 100) || 0}% rejeitados
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total de Saques
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center mt-4 gap-2">
              <div className="flex items-center gap-1 text-blue-600">
                <span className="text-sm font-medium">
                  {formatCurrency(stats.totalPending + stats.totalCompleted)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-lg font-semibold">
                Solicitações de Saque
              </CardTitle>
              <CardDescription>
                Gerencie todas as solicitações de saque
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar saques..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="completed">Aprovado</SelectItem>
                  <SelectItem value="rejected">Rejeitado</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Esta semana</SelectItem>
                  <SelectItem value="month">Este mês</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-100">
                <TableHead className="font-semibold">Cliente</TableHead>
                <TableHead className="font-semibold">Valor</TableHead>
                <TableHead className="font-semibold">Chave PIX</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Data Solicitação</TableHead>
                <TableHead className="font-semibold">Comprovante</TableHead>
                <TableHead className="font-semibold">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWithdrawals.map((withdrawal) => (
                <TableRow key={withdrawal.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {withdrawal.clientes?.nome || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {withdrawal.clientes?.email || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="font-bold text-gray-900">
                      {formatCurrency(withdrawal.amount)}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                      {withdrawal.pixkey}
                    </code>
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      {getStatusBadge(withdrawal.status)}
                      {withdrawal.status === 'rejected' && withdrawal.rejection_reason && (
                        <p className="text-xs text-red-600 max-w-xs">
                          {withdrawal.rejection_reason}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      {formatDate(withdrawal.requestdate)}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {withdrawal.proof_of_payment_url ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedProofUrl(withdrawal.proof_of_payment_url!);
                          setShowProofModal(true);
                        }}
                        className="gap-2 text-blue-600 hover:text-blue-800"
                      >
                        <Eye className="w-4 h-4" />
                        Ver
                      </Button>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    {withdrawal.status === 'pending' ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedWithdrawal(withdrawal);
                              setShowApprovalModal(true);
                              setProofFile(null);
                            }}
                            className="text-green-600"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Aprovar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedWithdrawal(withdrawal);
                              setShowRejectionModal(true);
                              setRejectionReason('');
                            }}
                            className="text-red-600"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Rejeitar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : withdrawal.approved_by ? (
                      <div className="text-xs text-gray-500">
                        Por: {withdrawal.approved_by}
                      </div>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredWithdrawals.length === 0 && (
            <div className="text-center py-12">
              <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">Nenhum saque encontrado</p>
              <p className="text-gray-400 text-sm mt-1">
                {searchTerm || statusFilter !== 'all' || dateFilter !== 'all' ? 
                  'Tente ajustar seus filtros' : 
                  'Não há solicitações de saque no momento'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval Modal */}
      <Dialog open={showApprovalModal} onOpenChange={setShowApprovalModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Aprovar Saque
            </DialogTitle>
            <DialogDescription>
              Confirme a aprovação do saque de {selectedWithdrawal && formatCurrency(selectedWithdrawal.amount)}
            </DialogDescription>
          </DialogHeader>
          
          {selectedWithdrawal && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Cliente:</span>
                  <span className="text-sm font-medium">{selectedWithdrawal.clientes?.nome}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Valor:</span>
                  <span className="text-sm font-bold text-green-600">
                    {formatCurrency(selectedWithdrawal.amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Chave PIX:</span>
                  <code className="text-sm bg-white px-2 py-1 rounded">
                    {selectedWithdrawal.pixkey}
                  </code>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="proof">Comprovante de Pagamento (Opcional)</Label>
                <Input
                  id="proof"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                />
                <p className="text-xs text-gray-500">
                  Faça upload do comprovante de pagamento PIX
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter className="gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setShowApprovalModal(false);
                setSelectedWithdrawal(null);
                setProofFile(null);
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleApproveWithdrawal}
              disabled={processing || uploading}
              className="bg-green-600 hover:bg-green-700"
            >
              {processing || uploading ? 'Processando...' : 'Aprovar Saque'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Modal */}
      <Dialog open={showRejectionModal} onOpenChange={setShowRejectionModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              Rejeitar Saque
            </DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição do saque
            </DialogDescription>
          </DialogHeader>
          
          {selectedWithdrawal && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Cliente:</span>
                  <span className="text-sm font-medium">{selectedWithdrawal.clientes?.nome}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Valor:</span>
                  <span className="text-sm font-bold text-red-600">
                    {formatCurrency(selectedWithdrawal.amount)}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reason">Motivo da Rejeição *</Label>
                <Textarea
                  id="reason"
                  rows={4}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explique o motivo da rejeição..."
                  required
                />
                <p className="text-xs text-gray-500">
                  O saldo será automaticamente revertido para o cliente
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter className="gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setShowRejectionModal(false);
                setSelectedWithdrawal(null);
                setRejectionReason('');
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleRejectWithdrawal}
              disabled={processing || !rejectionReason.trim()}
              variant="destructive"
            >
              {processing ? 'Processando...' : 'Rejeitar Saque'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Proof Modal */}
      <Dialog open={showProofModal} onOpenChange={setShowProofModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Comprovante de Pagamento
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedProofUrl && (
              <div className="text-center">
                {selectedProofUrl.toLowerCase().includes('.pdf') ? (
                  <div className="border rounded-lg p-8">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Arquivo PDF</p>
                    <Button asChild variant="outline">
                      <a href={selectedProofUrl} target="_blank" rel="noopener noreferrer">
                        Abrir PDF
                      </a>
                    </Button>
                  </div>
                ) : (
                  <img 
                    src={selectedProofUrl} 
                    alt="Comprovante" 
                    className="max-w-full h-auto rounded-lg shadow-sm"
                  />
                )}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button asChild variant="outline">
              <a href={selectedProofUrl} target="_blank" rel="noopener noreferrer">
                Abrir em Nova Aba
              </a>
            </Button>
            <Button onClick={() => setShowProofModal(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WithdrawalsManagement; 