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
  FileText,
  Download,
  ExternalLink,
  Wallet
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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

    await processWithdrawal(selectedWithdrawal.id, 'approved', {
      proof_of_payment_url: finalProofUrl || null
    });
  };

  const handleSubmitRejection = async () => {
    if (!selectedWithdrawal || !rejectionReason.trim()) {
      toast.error('Motivo da rejeição é obrigatório');
      return;
    }

    await processWithdrawal(selectedWithdrawal.id, 'rejected', {
      rejection_reason: rejectionReason.trim()
    });
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

  // Filtrar saques
  const filteredWithdrawals = withdrawals.filter(withdrawal => {
    const matchesSearch = 
      withdrawal.clientes?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      withdrawal.clientes?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      withdrawal.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || withdrawal.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Estatísticas
  const stats = {
    total: withdrawals.length,
    pending: withdrawals.filter(w => w.status === 'pending').length,
    approved: withdrawals.filter(w => w.status === 'approved').length,
    rejected: withdrawals.filter(w => w.status === 'rejected').length,
    totalAmount: withdrawals.reduce((sum, w) => sum + w.amount, 0),
    pendingAmount: withdrawals.filter(w => w.status === 'pending').reduce((sum, w) => sum + w.amount, 0)
  };

  if (loading) {
    return (
      <div className="p-6 space-y-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-3 text-lg text-gray-600">Carregando saques...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Gerenciar Saques</h1>
          <p className="text-gray-600 mt-2">
            Analise e processe solicitações de saque dos clientes
          </p>
        </div>
        <Button 
          onClick={loadWithdrawals}
          variant="outline"
          className="w-fit"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Saques</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.totalAmount)} solicitados
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
              {formatCurrency(stats.pendingAmount)} aguardando
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
              Saques processados
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

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por cliente, email ou ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
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
          <CardTitle>Solicitações de Saque</CardTitle>
          <CardDescription>
            {filteredWithdrawals.length} de {withdrawals.length} solicitações
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredWithdrawals.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum saque encontrado</h3>
              <p className="text-gray-600">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Tente ajustar os filtros de busca' 
                  : 'Ainda não há solicitações de saque'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data Solicitação</TableHead>
                    <TableHead>Chave PIX</TableHead>
                    <TableHead>Comprovante</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWithdrawals.map((withdrawal) => (
                    <TableRow key={withdrawal.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {withdrawal.clientes?.nome || 'Nome não disponível'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {withdrawal.clientes?.email || 'Email não disponível'}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className="font-semibold text-green-600">
                            {formatCurrency(withdrawal.amount)}
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
                        <div className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                          {withdrawal.clientes?.chave_pix || 'Não informado'}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {withdrawal.status === 'pending' ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(withdrawal)}
                              disabled={processing === withdrawal.id}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {processing === withdrawal.id ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <Check className="w-3 h-3" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(withdrawal)}
                              disabled={processing === withdrawal.id}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500">
                            {withdrawal.processeddate && (
                              <div>Processado em {formatDate(withdrawal.processeddate)}</div>
                            )}
                            {withdrawal.rejection_reason && (
                              <div className="text-red-600 mt-1">
                                Motivo: {withdrawal.rejection_reason}
                              </div>
                            )}
                          </div>
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

      {/* Modal de Aprovação com Comprovante */}
             <Dialog open={showProofModal} onOpenChange={(open) => setShowProofModal(open)}>
         <DialogContent className="sm:max-w-md">
           <DialogHeader>
             <DialogTitle>Aprovar Saque</DialogTitle>
             <DialogDescription>
               Envie o comprovante de pagamento para aprovar o saque de{' '}
               <strong>{formatCurrency(selectedWithdrawal?.amount || 0)}</strong> para{' '}
               <strong>{selectedWithdrawal?.clientes?.nome}</strong>
             </DialogDescription>
           </DialogHeader>
          
          <div className="space-y-4">
            {/* Upload de arquivo */}
            <div>
              <Label htmlFor="proof-file">Enviar arquivo (JPG, PNG, GIF, PDF - máx 10MB)</Label>
              <Input
                id="proof-file"
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setProofFile(file);
                    setProofUrl(''); // Limpar URL se arquivo foi selecionado
                  }
                }}
                className="mt-1"
              />
              {proofFile && (
                <p className="text-sm text-green-600 mt-1">
                  Arquivo selecionado: {proofFile.name}
                </p>
              )}
            </div>
            
            <div className="text-center text-sm text-gray-500">ou</div>
            
            {/* URL do comprovante */}
            <div>
              <Label htmlFor="proof-url">URL do comprovante</Label>
              <Input
                id="proof-url"
                type="url"
                placeholder="https://exemplo.com/comprovante.jpg"
                value={proofUrl}
                onChange={(e) => {
                  setProofUrl(e.target.value);
                  if (e.target.value) {
                    setProofFile(null); // Limpar arquivo se URL foi inserida
                  }
                }}
                className="mt-1"
              />
            </div>
            
            {selectedWithdrawal?.clientes?.chave_pix && (
              <Alert>
                <CreditCard className="h-4 w-4" />
                <AlertDescription>
                  <strong>Chave PIX:</strong> {selectedWithdrawal.clientes.chave_pix}
                </AlertDescription>
              </Alert>
            )}
          </div>
          
                     <DialogFooter>
             <Button variant="outline" onClick={() => setShowProofModal(false)}>
               Cancelar
             </Button>
             <Button 
               onClick={handleSubmitApproval}
               disabled={uploading}
               className="bg-green-600 hover:bg-green-700"
             >
               {uploading ? (
                 <>
                   <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                   Enviando...
                 </>
               ) : (
                 <>
                   <Check className="w-4 h-4 mr-2" />
                   Aprovar Saque
                 </>
               )}
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>

       {/* Modal de Rejeição */}
       <Dialog open={showRejectModal} onOpenChange={(open) => setShowRejectModal(open)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rejeitar Saque</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição do saque de{' '}
              <strong>{formatCurrency(selectedWithdrawal?.amount || 0)}</strong> para{' '}
              <strong>{selectedWithdrawal?.clientes?.nome}</strong>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection-reason">Motivo da rejeição *</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Descreva o motivo da rejeição..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectModal(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={handleSubmitRejection}
              disabled={!rejectionReason.trim() || processing === selectedWithdrawal?.id}
            >
              {processing === selectedWithdrawal?.id ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Rejeitando...
                </>
              ) : (
                <>
                  <X className="w-4 h-4 mr-2" />
                  Rejeitar Saque
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 