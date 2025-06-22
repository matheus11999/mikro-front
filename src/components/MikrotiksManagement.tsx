import React, { useState, useEffect } from 'react';
import { 
  Router, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Users,
  MoreHorizontal,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  DollarSign,
  Percent,
  TrendingUp
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
import { supabase } from '@/lib/supabaseClient';

interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  name?: string;
}

interface Mikrotik {
  id: string;
  nome: string;
  provider_name?: string;
  status: string;
  cliente_id?: string;
  criado_em: string;
  profitpercentage: number;
}

interface Plan {
  id: string;
  nome: string;
  preco: number;
  duracao: number;
  mikrotik_id: string;
  criado_em: string;
}

interface Cliente {
  id: string;
  nome: string;
  email: string;
  role: string;
}

interface MikrotiksManagementProps {
  currentUser?: User;
}

const MikrotiksManagement = ({ currentUser }: MikrotiksManagementProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [showAddPlanModal, setShowAddPlanModal] = useState(false);
  const [selectedMikrotik, setSelectedMikrotik] = useState<Mikrotik | null>(null);
  const [editingMikrotik, setEditingMikrotik] = useState<Mikrotik | null>(null);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  
  const [mikrotiks, setMikrotiks] = useState<Mikrotik[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    nome: '',
    provider_name: '',
    profitpercentage: 10,
    status: 'Ativo',
    cliente_id: ''
  });

  const [showLinkClientModal, setShowLinkClientModal] = useState(false);
  const [linkingMikrotik, setLinkingMikrotik] = useState<Mikrotik | null>(null);
  
  const [planFormData, setPlanFormData] = useState({
    nome: '',
    preco: '',
    duracao: 60
  });
  
  const [filterStatus, setFilterStatus] = useState<'all' | 'Ativo' | 'Inativo'>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      let mikrotiksQuery = supabase.from('mikrotiks').select('*');
      
      // Se não for admin, filtrar apenas mikrotiks do usuário
      if (currentUser?.role !== 'admin' && currentUser?.id) {
        mikrotiksQuery = mikrotiksQuery.eq('cliente_id', currentUser.id);
      }
      
      const [mikrotiksResult, clientesResult] = await Promise.all([
        mikrotiksQuery.order('criado_em', { ascending: false }),
        supabase.from('clientes').select('id, nome, email, role')
      ]);
      
      if (mikrotiksResult.error) throw mikrotiksResult.error;
      if (clientesResult.error) throw clientesResult.error;
      
      setMikrotiks(mikrotiksResult.data || []);
      setClientes(clientesResult.data || []);
      
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err);
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    if (!selectedMikrotik) return;
    
    try {
      const { data: planosData, error } = await supabase
        .from('planos')
        .select('*')
        .eq('mikrotik_id', selectedMikrotik.id)
        .order('criado_em', { ascending: false });
      
      if (error) throw error;
      setPlans(planosData || []);
      
    } catch (err: any) {
      console.error('Erro ao carregar planos:', err);
      setError('Erro ao carregar planos');
    }
  };

  useEffect(() => {
    if (showPlansModal && selectedMikrotik) {
      fetchPlans();
    }
  }, [showPlansModal, selectedMikrotik]);

  const handleCreateMikrotik = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      const mikrotikData = {
        nome: formData.nome,
        provider_name: formData.provider_name,
        profitpercentage: formData.profitpercentage,
        status: formData.status,
        cliente_id: currentUser?.role === 'admin' ? (formData.cliente_id || null) : currentUser?.id
      };
      
      const { error } = await supabase
        .from('mikrotiks')
        .insert([mikrotikData]);
      
      if (error) throw error;
      
      setSuccess('MikroTik criado com sucesso!');
      setShowAddModal(false);
      resetForm();
      await fetchData();
      
    } catch (err: any) {
      console.error('Erro ao criar mikrotik:', err);
      setError('Erro ao criar MikroTik');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMikrotik = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMikrotik) return;
    
    try {
      setLoading(true);
      setError('');
      
             const updateData: any = {
         nome: formData.nome,
         provider_name: formData.provider_name,
         profitpercentage: formData.profitpercentage,
         status: formData.status
       };

       // Se for admin, permite alterar o cliente_id
       if (currentUser?.role === 'admin') {
         updateData.cliente_id = formData.cliente_id || null;
       }
      
      const { error } = await supabase
        .from('mikrotiks')
        .update(updateData)
        .eq('id', editingMikrotik.id);
      
      if (error) throw error;
      
      setSuccess('MikroTik atualizado com sucesso!');
      setShowAddModal(false);
      setEditingMikrotik(null);
      await fetchData();
      
    } catch (err: any) {
      console.error('Erro ao atualizar mikrotik:', err);
      setError('Erro ao atualizar MikroTik');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMikrotik = async (mikrotik: Mikrotik) => {
    if (!confirm(`Tem certeza que deseja excluir o MikroTik "${mikrotik.nome}"?\n\nATENÇÃO: Todos os planos, senhas e dados relacionados também serão excluídos!`)) return;
    
    try {
      setLoading(true);
      setError('');
      
      // 1. Primeiro, buscar todos os planos deste MikroTik
      const { data: planosData } = await supabase
        .from('planos')
        .select('id')
        .eq('mikrotik_id', mikrotik.id);
      
      const planoIds = planosData?.map(p => p.id) || [];
      
      // 2. Deletar todas as senhas relacionadas aos planos deste MikroTik
      if (planoIds.length > 0) {
        const { error: senhasError } = await supabase
          .from('senhas')
          .delete()
          .in('plano_id', planoIds);
        
        if (senhasError) {
          console.warn('Erro ao deletar senhas:', senhasError);
          // Continue mesmo se não conseguir deletar senhas
        }
      }
      
      // 3. Deletar todos os planos deste MikroTik
      const { error: planosError } = await supabase
        .from('planos')
        .delete()
        .eq('mikrotik_id', mikrotik.id);
      
      if (planosError) throw planosError;
      
      // 4. Deletar MACs relacionados
      const { error: macsError } = await supabase
        .from('macs')
        .delete()
        .eq('mikrotik_id', mikrotik.id);
      
      if (macsError) {
        console.warn('Erro ao deletar MACs:', macsError);
        // Continue mesmo se não conseguir deletar MACs
      }
      
      // 5. Finalmente, deletar o MikroTik
      const { error } = await supabase
        .from('mikrotiks')
        .delete()
        .eq('id', mikrotik.id);
      
      if (error) throw error;
      
      setSuccess('MikroTik e todos os dados relacionados foram excluídos com sucesso!');
      await fetchData();
      
    } catch (err: any) {
      console.error('Erro ao excluir mikrotik:', err);
      setError(`Erro ao excluir MikroTik: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMikrotik) return;
    
    try {
      setLoading(true);
      setError('');
      
      const { error } = await supabase
        .from('planos')
        .insert([{
          nome: planFormData.nome,
          preco: parseFloat(planFormData.preco),
          duracao: planFormData.duracao,
          mikrotik_id: selectedMikrotik.id
        }]);
      
      if (error) throw error;
      
      setSuccess('Plano criado com sucesso!');
      setShowAddPlanModal(false);
      setPlanFormData({ nome: '', preco: '', duracao: 60 });
      await fetchPlans();
      
    } catch (err: any) {
      console.error('Erro ao criar plano:', err);
      setError('Erro ao criar plano');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    
    try {
      setLoading(true);
      setError('');
      
      const { error } = await supabase
        .from('planos')
        .update({
          nome: planFormData.nome,
          preco: parseFloat(planFormData.preco),
          duracao: planFormData.duracao
        })
        .eq('id', editingPlan.id);
      
      if (error) throw error;
      
      setSuccess('Plano atualizado com sucesso!');
      setShowAddPlanModal(false);
      setEditingPlan(null);
      await fetchPlans();
      
    } catch (err: any) {
      console.error('Erro ao atualizar plano:', err);
      setError('Erro ao atualizar plano');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlan = async (plan: Plan) => {
    if (!confirm(`Tem certeza que deseja excluir o plano "${plan.nome}"?`)) return;
    
    try {
      const { error } = await supabase
        .from('planos')
        .delete()
        .eq('id', plan.id);
      
      if (error) throw error;
      
      setSuccess('Plano excluído com sucesso!');
      await fetchPlans();
      
    } catch (err: any) {
      console.error('Erro ao excluir plano:', err);
      setError('Erro ao excluir plano');
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      provider_name: '',
      profitpercentage: 10,
      status: 'Ativo',
      cliente_id: ''
    });
  };

  const filteredMikrotiks = mikrotiks.filter(mikrotik => {
    const matchesSearch = mikrotik.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (mikrotik.provider_name && mikrotik.provider_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filterStatus === 'all' || mikrotik.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    if (status === 'Ativo') {
      return <Badge className="bg-green-100 text-green-800">Ativo</Badge>;
    }
    return <Badge variant="secondary" className="bg-red-100 text-red-800">Inativo</Badge>;
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const handleLinkClient = async (mikrotikId: string, clienteId: string) => {
    try {
      setLoading(true);
      setError('');

      const { error } = await supabase
        .from('mikrotiks')
        .update({ cliente_id: clienteId || null })
        .eq('id', mikrotikId);

      if (error) throw error;

      setSuccess('Cliente vinculado com sucesso!');
      setShowLinkClientModal(false);
      setLinkingMikrotik(null);
      fetchData();
      
    } catch (err: any) {
      console.error('Erro ao vincular cliente:', err);
      setError('Erro ao vincular cliente');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlinkClient = async (mikrotikId: string) => {
    try {
      setLoading(true);
      setError('');

      const { error } = await supabase
        .from('mikrotiks')
        .update({ cliente_id: null })
        .eq('id', mikrotikId);

      if (error) throw error;

      setSuccess('Cliente desvinculado com sucesso!');
      fetchData();
      
    } catch (err: any) {
      console.error('Erro ao desvincular cliente:', err);
      setError('Erro ao desvincular cliente');
    } finally {
      setLoading(false);
    }
  };

  const getClientName = (clienteId: string) => {
    const cliente = clientes.find(c => c.id === clienteId);
    return cliente ? `${cliente.nome} (${cliente.email})` : 'Cliente não encontrado';
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-32"></div>
            ))}
          </div>
          <div className="bg-gray-200 rounded-lg h-64"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {currentUser?.role === 'admin' ? 'Gerenciar MikroTiks' : 'Meu MikroTik'}
          </h1>
          <p className="text-gray-600 mt-1">
            {currentUser?.role === 'admin' 
              ? `${filteredMikrotiks.length} equipamento${filteredMikrotiks.length !== 1 ? 's' : ''} cadastrado${filteredMikrotiks.length !== 1 ? 's' : ''}`
              : 'Configure seus equipamentos e planos'
            }
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={fetchData}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </Button>
          <Button
            onClick={() => {
              clearMessages();
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Novo MikroTik
          </Button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}
      
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total MikroTiks</CardTitle>
            <Router className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mikrotiks.length}</div>
            <p className="text-xs text-muted-foreground">
              {mikrotiks.filter(m => m.status === 'Ativo').length} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Médio</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mikrotiks.length > 0 
                ? (mikrotiks.reduce((acc, m) => acc + m.profitpercentage, 0) / mikrotiks.length).toFixed(1)
                : 0
              }%
            </div>
            <p className="text-xs text-muted-foreground">
              Média de todos os equipamentos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Equipamentos Ativos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {mikrotiks.filter(m => m.status === 'Ativo').length}
            </div>
            <p className="text-xs text-muted-foreground">
              De {mikrotiks.length} total
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
                placeholder="Buscar por nome..."
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
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Ativo">Ativos</SelectItem>
                <SelectItem value="Inativo">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* MikroTiks Table */}
      <Card>
        <CardHeader>
          <CardTitle>Equipamentos MikroTik</CardTitle>
          <CardDescription>
            Lista completa de equipamentos cadastrados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>MikroTik</TableHead>
                {currentUser?.role === 'admin' && <TableHead>Proprietário</TableHead>}
                <TableHead>Porcentagem</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMikrotiks.map((mikrotik) => (
                <TableRow key={mikrotik.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Router className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{mikrotik.nome}</div>
                        <div className="text-sm text-gray-500">
                          {mikrotik.provider_name || 'Sem provedor'}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  
                  {currentUser?.role === 'admin' && (
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-600">
                            {mikrotik.cliente_id 
                              ? clientes.find(c => c.id === mikrotik.cliente_id)?.nome || 'Cliente não encontrado'
                              : 'Não vinculado'}
                          </span>
                          {mikrotik.cliente_id && (
                            <span className="text-xs text-gray-400">
                              {clientes.find(c => c.id === mikrotik.cliente_id)?.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                  )}
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                      <span className="font-semibold text-emerald-600">
                        {mikrotik.profitpercentage}%
                      </span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {getStatusBadge(mikrotik.status)}
                  </TableCell>
                  
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => {
                            setSelectedMikrotik(mikrotik);
                            setShowPlansModal(true);
                            clearMessages();
                          }}
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Gerenciar Planos
                        </DropdownMenuItem>
                        
                        {currentUser?.role === 'admin' && (
                          <>
                            <DropdownMenuItem 
                              onClick={() => {
                                setLinkingMikrotik(mikrotik);
                                setShowLinkClientModal(true);
                                clearMessages();
                              }}
                            >
                              <Users className="w-4 h-4 mr-2" />
                              {mikrotik.cliente_id ? 'Alterar Cliente' : 'Vincular Cliente'}
                            </DropdownMenuItem>
                            
                            {mikrotik.cliente_id && (
                              <DropdownMenuItem 
                                onClick={() => {
                                  if (confirm('Tem certeza que deseja desvincular este cliente?')) {
                                    handleUnlinkClient(mikrotik.id);
                                  }
                                }}
                                className="text-orange-600"
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Desvincular Cliente
                              </DropdownMenuItem>
                            )}
                          </>
                        )}
                        
                        <DropdownMenuItem 
                          onClick={() => {
                            setEditingMikrotik(mikrotik);
                            setFormData({
                              nome: mikrotik.nome,
                              provider_name: mikrotik.provider_name || '',
                              profitpercentage: mikrotik.profitpercentage,
                              status: mikrotik.status,
                              cliente_id: mikrotik.cliente_id || ''
                            });
                            clearMessages();
                            setShowAddModal(true);
                          }}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteMikrotik(mikrotik)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredMikrotiks.length === 0 && (
            <div className="text-center py-12">
              <Router className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">Nenhum MikroTik encontrado</p>
              <p className="text-gray-400 text-sm mt-1">
                {searchTerm ? 'Tente ajustar sua busca' : 'Clique em "Novo MikroTik" para começar'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* MikroTik Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingMikrotik ? 'Editar MikroTik' : 'Novo MikroTik'}
            </DialogTitle>
            <DialogDescription>
              {editingMikrotik ? 'Atualize as informações do equipamento' : 'Configure um novo equipamento MikroTik'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={editingMikrotik ? handleUpdateMikrotik : handleCreateMikrotik} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do MikroTik</Label>
                <Input
                  id="nome"
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: MikroTik Central"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="provider_name">Nome do Provedor</Label>
                <Input
                  id="provider_name"
                  value={formData.provider_name}
                  onChange={(e) => setFormData({ ...formData, provider_name: e.target.value })}
                  placeholder="Ex: Internet Central"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="profitpercentage">Porcentagem de Lucro (%)</Label>
                <Input
                  id="profitpercentage"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.profitpercentage}
                  onChange={(e) => setFormData({ ...formData, profitpercentage: parseFloat(e.target.value) })}
                  placeholder="Ex: 10"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {currentUser?.role === 'admin' && (
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="cliente_id">Vincular a Cliente (opcional)</Label>
                  <Select value={formData.cliente_id} onValueChange={(value) => setFormData({ ...formData, cliente_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente ou deixe em branco para sistema" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sistema (sem vinculação)</SelectItem>
                      {clientes.filter(c => c.role === 'user').map((cliente) => (
                        <SelectItem key={cliente.id} value={cliente.id}>
                          {cliente.nome} ({cliente.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            
            <DialogFooter className="gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowAddModal(false);
                  setEditingMikrotik(null);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Processando...' : (editingMikrotik ? 'Atualizar' : 'Criar')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Plans Modal */}
      <Dialog open={showPlansModal} onOpenChange={setShowPlansModal}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Gerenciar Planos - {selectedMikrotik?.nome}
            </DialogTitle>
            <DialogDescription>
              Configure os planos de internet disponíveis para este equipamento
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-medium">Planos Cadastrados</h4>
              <Button 
                onClick={() => {
                  setShowAddPlanModal(true);
                  clearMessages();
                }}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Novo Plano
              </Button>
            </div>
            
            <div className="space-y-3">
              {plans.map((plan) => (
                <div key={plan.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h5 className="font-medium">{plan.nome}</h5>
                    <p className="text-sm text-gray-600">
                      R$ {plan.preco.toFixed(2)} - {plan.duracao} minuto{plan.duracao !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingPlan(plan);
                        setPlanFormData({
                          nome: plan.nome,
                          preco: plan.preco.toString(),
                          duracao: plan.duracao
                        });
                        clearMessages();
                        setShowAddPlanModal(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeletePlan(plan)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {plans.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Settings className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Nenhum plano cadastrado</p>
                  <p className="text-sm">Clique em "Novo Plano" para começar</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Plan Modal */}
      <Dialog open={showAddPlanModal} onOpenChange={setShowAddPlanModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPlan ? 'Editar Plano' : 'Novo Plano'}
            </DialogTitle>
            <DialogDescription>
              {editingPlan ? 'Atualize as informações do plano' : 'Cadastre um novo plano de internet'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={editingPlan ? handleUpdatePlan : handleCreatePlan} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="planNome">Nome do Plano</Label>
              <Input
                id="planNome"
                required
                value={planFormData.nome}
                onChange={(e) => setPlanFormData({ ...planFormData, nome: e.target.value })}
                placeholder="Ex: 1 Hora Premium"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="planPreco">Preço (R$)</Label>
                <Input
                  id="planPreco"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={planFormData.preco}
                  onChange={(e) => setPlanFormData({ ...planFormData, preco: e.target.value })}
                  placeholder="Ex: 5.00"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="planDuracao">Duração (minutos)</Label>
                <Input
                  id="planDuracao"
                  type="number"
                  min="1"
                  required
                  value={planFormData.duracao}
                  onChange={(e) => setPlanFormData({ ...planFormData, duracao: parseInt(e.target.value) })}
                  placeholder="Ex: 60"
                />
              </div>
            </div>
            
            <DialogFooter className="gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowAddPlanModal(false);
                  setEditingPlan(null);
                  setPlanFormData({ nome: '', preco: '', duracao: 60 });
                }}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Processando...' : (editingPlan ? 'Atualizar' : 'Criar')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Link Client Modal */}
      <Dialog open={showLinkClientModal} onOpenChange={setShowLinkClientModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Vincular Cliente - {linkingMikrotik?.nome}
            </DialogTitle>
            <DialogDescription>
              Selecione um cliente para vincular ao MikroTik ou deixe em branco para sistema
            </DialogDescription>
          </DialogHeader>
          
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const clienteId = formData.get('cliente_id') as string;
              if (linkingMikrotik) {
                handleLinkClient(linkingMikrotik.id, clienteId);
              }
            }} 
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="cliente_id">Cliente</Label>
              <Select name="cliente_id" defaultValue={linkingMikrotik?.cliente_id || ''}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente ou deixe em branco para sistema" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sistema (sem vinculação)</SelectItem>
                  {clientes.filter(c => c.role === 'user').map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nome} ({cliente.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500">
                Clientes vinculados poderão gerenciar os planos deste MikroTik
              </p>
            </div>
            
            <DialogFooter className="gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowLinkClientModal(false);
                  setLinkingMikrotik(null);
                }}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Processando...' : 'Salvar Vinculação'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MikrotiksManagement;
