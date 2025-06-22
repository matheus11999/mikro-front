import React, { useState, useEffect, useCallback } from 'react';
import { 
  Radio, 
  Users, 
  Settings, 
  Download, 
  Edit, 
  Plus, 
  Search, 
  RefreshCw, 
  BarChart3,
  Filter,
  MoreHorizontal,
  Trash2,
  Upload,
  Wifi,
  Activity,
  AlertCircle,
  CheckCircle2
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

interface Mikrotik {
  id: string;
  nome: string;
  provider_name: string;
  status: 'Ativo' | 'Inativo';
  cliente_id: string;
  profitpercentage: number;
}

interface Plan {
  id: string;
  nome: string;
  preco: number;
  mikrotik_id: string;
}

interface Cliente {
  id: string;
  nome: string;
}

const MikrotiksManagement = () => {
  const log = useLogger('MikrotiksManagement');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [showAddPlanModal, setShowAddPlanModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedMikrotik, setSelectedMikrotik] = useState<Mikrotik | null>(null);
  const [editingMikrotik, setEditingMikrotik] = useState<Mikrotik | null>(null);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [importPlan, setImportPlan] = useState<Plan | null>(null);
  
  const [mikrotiks, setMikrotiks] = useState<Mikrotik[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    nome: '',
    provider_name: '',
    cliente_id: '',
    profitpercentage: 0
  });
  
  const [planFormData, setPlanFormData] = useState({
    nome: '',
    preco: ''
  });
  
  const [importText, setImportText] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [senhaCounts, setSenhaCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    log.mount();
    fetchData();
    
    return () => {
      log.unmount();
    };
  }, []);

  const fetchData = async () => {
    const timerId = log.startTimer('fetch-data');
    
    try {
      log.info('Fetching mikrotiks and clients');
      setLoading(true);
      setError('');
      
      const [mikrotiksResult, clientesResult] = await Promise.all([
        supabase.from('mikrotiks').select('*'),
        supabase.from('clientes').select('id, nome')
      ]);
      
      if (mikrotiksResult.error) {
        log.error('Failed to fetch mikrotiks', mikrotiksResult.error);
        throw mikrotiksResult.error;
      }
      
      if (clientesResult.error) {
        log.error('Failed to fetch clients', clientesResult.error);
        throw clientesResult.error;
      }
      
      setMikrotiks(mikrotiksResult.data || []);
      setClientes(clientesResult.data || []);
      log.info('Data fetched successfully', { 
        mikrotiks: mikrotiksResult.data?.length, 
        clients: clientesResult.data?.length 
      });
      
    } catch (err) {
      log.error('Failed to fetch data', err);
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
      log.endTimer(timerId, 'fetch-data');
    }
  };

  const fetchPlans = useCallback(async () => {
    if (!selectedMikrotik) return;
    
    const timerId = log.startTimer('fetch-plans');
    
    try {
      log.info('Fetching plans for mikrotik', { mikrotikId: selectedMikrotik.id });
      
      const { data: planosData, error } = await supabase
        .from('planos')
        .select('*')
        .eq('mikrotik_id', selectedMikrotik.id);
      
      if (error) throw error;
      
      setPlans(planosData || []);
      
      // Fetch password counts
      if (planosData && planosData.length > 0) {
        const ids = planosData.map(p => p.id);
        const { data: senhasData } = await supabase
          .from('senhas')
          .select('plano_id')
          .in('plano_id', ids);
        
        const counts: Record<string, number> = {};
        (senhasData || []).forEach(s => {
          counts[s.plano_id] = (counts[s.plano_id] || 0) + 1;
        });
        setSenhaCounts(counts);
      } else {
        setSenhaCounts({});
      }
      
      log.info('Plans fetched successfully', { plansCount: planosData?.length });
      
    } catch (err) {
      log.error('Failed to fetch plans', err);
      setError('Erro ao carregar planos');
    } finally {
      log.endTimer(timerId, 'fetch-plans');
    }
  }, [selectedMikrotik]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleCreateMikrotik = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const timerId = log.startTimer('create-mikrotik');
    
    try {
      log.info('Creating new mikrotik');
      setLoading(true);
      setError('');
      
      const { error } = await supabase.from('mikrotiks').insert([{
        nome: formData.nome,
        provider_name: formData.provider_name,
        status: 'Ativo',
        cliente_id: formData.cliente_id,
        profitpercentage: formData.profitpercentage
      }]);
      
      if (error) throw error;
      
      setSuccess('Mikrotik criado com sucesso!');
      setShowAddModal(false);
      setFormData({ nome: '', provider_name: '', cliente_id: '', profitpercentage: 0 });
      fetchData();
      log.info('Mikrotik created successfully');
      
    } catch (err) {
      log.error('Failed to create mikrotik', err);
      setError('Erro ao criar mikrotik');
    } finally {
      setLoading(false);
      log.endTimer(timerId, 'create-mikrotik');
    }
  };

  const handleUpdateMikrotik = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMikrotik) return;
    
    const timerId = log.startTimer('update-mikrotik');
    
    try {
      log.info('Updating mikrotik', { id: editingMikrotik.id });
      setLoading(true);
      setError('');
      
      const { error } = await supabase
        .from('mikrotiks')
        .update({
          nome: formData.nome,
          provider_name: formData.provider_name,
          cliente_id: formData.cliente_id,
          profitpercentage: formData.profitpercentage
        })
        .eq('id', editingMikrotik.id);
      
      if (error) throw error;
      
      setSuccess('Mikrotik atualizado com sucesso!');
      setEditingMikrotik(null);
      setFormData({ nome: '', provider_name: '', cliente_id: '', profitpercentage: 0 });
      fetchData();
      log.info('Mikrotik updated successfully');
      
    } catch (err) {
      log.error('Failed to update mikrotik', err);
      setError('Erro ao atualizar mikrotik');
    } finally {
      setLoading(false);
      log.endTimer(timerId, 'update-mikrotik');
    }
  };

  const handleDeleteMikrotik = async (mikrotik: Mikrotik) => {
    if (!window.confirm(`Tem certeza que deseja excluir o mikrotik "${mikrotik.nome}"?`)) {
      return;
    }
    
    const timerId = log.startTimer('delete-mikrotik');
    
    try {
      log.info('Deleting mikrotik', { id: mikrotik.id });
      
      const { error } = await supabase.from('mikrotiks').delete().eq('id', mikrotik.id);
      if (error) throw error;
      
      setSuccess('Mikrotik excluído com sucesso!');
      fetchData();
      log.info('Mikrotik deleted successfully');
      
    } catch (err) {
      log.error('Failed to delete mikrotik', err);
      setError('Erro ao excluir mikrotik');
    } finally {
      log.endTimer(timerId, 'delete-mikrotik');
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMikrotik) return;
    
    const timerId = log.startTimer('create-plan');
    
    try {
      log.info('Creating new plan');
      setLoading(true);
      setError('');
      
      const { error } = await supabase.from('planos').insert([{
        nome: planFormData.nome,
        preco: parseFloat(planFormData.preco),
        mikrotik_id: selectedMikrotik.id
      }]);
      
      if (error) throw error;
      
      setSuccess('Plano criado com sucesso!');
      setShowAddPlanModal(false);
      setPlanFormData({ nome: '', preco: '' });
      fetchPlans();
      log.info('Plan created successfully');
      
    } catch (err) {
      log.error('Failed to create plan', err);
      setError('Erro ao criar plano');
    } finally {
      setLoading(false);
      log.endTimer(timerId, 'create-plan');
    }
  };

  const handleUpdatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    
    const timerId = log.startTimer('update-plan');
    
    try {
      log.info('Updating plan', { id: editingPlan.id });
      setLoading(true);
      setError('');
      
      const { error } = await supabase
        .from('planos')
        .update({
          nome: planFormData.nome,
          preco: parseFloat(planFormData.preco)
        })
        .eq('id', editingPlan.id);
      
      if (error) throw error;
      
      setSuccess('Plano atualizado com sucesso!');
      setEditingPlan(null);
      setPlanFormData({ nome: '', preco: '' });
      fetchPlans();
      log.info('Plan updated successfully');
      
    } catch (err) {
      log.error('Failed to update plan', err);
      setError('Erro ao atualizar plano');
    } finally {
      setLoading(false);
      log.endTimer(timerId, 'update-plan');
    }
  };

  const handleDeletePlan = async (plan: Plan) => {
    if (!window.confirm(`Tem certeza que deseja excluir o plano "${plan.nome}"?`)) {
      return;
    }
    
    const timerId = log.startTimer('delete-plan');
    
    try {
      log.info('Deleting plan', { id: plan.id });
      
      const { error } = await supabase.from('planos').delete().eq('id', plan.id);
      if (error) throw error;
      
      setSuccess('Plano excluído com sucesso!');
      fetchPlans();
      log.info('Plan deleted successfully');
      
    } catch (err) {
      log.error('Failed to delete plan', err);
      setError('Erro ao excluir plano');
    }
  };

  const handleImportPasswords = async () => {
    if (!importPlan || !importText.trim()) return;
    
    const timerId = log.startTimer('import-passwords');
    
    try {
      log.info('Importing passwords', { planId: importPlan.id });
      setImportLoading(true);
      setError('');
      
      const lines = importText.trim().split('\n').filter(line => line.trim());
      const passwords = lines.map(line => ({
        senha: line.trim(),
        plano_id: importPlan.id,
        vendida: false,
        data_criacao: new Date().toISOString()
      }));
      
      const { error } = await supabase.from('senhas').insert(passwords);
      if (error) throw error;
      
      setSuccess(`${passwords.length} senhas importadas com sucesso!`);
      setShowImportModal(false);
      setImportPlan(null);
      setImportText('');
      fetchPlans();
      log.info('Passwords imported successfully', { count: passwords.length });
      
    } catch (err) {
      log.error('Failed to import passwords', err);
      setError('Erro ao importar senhas');
    } finally {
      setImportLoading(false);
      log.endTimer(timerId, 'import-passwords');
    }
  };

  const filteredMikrotiks = mikrotiks.filter(mikrotik => {
    const nome = mikrotik.nome || '';
    const provider = mikrotik.provider_name || '';
    const owner = clientes.find(c => c.id === mikrotik.cliente_id)?.nome || '';
    const term = searchTerm.toLowerCase();
    return (
      nome.toLowerCase().includes(term) ||
      provider.toLowerCase().includes(term) ||
      owner.toLowerCase().includes(term)
    );
  });

  const stats = {
    total: mikrotiks.length,
    active: mikrotiks.filter(m => m.status === 'Ativo').length,
    totalPlans: plans.length,
    totalPasswords: Object.values(senhaCounts).reduce((sum, count) => sum + count, 0)
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const isActive = status === 'Ativo';
    return (
      <Badge 
        variant={isActive ? 'default' : 'secondary'}
        className={isActive ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}
      >
        {status}
      </Badge>
    );
  };

  if (loading && mikrotiks.length === 0) {
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
            <Radio className="w-8 h-8 text-blue-600" />
            Gerenciamento de Mikrotiks
          </h1>
          <p className="text-gray-600 mt-1">
            Controle de equipamentos, planos e senhas
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-4 h-4" />
            Filtros
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={fetchData}>
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Exportar
          </Button>
          <Button 
            onClick={() => {
              setEditingMikrotik(null);
              setFormData({ nome: '', provider_name: '', cliente_id: '', profitpercentage: 0 });
              setShowAddModal(true);
            }}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Novo Mikrotik
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
                  Total Mikrotiks
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Radio className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Equipamentos Ativos
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.active}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="flex items-center mt-4 gap-2">
              <div className="flex items-center gap-1 text-green-600">
                <span className="text-sm font-medium">
                  {Math.round((stats.active / stats.total) * 100) || 0}% online
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
                  Planos Cadastrados
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalPlans}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Settings className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Senhas Disponíveis
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalPasswords}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Wifi className="w-6 h-6 text-orange-600" />
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
                Lista de Mikrotiks
              </CardTitle>
              <CardDescription>
                Gerencie todos os equipamentos do sistema
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar mikrotiks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-100">
                <TableHead className="font-semibold">Equipamento</TableHead>
                <TableHead className="font-semibold">Proprietário</TableHead>
                <TableHead className="font-semibold">Provedor</TableHead>
                <TableHead className="font-semibold">Lucro Admin</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMikrotiks.map((mikrotik) => (
                <TableRow key={mikrotik.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Radio className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{mikrotik.nome}</p>
                        <p className="text-sm text-gray-500">ID: {mikrotik.id}</p>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {clientes.find(c => c.id === mikrotik.cliente_id)?.nome || 'Desconhecido'}
                      </span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <span className="text-sm text-gray-900">{mikrotik.provider_name}</span>
                  </TableCell>
                  
                  <TableCell>
                    <span className="font-semibold text-emerald-600">
                      {mikrotik.profitpercentage}%
                    </span>
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
                          }}
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Gerenciar Planos
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => {
                            setEditingMikrotik(mikrotik);
                            setFormData({
                              nome: mikrotik.nome,
                              provider_name: mikrotik.provider_name,
                              cliente_id: mikrotik.cliente_id,
                              profitpercentage: mikrotik.profitpercentage
                            });
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
              <Radio className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">Nenhum mikrotik encontrado</p>
              <p className="text-gray-400 text-sm mt-1">
                {searchTerm ? 'Tente ajustar sua busca' : 'Clique em "Novo Mikrotik" para começar'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mikrotik Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingMikrotik ? 'Editar Mikrotik' : 'Novo Mikrotik'}
            </DialogTitle>
            <DialogDescription>
              {editingMikrotik ? 'Atualize as informações do equipamento' : 'Configure um novo equipamento Mikrotik'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={editingMikrotik ? handleUpdateMikrotik : handleCreateMikrotik} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Mikrotik</Label>
                <Input
                  id="nome"
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Mikrotik Central"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="provider">Nome do Provedor</Label>
                <Input
                  id="provider"
                  required
                  value={formData.provider_name}
                  onChange={(e) => setFormData({ ...formData, provider_name: e.target.value })}
                  placeholder="Ex: Provider Central"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cliente">Proprietário</Label>
                <Select 
                  value={formData.cliente_id} 
                  onValueChange={(value) => setFormData({ ...formData, cliente_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um usuário..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map(cliente => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="profit">Porcentagem de Lucro Admin (%)</Label>
                <Input
                  id="profit"
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={formData.profitpercentage}
                  onChange={(e) => setFormData({ ...formData, profitpercentage: Number(e.target.value) })}
                  placeholder="Ex: 10"
                />
                <p className="text-xs text-gray-500">
                  Restante vai para o proprietário do mikrotik
                </p>
              </div>
            </div>
            
            <DialogFooter className="gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowAddModal(false)}
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

      {/* Plans Management Modal */}
      <Dialog open={showPlansModal} onOpenChange={setShowPlansModal}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-600" />
              Gerenciar Planos - {selectedMikrotik?.nome}
            </DialogTitle>
            <DialogDescription>
              Configure os planos de internet para este equipamento
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Button
              onClick={() => setShowAddPlanModal(true)}
              className="gap-2 bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="w-4 h-4" />
              Novo Plano
            </Button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plans.map((plan) => (
                <Card key={plan.id} className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">{plan.nome}</h3>
                      <span className="text-lg font-bold text-green-600">
                        {formatCurrency(plan.preco)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <Wifi className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        Senhas: <span className="font-bold">{senhaCounts[plan.id] || 0}</span>
                      </span>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setEditingPlan(plan);
                          setPlanFormData({
                            nome: plan.nome,
                            preco: plan.preco.toString()
                          });
                          setShowAddPlanModal(true);
                        }}
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Editar
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setImportPlan(plan);
                          setShowImportModal(true);
                        }}
                      >
                        <Upload className="w-3 h-3 mr-1" />
                        Importar
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeletePlan(plan)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {plans.length === 0 && (
              <div className="text-center py-8">
                <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">Nenhum plano cadastrado</p>
                <p className="text-gray-400 text-sm mt-1">
                  Clique em "Novo Plano" para começar
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Plan Modal */}
      <Dialog open={showAddPlanModal} onOpenChange={setShowAddPlanModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingPlan ? 'Editar Plano' : 'Novo Plano'}
            </DialogTitle>
            <DialogDescription>
              {editingPlan ? 'Atualize as informações do plano' : `Criar novo plano para ${selectedMikrotik?.nome}`}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={editingPlan ? handleUpdatePlan : handleCreatePlan} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="planName">Nome do Plano</Label>
              <Input
                id="planName"
                required
                value={planFormData.nome}
                onChange={(e) => setPlanFormData({ ...planFormData, nome: e.target.value })}
                placeholder="Ex: Plano 100MB"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="planPrice">Preço (R$)</Label>
              <Input
                id="planPrice"
                type="number"
                step="0.01"
                min="0"
                required
                value={planFormData.preco}
                onChange={(e) => setPlanFormData({ ...planFormData, preco: e.target.value })}
                placeholder="Ex: 29.90"
              />
            </div>
            
            <DialogFooter className="gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowAddPlanModal(false);
                  setEditingPlan(null);
                  setPlanFormData({ nome: '', preco: '' });
                }}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {loading ? 'Processando...' : (editingPlan ? 'Atualizar' : 'Criar')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Import Passwords Modal */}
      <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-orange-600" />
              Importar Senhas
            </DialogTitle>
            <DialogDescription>
              Importar senhas para o plano: {importPlan?.nome}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="passwords">Senhas (uma por linha)</Label>
              <Textarea
                id="passwords"
                rows={10}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="senha1&#10;senha2&#10;senha3&#10;..."
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-500">
                Cole as senhas, uma por linha
              </p>
            </div>
            
            <DialogFooter className="gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowImportModal(false);
                  setImportPlan(null);
                  setImportText('');
                }}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleImportPasswords}
                disabled={importLoading || !importText.trim()}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {importLoading ? 'Importando...' : 'Importar Senhas'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MikrotiksManagement;
