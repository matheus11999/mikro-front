import React, { useState, useEffect } from 'react';
import { 
  Key, 
  CheckCircle, 
  Upload, 
  Search, 
  RefreshCw, 
  BarChart3, 
  DollarSign, 
  Filter, 
  Edit, 
  Trash2, 
  Download,
  AlertCircle,
  CheckCircle2,
  MoreHorizontal,
  Shield,
  Clock,
  Users,
  Wifi
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
import { Checkbox } from '@/components/ui/checkbox';
import { supabase, getSupabaseAdmin } from '@/lib/supabaseClient';
import { useLogger } from '@/lib/logger';

interface Password {
  id: string;
  usuario: string;
  senha: string;
  plano_id: string;
  disponivel: boolean;
  vendida: boolean;
  criada_em: string;
  vendida_em?: string;
}

interface Plan {
  id: string;
  nome: string;
  preco: number;
  mikrotik_id: string;
}

interface Mikrotik {
  id: string;
  nome: string;
}

const PasswordsManagement = () => {
  const log = useLogger('PasswordsManagement');
  const [passwords, setPasswords] = useState<Password[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [mikrotiks, setMikrotiks] = useState<Mikrotik[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [showImportModal, setShowImportModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPassword, setEditingPassword] = useState<Password | null>(null);
  const [selectedPasswords, setSelectedPasswords] = useState<string[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  
  const [importData, setImportData] = useState({
    mikrotik_id: '',
    plano_id: '',
    text: ''
  });
  const [importLoading, setImportLoading] = useState(false);
  
  const [editFormData, setEditFormData] = useState({
    usuario: '',
    senha: '',
    disponivel: true
  });

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
      log.info('Fetching passwords data');
      setLoading(true);
      setError('');
      
      const [passwordsResult, plansResult, mikrotiksResult, vendasResult] = await Promise.all([
        supabase.from('senhas').select('*'),
        supabase.from('planos').select('id, nome, preco, mikrotik_id'),
        supabase.from('mikrotiks').select('id, nome'),
        supabase.from('vendas').select('valor')
      ]);
      
      if (passwordsResult.error) throw passwordsResult.error;
      if (plansResult.error) throw plansResult.error;
      if (mikrotiksResult.error) throw mikrotiksResult.error;
      
      setPasswords(passwordsResult.data || []);
      setPlans(plansResult.data || []);
      setMikrotiks(mikrotiksResult.data || []);
      
      log.info('Data fetched successfully', { 
        passwords: passwordsResult.data?.length,
        plans: plansResult.data?.length,
        mikrotiks: mikrotiksResult.data?.length
      });
      
    } catch (err) {
      log.error('Failed to fetch data', err);
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
      log.endTimer(timerId, 'fetch-data');
    }
  };

  const handleImportPasswords = async () => {
    if (!importData.mikrotik_id || !importData.plano_id || !importData.text.trim()) {
      setError('Por favor, selecione o Mikrotik, Plano e forneça os dados das senhas.');
      return;
    }
    
    const timerId = log.startTimer('import-passwords');
    
    try {
      log.info('Importing passwords');
      setImportLoading(true);
      setError('');
      
      const supabaseAdmin = getSupabaseAdmin();
      
      // Verificar senhas existentes
      const { data: existing, error: existingError } = await supabaseAdmin
        .from('senhas')
        .select('usuario, senha')
        .eq('plano_id', importData.plano_id);
      
      if (existingError) throw existingError;
      
      const existingSet = new Set((existing || []).map(s => `${s.usuario}:${s.senha}`));
      
      // Processar dados de entrada
      const lines = importData.text.split('\n').map(l => l.trim()).filter(Boolean);
      const pairs = lines.map(l => {
        const [usuario, senha] = l.split(':');
        return { usuario: usuario?.trim(), senha: senha?.trim() };
      }).filter(p => p.usuario && p.senha);
      
      if (pairs.length === 0) {
        throw new Error('Nenhuma senha válida encontrada. Use o formato: usuario:senha');
      }
      
      // Filtrar apenas senhas novas
      const newPasswords = pairs.filter(p => !existingSet.has(`${p.usuario}:${p.senha}`));
      
      if (newPasswords.length > 0) {
        const { error } = await supabaseAdmin.from('senhas').insert(
          newPasswords.map(p => ({
            usuario: p.usuario,
            senha: p.senha,
            disponivel: true,
            vendida: false,
            plano_id: importData.plano_id,
            criada_em: new Date().toISOString()
          }))
        );
        
        if (error) throw error;
      }
      
      const duplicated = pairs.length - newPasswords.length;
      let message = `${newPasswords.length} senhas importadas com sucesso!`;
      if (duplicated > 0) {
        message += ` (${duplicated} já existiam e foram ignoradas)`;
      }
      
      setSuccess(message);
      setShowImportModal(false);
      setImportData({ mikrotik_id: '', plano_id: '', text: '' });
      fetchData();
      log.info('Passwords imported successfully', { count: newPasswords.length });
      
    } catch (err) {
      log.error('Failed to import passwords', err);
      setError(`Erro ao importar senhas: ${err.message}`);
    } finally {
      setImportLoading(false);
      log.endTimer(timerId, 'import-passwords');
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPassword) return;
    
    const timerId = log.startTimer('update-password');
    
    try {
      log.info('Updating password', { id: editingPassword.id });
      setLoading(true);
      setError('');
      
      const supabaseAdmin = getSupabaseAdmin();
      const { error } = await supabaseAdmin
        .from('senhas')
        .update({
          usuario: editFormData.usuario,
          senha: editFormData.senha,
          disponivel: editFormData.disponivel
        })
        .eq('id', editingPassword.id);
      
      if (error) throw error;
      
      setSuccess('Senha atualizada com sucesso!');
      setShowEditModal(false);
      setEditingPassword(null);
      setEditFormData({ usuario: '', senha: '', disponivel: true });
      fetchData();
      log.info('Password updated successfully');
      
    } catch (err) {
      log.error('Failed to update password', err);
      setError('Erro ao atualizar senha');
    } finally {
      setLoading(false);
      log.endTimer(timerId, 'update-password');
    }
  };

  const handleDeletePassword = async (password: Password) => {
    if (!window.confirm(`Tem certeza que deseja excluir a senha do usuário "${password.usuario}"?`)) {
      return;
    }
    
    const timerId = log.startTimer('delete-password');
    
    try {
      log.info('Deleting password', { id: password.id });
      
      const supabaseAdmin = getSupabaseAdmin();
      const { error } = await supabaseAdmin.from('senhas').delete().eq('id', password.id);
      
      if (error) throw error;
      
      setSuccess('Senha excluída com sucesso!');
      fetchData();
      log.info('Password deleted successfully');
      
    } catch (err) {
      log.error('Failed to delete password', err);
      setError('Erro ao excluir senha');
    } finally {
      log.endTimer(timerId, 'delete-password');
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Tem certeza que deseja excluir ${selectedPasswords.length} senhas?`)) {
      return;
    }
    
    const timerId = log.startTimer('bulk-delete-passwords');
    
    try {
      log.info('Bulk deleting passwords', { count: selectedPasswords.length });
      
      const supabaseAdmin = getSupabaseAdmin();
      const { error } = await supabaseAdmin
        .from('senhas')
        .delete()
        .in('id', selectedPasswords);
      
      if (error) throw error;
      
      setSuccess(`${selectedPasswords.length} senhas excluídas com sucesso!`);
      setSelectedPasswords([]);
      fetchData();
      log.info('Passwords bulk deleted successfully');
      
    } catch (err) {
      log.error('Failed to bulk delete passwords', err);
      setError('Erro ao excluir senhas');
    } finally {
      log.endTimer(timerId, 'bulk-delete-passwords');
    }
  };

  const filteredPasswords = passwords.filter(password => {
    const plan = plans.find(p => p.id === password.plano_id);
    const mikrotik = mikrotiks.find(m => m.id === plan?.mikrotik_id);
    
    const matchesSearch = 
      password.usuario.toLowerCase().includes(searchTerm.toLowerCase()) ||
      password.senha.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mikrotik?.nome.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'available' && password.disponivel && !password.vendida) ||
      (statusFilter === 'sold' && password.vendida) ||
      (statusFilter === 'unavailable' && !password.disponivel);
    
    const matchesPlan = planFilter === 'all' || password.plano_id === planFilter;
    
    return matchesSearch && matchesStatus && matchesPlan;
  });

  const stats = {
    total: passwords.length,
    available: passwords.filter(p => p.disponivel && !p.vendida).length,
    sold: passwords.filter(p => p.vendida).length,
    unavailable: passwords.filter(p => !p.disponivel).length
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getPlanInfo = (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    const mikrotik = plan ? mikrotiks.find(m => m.id === plan.mikrotik_id) : null;
    return { plan, mikrotik };
  };

  const getStatusBadge = (password: Password) => {
    if (password.vendida) {
      return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Vendida</Badge>;
    } else if (password.disponivel) {
      return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">Disponível</Badge>;
    } else {
      return <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200">Indisponível</Badge>;
    }
  };

  if (loading && passwords.length === 0) {
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
            <Key className="w-8 h-8 text-indigo-600" />
            Gerenciamento de Senhas
          </h1>
          <p className="text-gray-600 mt-1">
            Controle completo de senhas dos equipamentos
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
            <Download className="w-4 h-4" />
            Exportar
          </Button>
          {selectedPasswords.length > 0 && (
            <Button variant="destructive" size="sm" className="gap-2" onClick={handleBulkDelete}>
              <Trash2 className="w-4 h-4" />
              Excluir ({selectedPasswords.length})
            </Button>
          )}
          <Button 
            onClick={() => setShowImportModal(true)}
            className="gap-2 bg-indigo-600 hover:bg-indigo-700"
          >
            <Upload className="w-4 h-4" />
            Importar
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
                  Total de Senhas
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Key className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Disponíveis
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.available}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="flex items-center mt-4 gap-2">
              <div className="flex items-center gap-1 text-green-600">
                <span className="text-sm font-medium">
                  {Math.round((stats.available / stats.total) * 100) || 0}% ativas
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
                  Senhas Vendidas
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.sold}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Indisponíveis
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.unavailable}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-orange-600" />
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
                Lista de Senhas
              </CardTitle>
              <CardDescription>
                Gerencie todas as senhas do sistema
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar senhas..."
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
                  <SelectItem value="available">Disponível</SelectItem>
                  <SelectItem value="sold">Vendida</SelectItem>
                  <SelectItem value="unavailable">Indisponível</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os planos</SelectItem>
                  {plans.map(plan => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-100">
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedPasswords.length === filteredPasswords.length && filteredPasswords.length > 0}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedPasswords(filteredPasswords.map(p => p.id));
                      } else {
                        setSelectedPasswords([]);
                      }
                    }}
                  />
                </TableHead>
                <TableHead className="font-semibold">Equipamento/Plano</TableHead>
                <TableHead className="font-semibold">Usuário</TableHead>
                <TableHead className="font-semibold">Senha</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Data</TableHead>
                <TableHead className="font-semibold">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPasswords.map((password) => {
                const { plan, mikrotik } = getPlanInfo(password.plano_id);
                
                return (
                  <TableRow key={password.id} className="hover:bg-gray-50">
                    <TableCell>
                      <Checkbox
                        checked={selectedPasswords.includes(password.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedPasswords([...selectedPasswords, password.id]);
                          } else {
                            setSelectedPasswords(selectedPasswords.filter(id => id !== password.id));
                          }
                        }}
                      />
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <Wifi className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{mikrotik?.nome || 'Desconhecido'}</p>
                          <p className="text-sm text-gray-500">{plan?.nome || 'Plano não encontrado'}</p>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                        {password.usuario}
                      </code>
                    </TableCell>
                    
                    <TableCell>
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                        {password.senha}
                      </code>
                    </TableCell>
                    
                    <TableCell>
                      {getStatusBadge(password)}
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        {password.vendida_em ? 
                          formatDate(password.vendida_em) : 
                          formatDate(password.criada_em)
                        }
                      </div>
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
                              setEditingPassword(password);
                              setEditFormData({
                                usuario: password.usuario,
                                senha: password.senha,
                                disponivel: password.disponivel
                              });
                              setShowEditModal(true);
                            }}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeletePassword(password)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          {filteredPasswords.length === 0 && (
            <div className="text-center py-12">
              <Key className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">Nenhuma senha encontrada</p>
              <p className="text-gray-400 text-sm mt-1">
                {searchTerm || statusFilter !== 'all' || planFilter !== 'all' ? 
                  'Tente ajustar seus filtros' : 
                  'Clique em "Importar" para adicionar senhas'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import Modal */}
      <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-indigo-600" />
              Importar Senhas
            </DialogTitle>
            <DialogDescription>
              Importe senhas para um plano específico
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mikrotik">Selecionar Mikrotik</Label>
                <Select 
                  value={importData.mikrotik_id} 
                  onValueChange={(value) => setImportData({ ...importData, mikrotik_id: value, plano_id: '' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um Mikrotik" />
                  </SelectTrigger>
                  <SelectContent>
                    {mikrotiks.map(mikrotik => (
                      <SelectItem key={mikrotik.id} value={mikrotik.id}>
                        {mikrotik.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="plano">Selecionar Plano</Label>
                <Select 
                  value={importData.plano_id} 
                  onValueChange={(value) => setImportData({ ...importData, plano_id: value })}
                  disabled={!importData.mikrotik_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um Plano" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans
                      .filter(plan => plan.mikrotik_id === importData.mikrotik_id)
                      .map(plan => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.nome}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="passwords">Dados das Senhas</Label>
              <Textarea
                id="passwords"
                rows={10}
                value={importData.text}
                onChange={(e) => setImportData({ ...importData, text: e.target.value })}
                placeholder="usuario1:senha1&#10;usuario2:senha2&#10;usuario3:senha3"
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-500">
                Cole as senhas no formato: <code>usuario:senha</code>, uma por linha
              </p>
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setShowImportModal(false);
                setImportData({ mikrotik_id: '', plano_id: '', text: '' });
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleImportPasswords}
              disabled={importLoading || !importData.text.trim()}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {importLoading ? 'Importando...' : 'Importar Senhas'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-blue-600" />
              Editar Senha
            </DialogTitle>
            <DialogDescription>
              Atualize as informações da senha
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editUsuario">Usuário</Label>
              <Input
                id="editUsuario"
                required
                value={editFormData.usuario}
                onChange={(e) => setEditFormData({ ...editFormData, usuario: e.target.value })}
                placeholder="Nome do usuário"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="editSenha">Senha</Label>
              <Input
                id="editSenha"
                required
                value={editFormData.senha}
                onChange={(e) => setEditFormData({ ...editFormData, senha: e.target.value })}
                placeholder="Senha"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="disponivel"
                checked={editFormData.disponivel}
                onCheckedChange={(checked) => setEditFormData({ ...editFormData, disponivel: !!checked })}
              />
              <Label htmlFor="disponivel">Senha disponível para venda</Label>
            </div>
            
            <DialogFooter className="gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowEditModal(false);
                  setEditingPassword(null);
                  setEditFormData({ usuario: '', senha: '', disponivel: true });
                }}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PasswordsManagement;
