import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Key, DollarSign, BarChart3, TrendingUp, Calendar, Download, RefreshCw, Wallet, Radio, Users, Smartphone, Monitor, Laptop, Tablet, Wifi } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface Cliente {
  id: string;
  nome: string;
  email: string;
  saldo: number;
  role: string;
  whatsapp?: string;
  chave_pix?: string;
}

interface Mikrotik {
  id: string;
  nome: string;
  provider_name?: string;
  status?: string;
  cliente_id: string;
  profitpercentage: number;
}

interface Plano {
  id: string;
  nome: string;
  preco: number;
  mikrotik_id: string;
  duracao: number;
}

interface Senha {
  id: string;
  plano_id: string;
  disponivel: boolean;
  vendida: boolean;
  usuario?: string;
  senha?: string;
  vendida_em?: string;
}

interface Venda {
  id: string;
  cliente_id: string;
  mikrotik_id: string;
  plano_id: string;
  senha_id?: string;
  valor: number;
  lucro: number;
  status: string;
  data: string;
  preco: number;
  descricao?: string;
  planos?: { nome: string };
  mikrotiks?: { nome: string; profitpercentage: number };
  macs?: { mac_address: string };
}

interface MikrotikWithPlans extends Mikrotik {
  planos: Array<Plano & {
    senhas: Senha[];
    available: number;
    sold: number;
    totalPasswords: number;
    revenue: number;
  }>;
}

interface DashboardStats {
  totalSenhasDisponiveis: number;
  vendasMesAtual: number;
  receitaDiaAtual: number;
  totalReceita: number;
}

const ClientDashboard = () => {
  const [showPasswords, setShowPasswords] = useState(false);
  const [clientData, setClientData] = useState<Cliente | null>(null);
  const [userMikrotiks, setUserMikrotiks] = useState<MikrotikWithPlans[]>([]);
  const [salesHistory, setSalesHistory] = useState<Venda[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalSenhasDisponiveis: 0,
    vendasMesAtual: 0,
    receitaDiaAtual: 0,
    totalReceita: 0
  });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      try {
        // Buscar o cliente logado
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.error('Usuário não autenticado');
          setLoading(false);
          return;
        }

        const { data: clientes, error: clienteError } = await supabase
          .from('clientes')
          .select('*')
          .eq('email', user.email)
          .limit(1);

        if (clienteError) {
          console.error('Erro ao buscar cliente:', clienteError);
          setLoading(false);
          return;
        }

        if (!clientes || clientes.length === 0) {
          console.error('Cliente não encontrado');
          setLoading(false);
          return;
        }

        const cliente = clientes[0] as Cliente;
        setClientData(cliente);

        // Buscar mikrotiks do cliente
        const { data: mikrotiks, error: mikrotiksError } = await supabase
          .from('mikrotiks')
          .select('*')
          .eq('cliente_id', cliente.id);

        if (mikrotiksError) {
          console.error('Erro ao buscar mikrotiks:', mikrotiksError);
          setUserMikrotiks([]);
        } else {
          const mikrotiksWithPlans: MikrotikWithPlans[] = [];
          
          // Para cada mikrotik, buscar seus planos e senhas
          for (const mikrotik of (mikrotiks as Mikrotik[]) || []) {
            const { data: planos, error: planosError } = await supabase
              .from('planos')
              .select('*')
              .eq('mikrotik_id', mikrotik.id);

            if (planosError) {
              console.error('Erro ao buscar planos:', planosError);
              continue;
            }

            const planosWithSenhas = [];
            for (const plano of (planos as Plano[]) || []) {
              const { data: senhas, error: senhasError } = await supabase
                .from('senhas')
                .select('*')
                .eq('plano_id', plano.id);

              if (senhasError) {
                console.error('Erro ao buscar senhas:', senhasError);
                continue;
              }

              const senhasArray = (senhas as Senha[]) || [];
              const available = senhasArray.filter(s => s.disponivel && !s.vendida).length;
              const sold = senhasArray.filter(s => s.vendida).length;
              const totalPasswords = senhasArray.length;

              // Calcular receita deste plano
              const { data: vendasPlano } = await supabase
                .from('vendas')
                .select('preco')
                .eq('plano_id', plano.id)
                .eq('status', 'aprovado');

              const revenue = (vendasPlano || []).reduce((acc, venda) => acc + (Number(venda.preco || 0)), 0);

              planosWithSenhas.push({
                ...plano,
                senhas: senhasArray,
                available,
                sold,
                totalPasswords,
                revenue
              });
            }

            mikrotiksWithPlans.push({
              ...mikrotik,
              planos: planosWithSenhas
            });
          }

          setUserMikrotiks(mikrotiksWithPlans);
        }

        // Calcular estatísticas do dashboard
        await calculateDashboardStats(cliente.id);

        // Buscar vendas do cliente (histórico) com informações do MAC
        const mikrotikIds = (mikrotiks as Mikrotik[])?.map(m => m.id) || [];
        
        if (mikrotikIds.length > 0) {
          const { data: vendas, error: vendasError } = await supabase
            .from('vendas')
            .select(`
              *,
              planos!inner(nome),
              mikrotiks!inner(nome, profitpercentage),
              macs(mac_address)
            `)
            .in('mikrotik_id', mikrotikIds)
            .eq('status', 'aprovado')
            .order('data', { ascending: false })
            .limit(20);

          if (vendasError) {
            console.error('Erro ao buscar vendas:', vendasError);
            setSalesHistory([]);
          } else {
            setSalesHistory((vendas as Venda[]) || []);
          }
        } else {
          setSalesHistory([]);
        }

      } catch (error) {
        console.error('Erro geral:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  }, []);

  // Função para calcular estatísticas do dashboard
  const calculateDashboardStats = async (clienteId: string) => {
    try {
      // Buscar mikrotiks do cliente
      const { data: mikrotiks } = await supabase
        .from('mikrotiks')
        .select('id')
        .eq('cliente_id', clienteId);

      if (!mikrotiks || mikrotiks.length === 0) {
        return;
      }

      const mikrotikIds = mikrotiks.map(m => m.id);

      // 1. Total de senhas disponíveis
      const { data: senhasDisponiveis } = await supabase
        .from('senhas')
        .select(`
          id,
          planos!inner(mikrotik_id)
        `)
        .eq('disponivel', true)
        .eq('vendida', false)
        .in('planos.mikrotik_id', mikrotikIds);

      const totalSenhasDisponiveis = senhasDisponiveis?.length || 0;

      // 2. Vendas do mês atual - buscar por mikrotik_id
      const hoje = new Date();
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

      const { data: vendasMes } = await supabase
        .from('vendas')
        .select('id')
        .in('mikrotik_id', mikrotikIds)
        .eq('status', 'aprovado')
        .gte('data', inicioMes.toISOString())
        .lte('data', fimMes.toISOString());

      const vendasMesAtual = vendasMes?.length || 0;

      // 3. Receita do dia atual - buscar por mikrotik_id
      const inicioDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
      const fimDia = new Date(inicioDia.getTime() + 24 * 60 * 60 * 1000 - 1);

      const { data: vendasDia } = await supabase
        .from('vendas')
        .select('preco')
        .in('mikrotik_id', mikrotikIds)
        .eq('status', 'aprovado')
        .gte('data', inicioDia.toISOString())
        .lte('data', fimDia.toISOString());

      const receitaDiaAtual = (vendasDia || []).reduce((acc, venda) => acc + (Number(venda.preco || 0)), 0);

      // 4. Total de receita geral - buscar por mikrotik_id
      const { data: todasVendas } = await supabase
        .from('vendas')
        .select('preco')
        .in('mikrotik_id', mikrotikIds)
        .eq('status', 'aprovado');

      const totalReceita = (todasVendas || []).reduce((acc, venda) => acc + (Number(venda.preco || 0)), 0);

      setDashboardStats({
        totalSenhasDisponiveis,
        vendasMesAtual,
        receitaDiaAtual,
        totalReceita
      });

    } catch (error) {
      console.error('Erro ao calcular estatísticas:', error);
    }
  };

  // Calcular totais para os mikrotiks
  const totalPasswords = userMikrotiks.reduce((acc, mikrotik) => {
    if (!mikrotik.planos || !Array.isArray(mikrotik.planos)) return acc;
    return acc + mikrotik.planos.reduce((planAcc, plan) => planAcc + (plan.totalPasswords || 0), 0);
  }, 0);
  
  const totalAvailable = userMikrotiks.reduce((acc, mikrotik) => {
    if (!mikrotik.planos || !Array.isArray(mikrotik.planos)) return acc;
    return acc + mikrotik.planos.reduce((planAcc, plan) => planAcc + (plan.available || 0), 0);
  }, 0);
  
  const totalSold = userMikrotiks.reduce((acc, mikrotik) => {
    if (!mikrotik.planos || !Array.isArray(mikrotik.planos)) return acc;
    return acc + mikrotik.planos.reduce((planAcc, plan) => planAcc + (plan.sold || 0), 0);
  }, 0);

  const monthlyStats = [
    { month: 'Jan', sales: 28, revenue: 420.50 },
    { month: 'Dez', sales: 35, revenue: 525.75 },
    { month: 'Nov', sales: 22, revenue: 330.25 },
    { month: 'Out', sales: 31, revenue: 465.30 }
  ];

  if (loading) {
    return (
      <div className="p-4 lg:p-6 space-y-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center min-h-96">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-lg text-gray-600">Carregando dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!clientData) {
    return (
      <div className="p-4 lg:p-6 space-y-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="text-red-500 text-lg font-semibold mb-2">Erro ao carregar dados</div>
            <p className="text-gray-600">Não foi possível carregar os dados do cliente.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Dashboard do Cliente</h1>
          <p className="text-gray-600 mt-1">Bem-vindo, {clientData.nome}</p>
        </div>
        <div className="flex items-center gap-4 mt-4 lg:mt-0">
          <button 
            onClick={() => window.location.reload()}
            className="btn-primary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
          <div className="flex items-center bg-white px-3 py-2 rounded-lg shadow-sm border border-gray-200">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            <span className="text-gray-600 text-sm font-medium">Online</span>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Wallet className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-green-600 text-xs font-semibold">Disponível</span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">R$ {Number(clientData.saldo || 0).toFixed(2)}</h3>
          <p className="text-gray-600 text-sm">Saldo Atual</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-blue-600 text-xs font-semibold">Este Mês</span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">{dashboardStats.vendasMesAtual}</h3>
          <p className="text-gray-600 text-sm">Vendas do Mês</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-purple-600 text-xs font-semibold">Hoje</span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">R$ {dashboardStats.receitaDiaAtual.toFixed(2)}</h3>
          <p className="text-gray-600 text-sm">Receita do Dia</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <Key className="w-4 h-4 text-orange-600" />
            </div>
            <span className="text-orange-600 text-xs font-semibold">Ativas</span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">{dashboardStats.totalSenhasDisponiveis}</h3>
          <p className="text-gray-600 text-sm">Senhas Disponíveis</p>
        </div>
      </div>

      {/* Meus Mikrotiks */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Radio className="w-5 h-5 text-blue-600" />
          Meus Mikrotiks
        </h2>
        
        <div className="space-y-6">
          {userMikrotiks.length === 0 ? (
            <div className="text-center py-8">
              <Radio className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum Mikrotik encontrado</p>
            </div>
          ) : (
            userMikrotiks.map((mikrotik) => (
              <div key={mikrotik.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <Radio className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{mikrotik.nome}</h3>
                      <p className="text-sm text-gray-500">{mikrotik.provider_name || 'N/A'}</p>
                    </div>
                  </div>
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    {mikrotik.status || 'Ativo'}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {(!mikrotik.planos || mikrotik.planos.length === 0) ? (
                    <div className="col-span-full text-center py-4 text-gray-500">
                      Nenhum plano encontrado
                    </div>
                  ) : (
                    mikrotik.planos.map((plan, index) => (
                      <div key={plan.id || index} className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium text-gray-900 text-sm">{plan.nome}</h4>
                          <span className="text-sm font-bold text-green-600">R$ {Number(plan.preco || 0).toFixed(2)}</span>
                        </div>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Disponíveis:</span>
                            <span className="font-semibold text-green-600">{plan.available || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Vendidas:</span>
                            <span className="font-semibold text-blue-600">{plan.sold || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total:</span>
                            <span className="font-bold text-gray-900">{plan.totalPasswords || 0}</span>
                          </div>
                          <div className="flex justify-between border-t border-gray-200 pt-1">
                            <span className="text-gray-600">Receita:</span>
                            <span className="font-semibold text-purple-600">R$ {(plan.revenue || 0).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Sales History */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                Histórico de Vendas
              </h2>
              <button className="btn-primary text-sm flex items-center gap-2">
                <Download className="w-4 h-4" />
                Exportar
              </button>
            </div>
            
            <div className="space-y-3">
              {salesHistory.length === 0 ? (
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhuma venda encontrada</p>
                </div>
              ) : (
                salesHistory.map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                        <DollarSign className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">
                          {sale.planos?.nome || 'Plano N/A'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {sale.mikrotiks?.nome || 'Mikrotik N/A'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(sale.data).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900 text-sm">R$ {Number(sale.preco || 0).toFixed(2)}</p>
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {sale.status === 'aprovado' ? 'Concluída' : sale.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
            <div className="space-y-3">
              <button className="w-full btn-primary flex items-center justify-center gap-2 text-sm">
                <Wallet className="w-4 h-4" />
                Solicitar Saque
              </button>
              <button className="w-full btn-secondary flex items-center justify-center gap-2 text-sm">
                <Download className="w-4 h-4" />
                Baixar Relatório
              </button>
              <button className="w-full btn-secondary flex items-center justify-center gap-2 text-sm">
                <Calendar className="w-4 h-4" />
                Ver Histórico Completo
              </button>
            </div>
          </div>

          {/* Monthly Performance */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Performance Mensal
            </h3>
            <div className="space-y-3">
              {monthlyStats.map((stat, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600 font-medium text-sm">{stat.month}</span>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 text-sm">{stat.sales} vendas</p>
                    <p className="text-green-600 text-xs">R$ {stat.revenue.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Password Summary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo Geral</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Senhas Disponíveis</span>
                <span className="font-bold text-green-600">{dashboardStats.totalSenhasDisponiveis}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Vendas do Mês</span>
                <span className="font-bold text-blue-600">{dashboardStats.vendasMesAtual}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Receita do Dia</span>
                <span className="font-bold text-purple-600">R$ {dashboardStats.receitaDiaAtual.toFixed(2)}</span>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Receita Total</span>
                  <span className="font-bold text-green-600">R$ {dashboardStats.totalReceita.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
