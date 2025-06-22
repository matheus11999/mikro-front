import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Edit, 
  Trash2, 
  Search, 
  UserCheck, 
  TrendingUp,
  Filter,
  Download,
  MoreHorizontal,
  Mail,
  Phone,
  CreditCard,
  Calendar,
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabaseClient';
import { useLogger } from '@/lib/logger';

interface User {
  id: string;
  nome: string;
  email: string;
  chave_pix?: string;
  whatsapp?: string;
  saldo: number;
  role: string;
  status?: 'active' | 'inactive';
  criado_em: string;
}

const UsersManagement = () => {
  const log = useLogger('UsersManagement');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    chave_pix: '',
    whatsapp: ''
  });

  useEffect(() => {
    log.mount();
    fetchUsers();
    
    return () => {
      log.unmount();
    };
  }, []);

  const fetchUsers = async () => {
    const timerId = log.startTimer('fetch-users');
    
    try {
      log.info('Fetching users');
      const { data, error } = await supabase.from('clientes').select('*');
      
      if (error) {
        log.error('Failed to fetch users', error);
        setError('Erro ao carregar usuários');
      } else {
        log.info('Users fetched successfully', { count: data?.length || 0 });
        setUsers(data || []);
      }
    } catch (err) {
      log.error('Exception while fetching users', err);
      setError('Erro inesperado ao carregar usuários');
    } finally {
      setLoading(false);
      log.endTimer(timerId, 'fetch-users');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const timerId = log.startTimer(editingUser ? 'update-user' : 'create-user');

    try {
      if (editingUser) {
        log.info('Updating user', { userId: editingUser.id });
        
        const updateData = {
          nome: formData.name,
          chave_pix: formData.chave_pix,
          whatsapp: formData.whatsapp
        };

        if (formData.password) {
          const { error: authError } = await supabase.auth.admin.updateUserById(
            editingUser.id,
            { password: formData.password }
          );
          if (authError) throw authError;
        }

        const { error } = await supabase
          .from('clientes')
          .update(updateData)
          .eq('id', editingUser.id);

        if (error) throw error;

        setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...updateData } : u));
        log.info('User updated successfully');
      } else {
        log.info('Creating new user');
        
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: formData.email,
          password: formData.password,
          email_confirm: true
        });

        if (authError) throw authError;

        const newUserData = {
          id: authData.user.id,
          nome: formData.name,
          email: formData.email,
          chave_pix: formData.chave_pix,
          whatsapp: formData.whatsapp,
          role: 'user',
          saldo: 0,
          criado_em: new Date().toISOString()
        };

        const { error } = await supabase.from('clientes').insert(newUserData);
        if (error) throw error;

        setUsers([...users, newUserData]);
        log.info('User created successfully');
      }

      setShowModal(false);
      setFormData({ name: '', email: '', password: '', chave_pix: '', whatsapp: '' });
      setEditingUser(null);
    } catch (error: any) {
      log.error('Failed to save user', error);
      setError(error.message || 'Erro ao processar usuário');
    } finally {
      setLoading(false);
      log.endTimer(timerId, editingUser ? 'update-user' : 'create-user');
    }
  };

  const handleEdit = (user: User) => {
    log.info('Editing user', { userId: user.id });
    setEditingUser(user);
    setFormData({
      name: user.nome || '',
      email: user.email || '',
      password: '',
      chave_pix: user.chave_pix || '',
      whatsapp: user.whatsapp || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (user: User) => {
    if (window.confirm(`Tem certeza que deseja excluir o usuário "${user.nome}"?`)) {
      const timerId = log.startTimer('delete-user');
      
      try {
        log.info('Deleting user', { userId: user.id });
        const { error } = await supabase.from('clientes').delete().eq('id', user.id);
        
        if (error) throw error;
        
        setUsers(users.filter(u => u.id !== user.id));
        log.info('User deleted successfully');
      } catch (err) {
        log.error('Failed to delete user', err);
        setError('Erro ao excluir usuário');
      } finally {
        log.endTimer(timerId, 'delete-user');
      }
    }
  };

  const toggleStatus = async (user: User) => {
    const newStatus = (user.status || 'active') === 'active' ? 'inactive' : 'active';
    
    try {
      log.info('Toggling user status', { userId: user.id, newStatus });
      
      const { error } = await supabase
        .from('clientes')
        .update({ status: newStatus })
        .eq('id', user.id);
        
      if (error) throw error;
      
      setUsers(users.map(u => 
        u.id === user.id ? { ...u, status: newStatus } : u
      ));
      
      log.info('User status updated successfully');
    } catch (err) {
      log.error('Failed to update user status', err);
      setError('Erro ao atualizar status do usuário');
    }
  };

  const filteredUsers = users.filter(user => 
    user.role !== 'admin' &&
    (user.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     user.email?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const stats = {
    total: filteredUsers.length,
    active: filteredUsers.filter(u => (u.status || 'active') === 'active').length,
    withWhatsapp: filteredUsers.filter(u => u.whatsapp).length,
    totalBalance: filteredUsers.reduce((sum, user) => sum + (user.saldo || 0), 0)
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    const isActive = (status || 'active') === 'active';
    return (
      <Badge 
        variant={isActive ? 'default' : 'secondary'}
        className={isActive ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}
      >
        {isActive ? 'Ativo' : 'Inativo'}
      </Badge>
    );
  };

  if (loading && users.length === 0) {
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
            <Users className="w-8 h-8 text-blue-600" />
            Gerenciamento de Usuários
          </h1>
          <p className="text-gray-600 mt-1">
            Controle e administração de usuários do sistema
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-4 h-4" />
            Filtros
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Exportar
          </Button>
          <Button 
            onClick={() => {
              setEditingUser(null);
              setFormData({ name: '', email: '', password: '', chave_pix: '', whatsapp: '' });
              setShowModal(true);
            }}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <UserPlus className="w-4 h-4" />
            Novo Usuário
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
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
                  Total de Usuários
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Usuários Ativos
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.active}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="flex items-center mt-4 gap-2">
              <div className="flex items-center gap-1 text-green-600">
                <span className="text-sm font-medium">
                  {Math.round((stats.active / stats.total) * 100)}% ativo
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
                  Com WhatsApp
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.withWhatsapp}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Phone className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Saldo Total
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.totalBalance)}
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
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
                Lista de Usuários
              </CardTitle>
              <CardDescription>
                Gerencie todos os usuários do sistema
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar usuários..."
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
                <TableHead className="font-semibold">Usuário</TableHead>
                <TableHead className="font-semibold">Contato</TableHead>
                <TableHead className="font-semibold">PIX</TableHead>
                <TableHead className="font-semibold">Saldo</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Criado em</TableHead>
                <TableHead className="font-semibold">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-blue-600">
                          {user.nome?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.nome}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3 h-3 text-gray-400" />
                        <span className="text-sm text-gray-600">{user.email}</span>
                      </div>
                      {user.whatsapp && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3 h-3 text-gray-400" />
                          <span className="text-sm text-gray-600">{user.whatsapp}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {user.chave_pix ? (
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-3 h-3 text-gray-400" />
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded truncate max-w-[120px] block">
                          {user.chave_pix}
                        </code>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">Não informado</span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <span className="font-semibold text-emerald-600">
                      {formatCurrency(user.saldo || 0)}
                    </span>
                  </TableCell>
                  
                  <TableCell>
                    <button onClick={() => toggleStatus(user)}>
                      {getStatusBadge(user.status || 'active')}
                    </button>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {formatDate(user.criado_em)}
                      </span>
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
                        <DropdownMenuItem onClick={() => handleEdit(user)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(user)}
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
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">Nenhum usuário encontrado</p>
              <p className="text-gray-400 text-sm mt-1">
                {searchTerm ? 'Tente ajustar sua busca' : 'Clique em "Novo Usuário" para começar'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
            </DialogTitle>
            <DialogDescription>
              {editingUser ? 'Atualize as informações do usuário' : 'Preencha os dados para criar um novo usuário'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Digite o nome completo"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                required={!editingUser}
                disabled={!!editingUser}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="usuario@exemplo.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                required={!editingUser}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={editingUser ? 'Deixe em branco para manter' : 'Digite uma senha segura'}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="pix">Chave PIX (opcional)</Label>
              <Input
                id="pix"
                value={formData.chave_pix}
                onChange={(e) => setFormData({ ...formData, chave_pix: e.target.value })}
                placeholder="CPF, e-mail, telefone ou chave aleatória"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp (opcional)</Label>
              <Input
                id="whatsapp"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                placeholder="(99) 99999-9999"
              />
            </div>
            
            <DialogFooter className="gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowModal(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Processando...' : (editingUser ? 'Atualizar' : 'Criar')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersManagement;
