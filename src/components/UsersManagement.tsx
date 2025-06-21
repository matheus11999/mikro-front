import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Edit, Trash2, Search, UserCheck, Server, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    chave_pix: '',
    whatsapp: ''
  });

  useEffect(() => {
    async function fetchUsers() {
      const { data, error } = await supabase.from('clientes').select('*');
      if (!error) setUsers(data || []);
      setLoading(false);
    }
    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (editingUser) {
        // Atualizar usuário existente
        const updateData: any = {
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
      } else {
        // Criar novo usuário
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: formData.email,
          password: formData.password,
          email_confirm: true
        });

        if (authError) throw authError;

        const { error } = await supabase.from('clientes').insert({
          id: authData.user.id,
          nome: formData.name,
          email: formData.email,
          chave_pix: formData.chave_pix,
          whatsapp: formData.whatsapp,
          role: 'user',
          saldo: 0,
          criado_em: new Date().toISOString()
        });

        if (error) throw error;

        const newUser = {
          id: authData.user.id,
          nome: formData.name,
          email: formData.email,
          chave_pix: formData.chave_pix,
          whatsapp: formData.whatsapp,
          role: 'user',
          saldo: 0,
          criado_em: new Date().toISOString()
        };

        setUsers([...users, newUser]);
      }

      setShowModal(false);
      setFormData({ name: '', email: '', password: '', chave_pix: '', whatsapp: '' });
      setEditingUser(null);
    } catch (error: any) {
      setError(error.message || 'Erro ao processar usuário');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: any) => {
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

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
      const { error } = await supabase.from('clientes').delete().eq('id', id);
      if (!error) {
        setUsers(users.filter(u => u.id !== id));
      }
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

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="loading-spinner h-12 w-12 mx-auto mb-4"></div>
            <p className="text-gray-600 responsive-text">Carregando usuários...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="responsive-title font-bold text-gray-900 flex items-center">
            <Users className="w-6 h-6 sm:w-7 sm:h-7 mr-2 text-blue-600" />
            <span className="hidden sm:inline">Gerenciamento de Usuários</span>
            <span className="sm:hidden">Usuários</span>
          </h1>
          <p className="text-gray-600 mt-1 responsive-text">Controle e administração de usuários</p>
        </div>
        <button
          onClick={() => {
            setEditingUser(null);
            setFormData({ name: '', email: '', password: '', chave_pix: '', whatsapp: '' });
            setShowModal(true);
          }}
          className="btn-primary flex items-center gap-2 touch-target"
        >
          <UserPlus className="w-4 h-4" />
          <span className="hidden sm:inline">Novo Usuário</span>
          <span className="sm:hidden">Novo</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="responsive-stats-grid">
        <div className="stats-card-compact group hover-lift animate-slide-up">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{filteredUsers.length}</p>
              <p className="text-sm text-gray-600">Total</p>
            </div>
          </div>
        </div>
        
        <div className="stats-card-compact group hover-lift animate-slide-up" style={{animationDelay: '0.1s'}}>
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <UserCheck className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-lg font-bold text-gray-900 group-hover:text-green-600 transition-colors">
                {filteredUsers.filter(u => (u.status || 'active') === 'active').length}
              </p>
              <p className="text-sm text-gray-600">Ativos</p>
            </div>
          </div>
        </div>
        
        <div className="stats-card-compact group hover-lift animate-slide-up" style={{animationDelay: '0.2s'}}>
          <div className="flex items-center">
            <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Server className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-lg font-bold text-gray-900 group-hover:text-yellow-600 transition-colors">
                {filteredUsers.filter(u => u.whatsapp).length}
              </p>
              <p className="text-sm text-gray-600">WhatsApp</p>
            </div>
          </div>
        </div>
        
        <div className="stats-card-compact group hover-lift animate-slide-up" style={{animationDelay: '0.3s'}}>
          <div className="flex items-center">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-lg font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                R$ {filteredUsers.reduce((sum, user) => sum + (user.saldo || 0), 0).toFixed(2)}
              </p>
              <p className="text-sm text-gray-600">Saldo Total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table/Cards */}
      <div className="data-table animate-slide-up" style={{animationDelay: '0.4s'}}>
        <div className="table-header">
          <h2 className="text-lg font-semibold text-gray-900">Lista de Usuários</h2>
          <div className="flex gap-2">
            <button className="btn-secondary text-sm flex items-center gap-2 touch-target">
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Buscar</span>
            </button>
          </div>
        </div>
        
        {/* Mobile Cards */}
        <div className="block sm:hidden space-y-3">
          {filteredUsers.map((user) => (
            <div key={user.id} className="mobile-card group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{user.nome || user.name}</h3>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(user)}
                    className="touch-target p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="touch-target p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">PIX:</span>
                  <p className="font-mono text-blue-600 truncate">{user.chave_pix || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-500">WhatsApp:</span>
                  <p className="truncate">{user.whatsapp || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Saldo:</span>
                  <p className="font-semibold text-green-600">R$ {(user.saldo || 0).toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>
                  <button
                    onClick={() => toggleStatus(user.id)}
                    className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                      (user.status || 'active') === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {(user.status || 'active') === 'active' ? 'Ativo' : 'Inativo'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Desktop Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuário</th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chave PIX</th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">WhatsApp</th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Saldo</th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Data</th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.nome || user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-mono bg-blue-50 text-blue-800 px-2 py-1 rounded truncate max-w-32 block">
                      {user.chave_pix || 'N/A'}
                    </span>
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                    <span className="text-sm text-gray-900">
                      {user.whatsapp || 'N/A'}
                    </span>
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-green-600">R$ {(user.saldo || 0).toFixed(2)}</span>
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleStatus(user.id)}
                      className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold touch-target ${
                        (user.status || 'active') === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {(user.status || 'active') === 'active' ? 'Ativo' : 'Inativo'}
                    </button>
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                    {user.criado_em ? new Date(user.criado_em).toLocaleDateString('pt-BR') : 'N/A'}
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg touch-target"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg touch-target"
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
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="modal-close-btn"
                aria-label="Fechar modal"
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
                <label className="form-label">Chave PIX (opcional)</label>
                <input
                  type="text"
                  value={formData.chave_pix}
                  onChange={(e) => setFormData({ ...formData, chave_pix: e.target.value })}
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
