import React, { useState, useEffect, useCallback } from 'react';
import { Radio, Users, Settings, Download, Edit, Plus, Search, RefreshCw, BarChart3 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const MikrotiksManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [selectedMikrotik, setSelectedMikrotik] = useState<any>(null);
  const [mikrotiks, setMikrotiks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [nomeMikrotik, setNomeMikrotik] = useState('');
  const [nomeProvedor, setNomeProvedor] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [porcentagemLucro, setPorcentagemLucro] = useState(0);
  const [showAddPlanModal, setShowAddPlanModal] = useState(false);
  const [planName, setPlanName] = useState('');
  const [planPrice, setPlanPrice] = useState('');
  const [editPlan, setEditPlan] = useState(null);
  const [editPlanName, setEditPlanName] = useState('');
  const [editPlanPrice, setEditPlanPrice] = useState('');
  const [senhaCounts, setSenhaCounts] = useState({});
  const [editMikrotik, setEditMikrotik] = useState(null);
  const [editNomeMikrotik, setEditNomeMikrotik] = useState('');
  const [editNomeProvedor, setEditNomeProvedor] = useState('');
  const [editClienteId, setEditClienteId] = useState('');
  const [editPorcentagemLucro, setEditPorcentagemLucro] = useState(0);
  const [importPlan, setImportPlan] = useState(null);
  const [importText, setImportText] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState('');

  const fetchMikrotiks = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('mikrotiks').select('*');
    if (!error) setMikrotiks(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMikrotiks();
  }, [fetchMikrotiks]);

  const fetchPlans = useCallback(async () => {
    if (selectedMikrotik) {
      const { data: planosData } = await supabase.from('planos').select('*').eq('mikrotik_id', selectedMikrotik.id);
      setPlans(planosData || []);
      if (planosData && planosData.length > 0) {
        const ids = planosData.map(p => p.id);
        const { data: senhasData } = await supabase
          .from('senhas')
          .select('plano_id')
          .in('plano_id', ids);
        const counts = {};
        (senhasData || []).forEach(s => {
          counts[s.plano_id] = (counts[s.plano_id] || 0) + 1;
        });
        setSenhaCounts(counts);
      } else {
        setSenhaCounts({});
      }
    }
  }, [selectedMikrotik]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  useEffect(() => {
    supabase.from('clientes').select('id, nome').then(({ data }) => setClientes(data || []));
  }, []);

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

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="loading-spinner h-12 w-12 mx-auto mb-4"></div>
            <p className="text-gray-600 responsive-text">Carregando mikrotiks...</p>
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
            <Radio className="w-6 h-6 sm:w-7 sm:h-7 mr-2 text-blue-600" />
            <span className="hidden sm:inline">Gerenciar Mikrotiks</span>
            <span className="sm:hidden">Mikrotiks</span>
          </h1>
          <p className="text-gray-600 mt-1 responsive-text">Gerencie todos os equipamentos e planos</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2 touch-target"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Novo Mikrotik</span>
          <span className="sm:hidden">Novo</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="search-filter-card animate-slide-up" style={{animationDelay: '0.1s'}}>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar mikrotiks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary flex items-center gap-2 touch-target">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Exportar</span>
            </button>
            <button 
              onClick={fetchMikrotiks}
              className="btn-secondary flex items-center gap-2 touch-target"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Atualizar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mikrotiks Grid */}
      <div className="responsive-grid animate-slide-up" style={{animationDelay: '0.2s'}}>
        {filteredMikrotiks.map((mikrotik, index) => (
          <div 
            key={mikrotik.id} 
            className="data-card group hover-lift"
            style={{animationDelay: `${0.3 + index * 0.1}s`}}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                  <Radio className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{mikrotik.name}</h3>
                  <p className="text-xs text-gray-500">ID: {mikrotik.id}</p>
                </div>
              </div>
              <span className={`status-badge ${
                mikrotik.status === 'Ativo' ? 'status-active' : 'status-inactive'
              }`}>
                {mikrotik.status}
              </span>
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Proprietário:</span>
                <span className="font-medium text-gray-900">{clientes.find(c => c.id === mikrotik.cliente_id)?.nome || 'Desconhecido'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Provedor:</span>
                <span className="text-gray-900">{mikrotik.provider_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Lucro Admin:</span>
                <span className="font-semibold text-green-600">{mikrotik.profitpercentage}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Status:</span>
                <span className="font-semibold text-blue-600">{mikrotik.status}</span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  setSelectedMikrotik(mikrotik);
                  setShowPlansModal(true);
                }}
                className="flex-1 btn-primary text-sm flex items-center justify-center gap-2 touch-target"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Planos</span>
                <span className="sm:hidden">Ver</span>
              </button>
              <button
                className="btn-secondary text-sm flex items-center justify-center touch-target"
                onClick={() => {
                  setEditMikrotik(mikrotik);
                  setEditNomeMikrotik(mikrotik.nome);
                  setEditNomeProvedor(mikrotik.provider_name);
                  setEditClienteId(mikrotik.cliente_id);
                  setEditPorcentagemLucro(mikrotik.profitpercentage);
                }}
              >
                <Edit className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Mikrotik Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                Novo Mikrotik
              </h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <form className="space-y-4" onSubmit={async (e) => {
              e.preventDefault();
              setLoading(true);
              await supabase.from('mikrotiks').insert([{
                nome: nomeMikrotik,
                provider_name: nomeProvedor,
                status: 'Ativo',
                cliente_id: clienteId,
                profitpercentage: porcentagemLucro
              }]);
              const { data } = await supabase.from('mikrotiks').select('*');
              setMikrotiks(data || []);
              setShowAddModal(false);
              setLoading(false);
            }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Nome do Mikrotik</label>
                  <input type="text" className="input-field" placeholder="Ex: Mikrotik Central" value={nomeMikrotik} onChange={e => setNomeMikrotik(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Nome do Provedor</label>
                  <input type="text" className="input-field" placeholder="Ex: Provider Central" value={nomeProvedor} onChange={e => setNomeProvedor(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Proprietário</label>
                  <select className="input-field" value={clienteId} onChange={e => setClienteId(e.target.value)} required>
                    <option value="">Selecione um usuário...</option>
                    {clientes.map(cliente => (
                      <option key={cliente.id} value={cliente.id}>{cliente.nome}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                                  <label className="form-label">Porcentagem de Lucro para Admin (%)</label>
                <input type="number" className="input-field" placeholder="Ex: 10" min="0" max="100" value={porcentagemLucro} onChange={e => setPorcentagemLucro(Number(e.target.value))} required />
                <p className="text-xs text-gray-500 mt-1">Restante vai para o proprietário do mikrotik</p>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary flex-1">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary flex-1">
                  Criar Mikrotik
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Plans Management Modal */}
      {showPlansModal && selectedMikrotik && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-600" />
                Gerenciar Planos - <span className="text-2xl font-bold text-blue-700">{selectedMikrotik.nome}</span>
              </h2>
              <button 
                onClick={() => setShowPlansModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-6">
              <button
                className="btn-primary flex items-center gap-2"
                onClick={() => setShowAddPlanModal(true)}
              >
                <Plus className="w-4 h-4" />
                Novo Plano
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plans.map((plan) => (
                <div key={plan.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">{plan.nome}</h3>
                    <span className="text-lg font-bold text-green-600">R$ {plan.preco}</span>
                  </div>
                  <p className="text-gray-600 mb-3 text-sm">Senhas: <span className="font-bold">{senhaCounts[plan.id] || 0}</span></p>
                  <div className="flex gap-2">
                    <button
                      className="btn-secondary text-sm flex-1 flex items-center justify-center gap-1"
                      onClick={() => {
                        setEditPlan(plan);
                        setEditPlanName(plan.nome);
                        setEditPlanPrice(plan.preco);
                      }}
                    >
                      <Edit className="w-3 h-3" />
                      Editar
                    </button>
                    <button
                      className="btn-danger text-sm px-3"
                      onClick={async () => {
                        if (window.confirm('Tem certeza que deseja excluir este plano?')) {
                          await supabase.from('planos').delete().eq('id', plan.id);
                          fetchPlans();
                        }
                      }}
                    >
                      🗑️
                    </button>
                    <button
                      className="btn-secondary text-sm flex-1 flex items-center justify-center gap-1"
                      onClick={() => setImportPlan(plan)}
                    >
                      <Download className="w-3 h-3" />
                      Importar Senhas
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal de criação de plano */}
      {showAddPlanModal && selectedMikrotik && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                Novo Plano para <span className="text-2xl font-bold text-blue-700">{selectedMikrotik.nome}</span>
              </h2>
              <button onClick={() => setShowAddPlanModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <form className="space-y-4" onSubmit={async (e) => {
              e.preventDefault();
              await supabase.from('planos').insert([
                {
                  nome: planName,
                  preco: planPrice,
                  mikrotik_id: selectedMikrotik.id
                }
              ]);
              fetchPlans();
              setShowAddPlanModal(false);
              setPlanName('');
              setPlanPrice('');
            }}>
              <div className="form-group">
                <label className="form-label">Nome do Plano</label>
                <input type="text" className="input-field" value={planName} onChange={e => setPlanName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Preço</label>
                <input type="number" className="input-field" value={planPrice} onChange={e => setPlanPrice(e.target.value)} required min="0" step="0.01" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAddPlanModal(false)} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" className="btn-primary flex-1">Criar Plano</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de edição de plano */}
      {editPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Edit className="w-5 h-5 text-blue-600" />
                Editar Plano
              </h2>
              <button onClick={() => setEditPlan(null)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <form className="space-y-4" onSubmit={async (e) => {
              e.preventDefault();
              await supabase.from('planos').update({ nome: editPlanName, preco: editPlanPrice }).eq('id', editPlan.id);
              setEditPlan(null);
              setEditPlanName('');
              setEditPlanPrice('');
              fetchPlans();
            }}>
              <div className="form-group">
                <label className="form-label">Nome do Plano</label>
                <input type="text" className="input-field" value={editPlanName} onChange={e => setEditPlanName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Preço</label>
                <input type="number" className="input-field" value={editPlanPrice} onChange={e => setEditPlanPrice(e.target.value)} required min="0" step="0.01" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setEditPlan(null)} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" className="btn-primary flex-1">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de edição de Mikrotik */}
      {editMikrotik && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Edit className="w-5 h-5 text-blue-600" />
                Editar Mikrotik
              </h2>
              <button onClick={() => setEditMikrotik(null)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <form className="space-y-4" onSubmit={async (e) => {
              e.preventDefault();
              await supabase.from('mikrotiks').update({
                nome: editNomeMikrotik,
                provider_name: editNomeProvedor,
                cliente_id: editClienteId,
                profitpercentage: editPorcentagemLucro
              }).eq('id', editMikrotik.id);
              setEditMikrotik(null);
              fetchMikrotiks();
            }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Nome do Mikrotik</label>
                  <input type="text" className="input-field" value={editNomeMikrotik} onChange={e => setEditNomeMikrotik(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Nome do Provedor</label>
                  <input type="text" className="input-field" value={editNomeProvedor} onChange={e => setEditNomeProvedor(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Proprietário</label>
                  <select className="input-field" value={editClienteId} onChange={e => setEditClienteId(e.target.value)} required>
                    <option value="">Selecione um usuário...</option>
                    {clientes.map(cliente => (
                      <option key={cliente.id} value={cliente.id}>{cliente.nome}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                                  <label className="form-label">Porcentagem de Lucro para Admin (%)</label>
                <input type="number" className="input-field" min="0" max="100" value={editPorcentagemLucro} onChange={e => setEditPorcentagemLucro(Number(e.target.value))} required />
                <p className="text-xs text-gray-500 mt-1">Restante vai para o proprietário do mikrotik</p>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setEditMikrotik(null)} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" className="btn-primary flex-1">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de importação de senhas */}
      {importPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-lg w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Download className="w-5 h-5 text-blue-600" />
                Importar Senhas para <span className="text-blue-700 font-bold">{importPlan.nome}</span>
              </h2>
              <button onClick={() => { setImportPlan(null); setImportText(''); setImportResult(''); }} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <form className="space-y-4" onSubmit={async (e) => {
              e.preventDefault();
              setImportLoading(true);
              setImportResult('');
              // Parse senhas usuario:senha
              const linhas = importText.split('\n').map(l => l.trim()).filter(Boolean);
              const pares = linhas.map(l => {
                const [usuario, senha] = l.split(':');
                return { usuario: usuario?.trim(), senha: senha?.trim() };
              }).filter(p => p.usuario && p.senha);
              // Busca senhas já existentes para o plano
              const { data: existentes } = await supabase
                .from('senhas')
                .select('usuario, senha')
                .eq('plano_id', importPlan.id);
              const existentesSet = new Set((existentes || []).map(s => `${s.usuario}:${s.senha}`));
              // Filtra apenas novas
              const novas = pares.filter(p => !existentesSet.has(`${p.usuario}:${p.senha}`));
              // Insere em lote
              if (novas.length > 0) {
                await supabase.from('senhas').insert(novas.map(p => ({
                  usuario: p.usuario,
                  senha: p.senha,
                  disponivel: true,
                  vendida: false,
                  plano_id: importPlan.id
                })));
              }
              setImportLoading(false);
              setImportResult(`${novas.length} senhas importadas com sucesso!` + (novas.length < pares.length ? ` (${pares.length - novas.length} já existiam)` : ''));
              fetchPlans();
            }}>
              <div className="form-group">
                <label className="form-label">Cole as senhas (usuario:senha por linha)</label>
                <textarea className="input-field" rows={8} value={importText} onChange={e => setImportText(e.target.value)} required placeholder="usuario1:senha1\nusuario2:senha2" />
              </div>
              {importResult && <div className="text-green-600 font-bold">{importResult}</div>}
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setImportPlan(null); setImportText(''); setImportResult(''); }} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" className="btn-primary flex-1" disabled={importLoading}>{importLoading ? 'Importando...' : 'Importar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MikrotiksManagement;
