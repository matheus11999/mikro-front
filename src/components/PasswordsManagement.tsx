import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload,
  Eye,
  EyeOff,
  Trash2,
  CheckCircle,
  XCircle,
  RefreshCw,
  Copy,
  Router,
  Calendar,
  DollarSign,
  Activity
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface Senha {
  id: string;
  senha: string;
  disponivel: boolean;
  mikrotik_id: string;
  mikrotiks?: {
    nome: string;
  };
  criado_em: string;
  vendido_em?: string;
  preco?: number;
}

interface Mikrotik {
  id: string;
  nome: string;
}

export default function PasswordsManagement() {
  const [senhas, setSenhas] = useState<Senha[]>([]);
  const [mikrotiks, setMikrotiks] = useState<Mikrotik[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'sold'>('all');
  const [filterMikrotik, setFilterMikrotik] = useState<string>('all');
  const [showPasswords, setShowPasswords] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkPasswords, setBulkPasswords] = useState('');
  const [selectedMikrotik, setSelectedMikrotik] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [senhasRes, mikrotiksRes] = await Promise.all([
        supabase
          .from('senhas')
          .select(`
            *,
            mikrotiks(nome)
          `)
          .order('criado_em', { ascending: false }),
        supabase.from('mikrotiks').select('*')
      ]);

      if (senhasRes.error) throw senhasRes.error;
      if (mikrotiksRes.error) throw mikrotiksRes.error;

      setSenhas(senhasRes.data || []);
      setMikrotiks(mikrotiksRes.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSenhas = senhas.filter(senha => {
    const matchesSearch = senha.senha.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'available' && senha.disponivel) ||
      (filterStatus === 'sold' && !senha.disponivel);
    const matchesMikrotik = filterMikrotik === 'all' || senha.mikrotik_id === filterMikrotik;
    return matchesSearch && matchesStatus && matchesMikrotik;
  });

  const generatePasswords = async () => {
    if (!selectedMikrotik || !bulkPasswords.trim()) {
      alert('Selecione um MikroTik e adicione senhas');
      return;
    }

    try {
      const passwordList = bulkPasswords
        .split('\n')
        .map(p => p.trim())
        .filter(p => p.length > 0);

      const newPasswords = passwordList.map(password => ({
        senha: password,
        disponivel: true,
        mikrotik_id: selectedMikrotik,
        criado_em: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('senhas')
        .insert(newPasswords);

      if (error) throw error;

      setShowBulkModal(false);
      setBulkPasswords('');
      setSelectedMikrotik('');
      await loadData();
    } catch (error) {
      console.error('Erro ao gerar senhas:', error);
      alert('Erro ao gerar senhas');
    }
  };

  const deletePassword = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta senha?')) return;

    try {
      const { error } = await supabase
        .from('senhas')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadData();
    } catch (error) {
      console.error('Erro ao excluir senha:', error);
      alert('Erro ao excluir senha');
    }
  };

  const toggleAvailability = async (senha: Senha) => {
    try {
      const { error } = await supabase
        .from('senhas')
        .update({ 
          disponivel: !senha.disponivel,
          vendido_em: !senha.disponivel ? null : new Date().toISOString()
        })
        .eq('id', senha.id);

      if (error) throw error;
      await loadData();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      alert('Erro ao alterar status');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Toast notification would be nice here
  };

  const stats = {
    total: senhas.length,
    available: senhas.filter(s => s.disponivel).length,
    sold: senhas.filter(s => !s.disponivel).length,
    revenue: senhas.filter(s => !s.disponivel).reduce((sum, s) => sum + (s.preco || 0), 0)
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
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded"></div>
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
          <h1 className="text-3xl font-bold text-gray-900">Gerenciar Senhas</h1>
          <p className="text-gray-600 mt-1">
            {filteredSenhas.length} senha{filteredSenhas.length !== 1 ? 's' : ''} encontrada{filteredSenhas.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPasswords(!showPasswords)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showPasswords 
                ? 'bg-gray-600 text-white hover:bg-gray-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showPasswords ? 'Ocultar' : 'Mostrar'}
          </button>
          <button
            onClick={() => setShowBulkModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Adicionar Senhas
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Senhas</p>
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Key className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Disponíveis</p>
              <p className="text-2xl font-bold text-green-600">{stats.available}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xs text-gray-500">
              {stats.total > 0 && `${Math.round((stats.available / stats.total) * 100)}% disponível`}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Vendidas</p>
              <p className="text-2xl font-bold text-orange-600">{stats.sold}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Receita</p>
              <p className="text-2xl font-bold text-purple-600">R$ {stats.revenue.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-purple-600" />
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
              placeholder="Buscar por senha..."
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
              <option value="available">Disponíveis</option>
              <option value="sold">Vendidas</option>
            </select>
          </div>

          <div className="relative">
            <Router className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={filterMikrotik}
              onChange={(e) => setFilterMikrotik(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="all">Todos os MikroTiks</option>
              {mikrotiks.map(mikrotik => (
                <option key={mikrotik.id} value={mikrotik.id}>{mikrotik.nome}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Passwords Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Senha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  MikroTik
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Criada em
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSenhas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Key className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhuma senha encontrada</p>
                  </td>
                </tr>
              ) : (
                filteredSenhas.map((senha) => (
                  <tr key={senha.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          senha.disponivel ? 'bg-green-100' : 'bg-orange-100'
                        }`}>
                          <Key className={`w-5 h-5 ${
                            senha.disponivel ? 'text-green-600' : 'text-orange-600'
                          }`} />
                        </div>
                        <div>
                          <div className="font-mono text-sm font-medium text-gray-900">
                            {showPasswords ? senha.senha : '••••••••'}
                          </div>
                          <button
                            onClick={() => copyToClipboard(senha.senha)}
                            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-1"
                          >
                            <Copy className="w-3 h-3" />
                            Copiar
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Router className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {senha.mikrotiks?.nome || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleAvailability(senha)}
                          className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full transition-colors ${
                            senha.disponivel
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                          }`}
                        >
                          {senha.disponivel ? (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              Disponível
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" />
                              Vendida
                            </>
                          )}
                        </button>
                      </div>
                      {senha.vendido_em && (
                        <div className="text-xs text-gray-500 mt-1">
                          Vendida: {new Date(senha.vendido_em).toLocaleDateString('pt-BR')}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(senha.criado_em).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => toggleAvailability(senha)}
                          className={`p-2 rounded-md transition-colors ${
                            senha.disponivel 
                              ? 'text-orange-600 hover:bg-orange-50' 
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                          title={senha.disponivel ? 'Marcar como vendida' : 'Marcar como disponível'}
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deletePassword(senha.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Excluir senha"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Add Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Adicionar Senhas em Lote</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selecionar MikroTik
                </label>
                <select
                  value={selectedMikrotik}
                  onChange={(e) => setSelectedMikrotik(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecione um MikroTik</option>
                  {mikrotiks.map(mikrotik => (
                    <option key={mikrotik.id} value={mikrotik.id}>{mikrotik.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Senhas (uma por linha)
                </label>
                <textarea
                  value={bulkPasswords}
                  onChange={(e) => setBulkPasswords(e.target.value)}
                  rows={8}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder="senha123&#10;abc456&#10;xyz789"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {bulkPasswords.split('\n').filter(p => p.trim()).length} senhas inseridas
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={generatePasswords}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Adicionar Senhas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
