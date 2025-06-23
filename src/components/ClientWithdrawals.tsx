import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Plus, 
  Search, 
  DollarSign, 
  AlertCircle, 
  Eye, 
  RefreshCw,
  CreditCard,
  Calendar,
  TrendingUp,
  TrendingDown,
  Ban,
  ExternalLink
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
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

  const stats = {
    pending: userWithdrawals.filter(w => w.status === 'pending').length,
    approved: userWithdrawals.filter(w => w.status === 'approved').length,
    rejected: userWithdrawals.filter(w => w.status === 'rejected').length,
    totalPending: userWithdrawals
      .filter(w => w.status === 'pending')
      .reduce((sum, w) => sum + Number(w.amount || 0), 0),
    totalWithdrawn: userWithdrawals
      .filter(w => w.status === 'approved')
      .reduce((sum, w) => sum + Number(w.amount || 0), 0)
  };

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
        
        // Tratamento específico para erro de RLS
        if (withdrawalError.code === '42501') {
          toast.error('Erro de permissão: As políticas de segurança não estão configuradas corretamente. Entre em contato com o administrador.');
        } else if (withdrawalError.code === '23503') {
          toast.error('Erro de referência: Dados do cliente inválidos.');
        } else {
          toast.error(`Erro ao solicitar saque: ${withdrawalError.message || 'Tente novamente.'}`);
        }
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

      // Atualizar o saldo local
      setCurrentUser(prev => prev ? { ...prev, saldo: prev.saldo - amount } : null);

      // Atualizar chave PIX se foi alterada
      if (currentUser.chave_pix !== pixKey.trim()) {
        await supabase
          .from('clientes')
          .update({ chave_pix: pixKey.trim() })
          .eq('id', currentUser.id);
      }

      toast.success('Saque solicitado com sucesso!');
      setShowRequestModal(false);
      setWithdrawalAmount('');
      await fetchWithdrawals();

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'approved': return 'Aprovado';
      case 'rejected': return 'Rejeitado';
      default: return 'Desconhecido';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-3 text-lg text-gray-600">Carregando seus saques...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Meus Saques</h1>
          <p className="text-gray-600 mt-2">
            Solicite saques e acompanhe o status das suas solicitações
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={fetchWithdrawals}
            variant="outline"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button 
            onClick={() => setShowRequestModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Solicitar Saque
          </Button>
        </div>
      </div>

      {/* Saldo e Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Saldo Atual</CardTitle>
            <Wallet className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">
              {formatCurrency(currentUser?.saldo || 0)}
            </div>
            <p className="text-xs text-blue-700">
              Disponível para saque
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.totalPending)} aguardando
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.totalWithdrawn)} recebidos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejeitados</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <p className="text-xs text-muted-foreground">
              Solicitações negadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Informações importantes */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Informações importantes:</strong> Valor mínimo para saque é R$ 50,00. 
          Os saques são processados em até 24 horas úteis após aprovação.
        </AlertDescription>
      </Alert>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por chave PIX..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="approved">Aprovados</SelectItem>
                <SelectItem value="rejected">Rejeitados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Withdrawals Table */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Saques</CardTitle>
          <CardDescription>
            {filteredWithdrawals.length} de {userWithdrawals.length} solicitações
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredWithdrawals.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum saque encontrado</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Tente ajustar os filtros de busca' 
                  : 'Você ainda não fez nenhuma solicitação de saque'}
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Button onClick={() => setShowRequestModal(true)} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Fazer primeira solicitação
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Valor</TableHead>
                    <TableHead>Chave PIX</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data Solicitação</TableHead>
                    <TableHead>Data Processamento</TableHead>
                    <TableHead>Comprovante</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWithdrawals.map((withdrawal) => (
                    <TableRow key={withdrawal.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className="font-semibold text-green-600">
                            {formatCurrency(withdrawal.amount)}
                          </span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-gray-400" />
                          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                            {withdrawal.pixkey}
                          </span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge className={`${getStatusColor(withdrawal.status)} border`}>
                          {getStatusIcon(withdrawal.status)}
                          <span className="ml-1">{getStatusText(withdrawal.status)}</span>
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">
                            {formatDate(withdrawal.requestdate)}
                          </span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {withdrawal.processeddate ? (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">
                              {formatDate(withdrawal.processeddate)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Não processado</span>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        {withdrawal.proof_of_payment_url ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openProofModal(withdrawal.proof_of_payment_url!)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Ver
                          </Button>
                        ) : withdrawal.status === 'rejected' && withdrawal.rejection_reason ? (
                          <div className="text-xs text-red-600">
                            Rejeitado: {withdrawal.rejection_reason}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Sem comprovante</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Solicitação de Saque */}
      <Dialog open={showRequestModal} onOpenChange={(open) => setShowRequestModal(open)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Solicitar Saque</DialogTitle>
            <DialogDescription>
              Preencha os dados para solicitar um saque via PIX
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleRequestWithdrawal} className="space-y-4">
            <div>
              <Label htmlFor="amount">Valor do Saque *</Label>
              <div className="relative mt-1">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="amount"
                  type="number"
                  placeholder="0,00"
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                  className="pl-10"
                  min="50"
                  step="0.01"
                  max={currentUser?.saldo || 0}
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Mínimo: R$ 50,00 | Disponível: {formatCurrency(currentUser?.saldo || 0)}
              </p>
            </div>

            <div>
              <Label htmlFor="pixkey">Chave PIX *</Label>
              <div className="relative mt-1">
                <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="pixkey"
                  type="text"
                  placeholder="CPF, CNPJ, email, telefone ou chave aleatória"
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Verifique se a chave PIX está correta. Após a aprovação, o valor será transferido para esta chave.
              </AlertDescription>
            </Alert>
          </form>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRequestModal(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleRequestWithdrawal}
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Solicitando...
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4 mr-2" />
                  Solicitar Saque
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Comprovante */}
      <Dialog open={showProofModal} onOpenChange={(open) => setShowProofModal(open)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Comprovante de Pagamento</DialogTitle>
            <DialogDescription>
              Visualização do comprovante enviado pelo administrador
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-center">
            {selectedProofUrl && (
                             <img 
                 src={selectedProofUrl} 
                 alt="Comprovante de pagamento" 
                 className="max-w-full max-h-96 object-contain rounded-lg border"
                 onError={(e) => {
                   const target = e.currentTarget as HTMLImageElement;
                   const nextElement = target.nextElementSibling as HTMLElement;
                   target.style.display = 'none';
                   if (nextElement) {
                     nextElement.style.display = 'block';
                   }
                 }}
               />
            )}
            <div className="hidden text-center py-8">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Não foi possível carregar o comprovante</p>
              <Button 
                variant="outline" 
                onClick={() => window.open(selectedProofUrl, '_blank')}
                className="mt-2"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Abrir em nova aba
              </Button>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProofModal(false)}>
              Fechar
            </Button>
            <Button 
              onClick={() => window.open(selectedProofUrl, '_blank')}
              variant="outline"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Abrir em nova aba
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientWithdrawals;
