import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Search, Edit, Trash2, UserCheck, Server, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const UsersManagement = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    pixKey: '',
    whatsapp: ''
  });

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      const { data, error } = await supabase.from('clientes').select('*');
      if (!error) setUsers(data || []);
      setLoading(false);
    }
    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const email = formData.email.trim();
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError('E-mail inválido.');
      setLoading(false);
      return;
    }
    if (editingUser) {
      // Atualizar usuário no Supabase
      await supabase.from('clientes').update({ 
        nome: formData.name, 
        pixKey: formData.pixKey, 
        whatsapp: formData.whatsapp 
      }).eq('id', editingUser.id);
    } else {
      // Verifica se já existe usuário com o mesmo e-mail
      const { data: existing, error: existingError } = await supabase.from('clientes').select('id').eq('email', email);
      if (existing && existing.length > 0) {
        setError('Já existe um usuário com este e-mail.');
        setLoading(false);
        return;
      }
      // Cria usuário no Supabase Auth
      const { error: signUpError } = await supabase.auth.signUp({ email, password: formData.password });
      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }
      // Cria registro na tabela clientes
      const username = formData.username || email.split('@')[0];
      await supabase.from('clientes').insert([{ 
        nome: formData.name, 
        email, 
        username,
        saldo: 0, 
        role: 'user', 
        pixKey: formData.pixKey, 
        whatsapp: formData.whatsapp || null 
      }]);
    }
    // Atualizar lista
    const { data } = await supabase.from('clientes').select('*');
    setUsers(data || []);
    setShowModal(false);
    setEditingUser(null);
    setFormData({ name: '', email: '', username: '', password: '', pixKey: '', whatsapp: '' });
    setLoading(false);
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setFormData({
      name: user.nome || user.name,
      email: user.email || '',
      username: user.username || '',
      password: '',
      pixKey: user.pixKey || '',
      whatsapp: user.whatsapp || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
      await supabase.from('clientes').delete().eq('id', id);
      const { data } = await supabase.from('clientes').select('*');
      setUsers(data || []);
    }
  };

  const toggleStatus = (id: number) => {
    setUsers(users.map(user => 
      user.id === id 
        ? { ...user, status: user.status === 'active' ? 'inactive' : 'active' }
        : user
    ));
  };

  const filteredUsers = users.filter(user => user.role !== 'admin');

  return (
    <div className="p-4 lg:p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center">
            <Users className="w-7 h-7 mr-2 text-blue-600" />
            Gerenciamento de Usuários
          </h1>
          <p className="text-gray-600 mt-1">Controle e administração de usuários</p>
        </div>
        <button
                  onClick={() => {
          setEditingUser(null);
          setFormData({ name: '', email: '', username: '', password: '', pixKey: '', whatsapp: '' });
          setShowModal(true);
        }}
          className="mt-4 sm:mt-0 btn-primary flex items-center"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Novo Usuário
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stats-card">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-xl font-bold text-gray-900">{users.length}</p>
              <p className="text-sm text-gray-600">Total de Usuários</p>
            </div>
          </div>
        </div>
        
        <div className="stats-card">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-xl font-bold text-gray-900">
                {users.filter(u => (u.status || 'active') === 'active').length}
              </p>
              <p className="text-sm text-gray-600">Usuários Ativos</p>
            </div>
          </div>
        </div>
        
        <div className="stats-card">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Server className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-xl font-bold text-gray-900">
                {users.reduce((sum, user) => sum + (user.mikrotiks || 0), 0)}
              </p>
              <p className="text-sm text-gray-600">Mikrotiks Vinculados</p>
            </div>
          </div>
        </div>
        
        <div className="stats-card">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-xl font-bold text-gray-900">
                R$ {filteredUsers.reduce((sum, user) => sum + (user.saldo || 0), 0).toFixed(2)}
              </p>
              <p className="text-sm text-gray-600">Saldo Total Usuários</p>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="data-table">
        <div className="table-header">
          <h2 className="text-lg font-semibold text-gray-900">Lista de Usuários</h2>
          <div className="flex gap-2">
            <button className="btn-secondary text-sm flex items-center gap-2">
              <Search className="w-4 h-4" />
              Buscar
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuário</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chave PIX</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mikrotiks</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lucro</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Criação</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.nome || user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-mono bg-blue-50 text-blue-800 px-2 py-1 rounded">
                      {user.pixKey || 'Não informado'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                      {user.mikrotiks || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-green-600">R$ {(user.saldo || 0).toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleStatus(user.id)}
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                        (user.status || 'active') === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {(user.status || 'active') === 'active' ? 'Ativo' : 'Inativo'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}
              
              <div className="form-group">
                <label className="form-label">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">E-mail</label>
                <input
                  type="email"
                  required={!editingUser}
                  disabled={editingUser}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-field"
                  placeholder="usuario@exemplo.com"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Nome de Usuário</label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="input-field"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Senha</label>
                <input
                  type="password"
                  required={!editingUser}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input-field"
                  placeholder={editingUser ? 'Deixe em branco para manter a atual' : ''}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Chave PIX</label>
                <input
                  type="text"
                  required
                  value={formData.pixKey}
                  onChange={(e) => setFormData({ ...formData, pixKey: e.target.value })}
                  className="input-field"
                  placeholder="CPF, e-mail, telefone ou chave aleatória"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">WhatsApp (opcional)</label>
                <input
                  type="text"
                  value={formData.whatsapp}
                  onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                  className="input-field"
                  placeholder="(99) 99999-9999"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processando...' : (editingUser ? 'Atualizar' : 'Criar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersManagement;
