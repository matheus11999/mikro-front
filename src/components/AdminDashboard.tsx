import React, { useEffect, useState } from 'react';
import { Users, Router, Key, Wifi, DollarSign, TrendingUp, Activity, ShoppingCart } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const AdminDashboard = () => {
  const [stats, setStats] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [topMikrotiks, setTopMikrotiks] = useState([]);
  const [topUsers, setTopUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      // Usuários
      const { data: users } = await supabase.from('clientes').select('*');
      // Mikrotiks
      const { data: mikrotiks } = await supabase.from('mikrotiks').select('*');
      // Senhas
      const { data: senhas } = await supabase.from('senhas').select('*');
      // MACs
      const { data: macs } = await supabase.from('macs').select('*');
      // Vendas
      const { data: vendas } = await supabase.from('vendas').select('*').order('data', { ascending: false });
      // Saques
      const { data: withdrawals } = await supabase.from('withdrawals').select('*');

      setStats([
        {
          title: 'Total de Usuários',
          value: users?.filter(u => u.role !== 'admin').length || 0,
          change: '',
          icon: Users,
          color: 'bg-blue-500',
          bgColor: 'bg-blue-50',
        },
        {
          title: 'Mikrotiks Ativos',
          value: mikrotiks?.length || 0,
          change: '',
          icon: Router,
          color: 'bg-green-500',
          bgColor: 'bg-green-50',
        },
        {
          title: 'Senhas Vendidas',
          value: senhas?.length || 0,
          change: '',
          icon: Key,
          color: 'bg-purple-500',
          bgColor: 'bg-purple-50',
        },
        {
          title: 'MACs Coletados',
          value: macs?.length || 0,
          change: '',
          icon: Wifi,
          color: 'bg-orange-500',
          bgColor: 'bg-orange-50',
        },
        {
          title: 'Receita Total',
          value: `R$ ${(vendas?.reduce((sum, v) => sum + (v.preco || 0), 0)).toFixed(2)}`,
          change: '',
          icon: DollarSign,
          color: 'bg-emerald-500',
          bgColor: 'bg-emerald-50',
        },
        {
          title: 'Lucro Admin',
          value: `R$ ${(vendas?.reduce((sum, v) => sum + (v.lucro || 0), 0)).toFixed(2)}`,
          change: '',
          icon: TrendingUp,
          color: 'bg-indigo-500',
          bgColor: 'bg-indigo-50',
        },
        {
          title: 'Saques Pendentes',
          value: withdrawals?.length || 0,
          change: '',
          icon: TrendingUp,
          color: 'bg-yellow-500',
          bgColor: 'bg-yellow-50',
        },
      ]);

      setRecentSales(vendas.map((venda) => ({
        id: venda.id,
        mikrotik: venda.mikrotik_id,
        plan: venda.plano_id,
        value: venda.preco,
        time: new Date(venda.data).toLocaleTimeString(),
        saldo_admin: venda.lucro || 0,
        saldo_cliente: venda.valor || 0,
      })));

      setTopMikrotiks(mikrotiks.map((mikrotik) => ({
        name: mikrotik.nome,
        sales: vendas.filter((venda) => venda.mikrotik_id === mikrotik.id).length,
        revenue: `R$ ${vendas.filter((venda) => venda.mikrotik_id === mikrotik.id).reduce((sum, venda) => sum + (venda.preco || 0), 0).toFixed(2)}`,
      })).sort((a, b) => b.sales - a.sales).slice(0, 3));

      // Top usuários por saldo (excluindo admins)
      setTopUsers(users?.filter(u => u.role !== 'admin')
        .sort((a, b) => (b.saldo || 0) - (a.saldo || 0))
        .slice(0, 5)
        .map((user, index) => ({
          name: user.nome,
          email: user.email,
          saldo: user.saldo || 0,
          position: index + 1
        })) || []);

      setLoading(false);
    }

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="loading-spinner h-12 w-12 mx-auto mb-4"></div>
            <p className="text-gray-600 responsive-text">Carregando dashboard...</p>
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
          <h1 className="responsive-title font-bold text-gray-900">Dashboard Administrativo</h1>
          <p className="text-gray-600 mt-1 responsive-text">Visão geral completa do sistema</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="badge-success flex items-center gap-2">
            <Activity className="w-4 h-4" />
            <span>Sistema Online</span>
          </div>
          <div className="badge-info">
            <span>Tempo real</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="responsive-stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stats-card-compact group hover-lift animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${stat.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <stat.icon className={`w-5 h-5 ${stat.color.replace('bg-', 'text-')}`} />
              </div>
              {stat.change && (
                <span className={`badge ${
                  stat.change.startsWith('+') ? 'badge-success' : 'badge-danger'
                }`}>
                  {stat.change}
                </span>
              )}
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                {stat.value}
              </p>
              <p className="text-sm text-gray-600 mt-1">{stat.title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Recent Sales */}
        <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-100">
          <div className="p-3 md:p-4 border-b border-gray-100">
            <h3 className="text-base md:text-lg font-semibold text-gray-900 flex items-center">
              <ShoppingCart className="w-4 h-4 md:w-5 md:h-5 mr-2 text-blue-600" />
              <span className="hidden sm:inline">Vendas Recentes</span>
              <span className="sm:hidden">Vendas</span>
            </h3>
          </div>
          <div className="p-3 md:p-4">
            <div className="space-y-2 md:space-y-3 max-h-96 overflow-y-auto">
              {recentSales.slice(0, 5).map((sale) => (
                <div key={sale.id} className="flex items-center justify-between p-2 md:p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center min-w-0 flex-1">
                    <div className="w-6 h-6 md:w-8 md:h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-2 md:mr-3 flex-shrink-0">
                      <Router className="w-3 h-3 md:w-4 md:h-4 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs md:text-sm font-medium text-gray-900 truncate">{sale.mikrotik}</p>
                      <p className="text-xs text-gray-500 truncate">{sale.plan}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-xs md:text-sm font-bold text-green-600">R$ {sale.value}</p>
                    <p className="text-xs text-gray-500">{sale.time}</p>
                  </div>
                </div>
              ))}
              {recentSales.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm">Nenhuma venda registrada</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top Mikrotiks */}
        <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-100">
          <div className="p-3 md:p-4 border-b border-gray-100">
            <h3 className="text-base md:text-lg font-semibold text-gray-900 flex items-center">
              <TrendingUp className="w-4 h-4 md:w-5 md:h-5 mr-2 text-green-600" />
              <span className="hidden sm:inline">Top Mikrotiks</span>
              <span className="sm:hidden">Mikrotiks</span>
            </h3>
          </div>
          <div className="p-3 md:p-4">
            <div className="space-y-2 md:space-y-3">
              {topMikrotiks.map((mikrotik, index) => (
                <div key={index} className="flex items-center justify-between p-2 md:p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center min-w-0 flex-1">
                    <div className="w-6 h-6 md:w-8 md:h-8 bg-green-100 rounded-lg flex items-center justify-center mr-2 md:mr-3 flex-shrink-0">
                      <span className="text-xs md:text-sm font-bold text-green-600">#{index + 1}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs md:text-sm font-medium text-gray-900 truncate">{mikrotik.name}</p>
                      <p className="text-xs text-gray-500">{mikrotik.sales} vendas</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-xs md:text-sm font-bold text-green-600">{mikrotik.revenue}</p>
                  </div>
                </div>
              ))}
              {topMikrotiks.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm">Nenhum mikrotik cadastrado</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top Users */}
        <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-gray-100">
          <div className="p-3 md:p-4 border-b border-gray-100">
            <h3 className="text-base md:text-lg font-semibold text-gray-900 flex items-center">
              <Users className="w-4 h-4 md:w-5 md:h-5 mr-2 text-purple-600" />
              <span className="hidden sm:inline">Top Usuários</span>
              <span className="sm:hidden">Usuários</span>
            </h3>
          </div>
          <div className="p-3 md:p-4">
            <div className="space-y-2 md:space-y-3">
              {topUsers.map((user) => (
                <div key={user.email} className="flex items-center justify-between p-2 md:p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center min-w-0 flex-1">
                    <div className="w-6 h-6 md:w-8 md:h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-2 md:mr-3 flex-shrink-0">
                      <span className="text-xs md:text-sm font-bold text-purple-600">#{user.position}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs md:text-sm font-medium text-gray-900 truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-xs md:text-sm font-bold text-green-600">R$ {user.saldo.toFixed(2)}</p>
                  </div>
                </div>
              ))}
              {topUsers.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm">Nenhum usuário cadastrado</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
