import React, { useEffect, useState } from 'react';
import { Users, Router, Key, Wifi, DollarSign, TrendingUp, Activity, ShoppingCart } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const AdminDashboard = () => {
  const [stats, setStats] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [topMikrotiks, setTopMikrotiks] = useState([]);
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
        saldo_admin: venda.preco ? (venda.preco * 0.1).toFixed(2) : '0.00',
        saldo_cliente: venda.preco ? (venda.preco * 0.9).toFixed(2) : '0.00',
      })));

      setTopMikrotiks(mikrotiks.map((mikrotik) => ({
        name: mikrotik.nome,
        sales: vendas.filter((venda) => venda.mikrotik_id === mikrotik.id).length,
        revenue: `R$ ${vendas.filter((venda) => venda.mikrotik_id === mikrotik.id).reduce((sum, venda) => sum + (venda.preco || 0), 0).toFixed(2)}`,
      })).sort((a, b) => b.sales - a.sales).slice(0, 3));

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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
      </div>
    </div>
  );
};

export default AdminDashboard;
