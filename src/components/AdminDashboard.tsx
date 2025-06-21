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

  return (
    <div className="p-4 lg:p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Visão geral do sistema</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
            <Activity className="w-4 h-4 mr-2" />
            Sistema Online
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color.replace('bg-', 'text-')}`} />
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                stat.change.startsWith('+') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {stat.change}
              </span>
            </div>
            <div className="mt-3">
              <p className="text-lg lg:text-xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-600">{stat.title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Sales */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <ShoppingCart className="w-5 h-5 mr-2 text-blue-600" />
              Vendas Recentes
            </h3>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <Router className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{sale.mikrotik}</p>
                      <p className="text-xs text-gray-500">{sale.plan}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600">{sale.value}</p>
                    <p className="text-xs text-gray-500">{sale.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Mikrotiks */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
              Top Mikrotiks
            </h3>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {topMikrotiks.map((mikrotik, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-white text-xs font-bold">{index + 1}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{mikrotik.name}</p>
                      <p className="text-xs text-gray-500">{mikrotik.sales} vendas</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600">{mikrotik.revenue}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Users by Balance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Users className="w-5 h-5 mr-2 text-purple-600" />
              Top Usuários por Saldo
            </h3>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {topUsers.map((user) => (
                <div key={user.email} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${
                      user.position === 1 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                      user.position === 2 ? 'bg-gradient-to-r from-gray-300 to-gray-500' :
                      user.position === 3 ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                      'bg-gradient-to-r from-blue-400 to-blue-600'
                    }`}>
                      <span className="text-white text-xs font-bold">{user.position}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600">R$ {user.saldo.toFixed(2)}</p>
                  </div>
                </div>
              ))}
              {topUsers.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">Nenhum usuário encontrado</p>
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
