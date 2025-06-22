import React, { useState, useEffect } from 'react';
import { Key, CheckCircle, Upload, Search, RefreshCw, BarChart3, DollarSign, Filter, Edit, Trash2, Download } from 'lucide-react';
import { supabase, getSupabaseAdmin } from '../lib/supabaseClient';

const PasswordsManagement = () => {
  const [passwords, setPasswords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [importData, setImportData] = useState('');
  const [selectedMikrotik, setSelectedMikrotik] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [editingPassword, setEditingPassword] = useState<any>(null);
  const [selectedPasswords, setSelectedPasswords] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [plans, setPlans] = useState([]);
  const [mikrotiks, setMikrotiks] = useState([]);
  const [planMap, setPlanMap] = useState({});
  const [mikrotikMap, setMikrotikMap] = useState({});
  const [totalReceita, setTotalReceita] = useState(0);
  const [importLoading, setImportLoading] = useState(false);

  useEffect(() => {
    async function fetchPasswords() {
      setLoading(true);
      const { data, error } = await supabase.from('senhas').select('*');
      if (!error) setPasswords(data || []);
      setLoading(false);
    }
    fetchPasswords();
  }, []);

  useEffect(() => {
    async function fetchMikrotiks() {
      const { data, error } = await supabase.from('mikrotiks').select('id, nome');
      if (!error) setMikrotiks(data || []);
    }
    fetchMikrotiks();
  }, []);

  useEffect(() => {
    async function fetchPlans() {
      if (selectedMikrotik) {
        const { data, error } = await supabase.from('planos').select('*').eq('mikrotik_id', selectedMikrotik);
        if (!error) setPlans(data || []);
      } else {
        setPlans([]);
      }
    }
    fetchPlans();
  }, [selectedMikrotik]);

  useEffect(() => {
    async function fetchAllPlansAndMikrotiks() {
      const { data: planos } = await supabase.from('planos').select('id, nome, mikrotik_id');
      const { data: mikrotiksData } = await supabase.from('mikrotiks').select('id, nome');
      const planMapObj = {};
      (planos || []).forEach(p => { planMapObj[p.id] = p; });
      setPlanMap(planMapObj);
      const mikrotikMapObj = {};
      (mikrotiksData || []).forEach(m => { mikrotikMapObj[m.id] = m; });
      setMikrotikMap(mikrotikMapObj);
    }
    fetchAllPlansAndMikrotiks();
  }, []);

  useEffect(() => {
    async function fetchReceita() {
      const { data } = await supabase.from('vendas').select('valor');
      if (data) {
        setTotalReceita(data.reduce((acc, v) => acc + Number(v.valor || 0), 0));
      }
    }
    fetchReceita();
  }, []);

  const handleImport = async () => {
    if (!selectedMikrotik || !selectedPlan || !importData) {
      alert('Por favor, selecione o Mikrotik, Plano e forneça os dados das senhas.');
      return;
    }

    try {
      setImportLoading(true);
      
             // Busca senhas existentes usando cliente administrativo
       const supabaseAdmin = getSupabaseAdmin();
       const { data: existentes, error: errorExistentes } = await supabaseAdmin
         .from('senhas')
         .select('usuario, senha')
         .eq('plano_id', selectedPlan);
      
      if (errorExistentes) {
        console.error('Erro ao buscar senhas existentes:', errorExistentes);
        throw new Error('Erro ao verificar senhas existentes');
      }
      
      const existentesSet = new Set((existentes || []).map(s => `${s.usuario}:${s.senha}`));
      
      // Processa os dados de entrada
      const linhas = importData.split('\n').map(l => l.trim()).filter(Boolean);
      const pares = linhas.map(l => {
        const [usuario, senha] = l.split(':');
        return { usuario: usuario?.trim(), senha: senha?.trim() };
      }).filter(p => p.usuario && p.senha);
      
             if (pares.length === 0) {
         alert('Nenhuma senha válida encontrada. Use o formato: usuario:senha');
         setImportLoading(false);
         return;
       }
      
      // Filtra apenas senhas novas
      const novas = pares.filter(p => !existentesSet.has(`${p.usuario}:${p.senha}`));
      
      console.log(`Processando importação: ${linhas.length} linhas, ${pares.length} pares válidos, ${novas.length} novas`);
      
             if (novas.length > 0) {
         const { error: errorInsert } = await supabaseAdmin.from('senhas').insert(novas.map(p => ({
           usuario: p.usuario,
           senha: p.senha,
           disponivel: true,
           vendida: false,
           plano_id: selectedPlan,
           criada_em: new Date().toISOString()
         })));
        
        if (errorInsert) {
          console.error('Erro ao inserir senhas:', errorInsert);
          throw new Error('Erro ao salvar senhas no banco de dados');
        }
      }
      
      // Feedback para o usuário
      const duplicadas = pares.length - novas.length;
      let mensagem = `${novas.length} senhas importadas com sucesso!`;
      if (duplicadas > 0) {
        mensagem += ` (${duplicadas} já existiam e foram ignoradas)`;
      }
      
      alert(mensagem);
      
      // Limpa o modal
      setShowImportModal(false);
      setImportData('');
      setSelectedMikrotik('');
      setSelectedPlan('');
      
      // Recarrega a lista de senhas
      const { data, error } = await supabase.from('senhas').select('*');
      if (!error) setPasswords(data || []);
      
    } catch (error) {
      console.error('Erro na importação:', error);
      alert(`Erro ao importar senhas: ${error.message}`);
    } finally {
      setImportLoading(false);
    }
  };

  const handleEdit = (password: any) => {
    setEditingPassword(password);
    setShowEditModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta senha?')) {
      setLoading(true);
      const supabaseAdmin = getSupabaseAdmin();
      const { error } = await supabaseAdmin.from('senhas').delete().eq('id', id);
      if (error) {
        console.error('Erro ao excluir senha:', error);
        alert('Erro ao excluir senha. Tente novamente.');
      } else {
        setPasswords(passwords.filter(p => p.id !== id));
      }
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Tem certeza que deseja excluir ${selectedPasswords.length} senhas?`)) {
      setLoading(true);
      const supabaseAdmin = getSupabaseAdmin();
      const { error } = await supabaseAdmin.from('senhas').delete().in('id', selectedPasswords);
      if (error) {
        console.error('Erro ao excluir senhas:', error);
        alert('Erro ao excluir senhas. Tente novamente.');
      } else {
        setPasswords(passwords.filter(p => !selectedPasswords.includes(p.id)));
        setSelectedPasswords([]);
      }
      setLoading(false);
    }
  };

  const filteredPasswords = passwords.filter(password => {
    const matchesSearch = (password.usuario || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (planMap[password.plano_id]?.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (mikrotikMap[planMap[password.plano_id]?.mikrotik_id]?.nome || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || (password.vendida ? 'sold' : 'available') === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const availableCount = passwords.filter(p => p.disponivel && !p.vendida).length;
  const soldCount = passwords.filter(p => p.vendida).length;

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="loading-spinner h-12 w-12 mx-auto mb-4"></div>
            <p className="text-gray-600 responsive-text">Carregando senhas...</p>
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
            <Key className="w-6 h-6 sm:w-7 sm:h-7 mr-2 text-indigo-600" />
            <span className="hidden sm:inline">Gerenciar Senhas</span>
            <span className="sm:hidden">Senhas</span>
          </h1>
          <p className="text-gray-600 mt-1 responsive-text">Controle de senhas dos Mikrotiks</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="btn-primary flex items-center gap-2 touch-target"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Importar</span>
          </button>
          {selectedPasswords.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="btn-danger flex items-center gap-2 touch-target"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Excluir ({selectedPasswords.length})</span>
              <span className="sm:hidden">{selectedPasswords.length}</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stats-card">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Key className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-xl font-bold text-gray-900">{passwords.length}</p>
              <p className="text-sm text-gray-600">Total de Senhas</p>
            </div>
          </div>
        </div>

        <div className="stats-card">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-xl font-bold text-gray-900">{availableCount}</p>
              <p className="text-sm text-gray-600">Disponíveis</p>
            </div>
          </div>
        </div>

        <div className="stats-card">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-xl font-bold text-gray-900">{soldCount}</p>
              <p className="text-sm text-gray-600">Vendidas</p>
            </div>
          </div>
        </div>

        <div className="stats-card">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-xl font-bold text-gray-900">R$ {totalReceita.toFixed(2)}</p>
              <p className="text-sm text-gray-600">Receita Total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="form-group">
            <label className="form-label flex items-center gap-2">
              <Search className="w-4 h-4" />
              Buscar
            </label>
            <input
              type="text"
              placeholder="Digite usuário, senha ou mikrotik..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field"
            />
          </div>

          <div className="form-group">
            <label className="form-label flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">Todos os status</option>
              <option value="available">Disponível</option>
              <option value="sold">Vendida</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Ações</label>
            <div className="flex gap-2">
              <button className="btn-secondary text-sm flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Atualizar
              </button>
              <button className="btn-secondary text-sm flex items-center gap-2">
                <Download className="w-4 h-4" />
                Exportar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Passwords Table */}
      <div className="data-table">
        <div className="table-header">
          <h3 className="text-lg font-semibold text-gray-900">Lista de Senhas ({filteredPasswords.length})</h3>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedPasswords(filteredPasswords.map(p => p.id));
                } else {
                  setSelectedPasswords([]);
                }
              }}
              checked={selectedPasswords.length === filteredPasswords.length && filteredPasswords.length > 0}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-600">Selecionar todos</span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPasswords(filteredPasswords.map(p => p.id));
                      } else {
                        setSelectedPasswords([]);
                      }
                    }}
                    checked={selectedPasswords.length === filteredPasswords.length && filteredPasswords.length > 0}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mikrotik/Plano</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuário</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Senha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPasswords.map((password) => (
                <tr key={password.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedPasswords.includes(password.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPasswords([...selectedPasswords, password.id]);
                        } else {
                          setSelectedPasswords(selectedPasswords.filter(id => id !== password.id));
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{mikrotikMap[planMap[password.plano_id]?.mikrotik_id]?.nome || '-'}</p>
                      <p className="text-sm text-gray-500">{planMap[password.plano_id]?.nome || '-'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded text-gray-900">{password.usuario}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded text-gray-900">{password.senha}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      password.vendida 
                        ? 'bg-gray-100 text-gray-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {password.vendida ? 'Vendida' : 'Disponível'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {password.vendida_em ? new Date(password.vendida_em).toLocaleDateString('pt-BR') : 
                     password.criada_em ? new Date(password.criada_em).toLocaleDateString('pt-BR') : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(password)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(password.id)}
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

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Upload className="w-6 h-6 text-blue-600" />
                Importar Senhas
              </h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="form-group">
                <label className="form-label">Selecionar Mikrotik</label>
                <select
                  value={selectedMikrotik}
                  onChange={(e) => { setSelectedMikrotik(e.target.value); setSelectedPlan(''); }}
                  className="input-field"
                >
                  <option value="">Selecione um Mikrotik</option>
                  {mikrotiks.map((mikrotik) => (
                    <option key={mikrotik.id} value={mikrotik.id}>
                      {mikrotik.nome}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Selecionar Plano</label>
                <select
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                  className="input-field"
                  disabled={!selectedMikrotik}
                >
                  <option value="">Selecione um Plano</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.nome} - R$ {plan.preco}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Dados das Senhas (uma por linha)</label>
                <textarea
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  className="input-field min-h-[120px] resize-none"
                  placeholder="usuario:senha&#10;usuario2:senha2&#10;usuario3:senha3"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleImport}
                  className="flex-1 btn-primary"
                  disabled={!selectedMikrotik || !selectedPlan || !importData || importLoading}
                >
                  {importLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                      Importando...
                    </>
                  ) : (
                    'Importar'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PasswordsManagement;
