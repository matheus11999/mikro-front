import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Router, 
  Key, 
  Wifi, 
  DollarSign, 
  TrendingUp, 
  Activity, 
  ShoppingCart,
  Crown,
  Sparkles,
  Zap,
  Eye,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Award,
  Target,
  Wallet
} from 'lucide-react';
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

      const totalReceita = vendas?.reduce((sum, v) => sum + (v.preco || 0), 0) || 0;
      const totalLucro = vendas?.reduce((sum, v) => sum + (v.lucro || 0), 0) || 0;
      const totalSaques = withdrawals?.length || 0;

      setStats([
        {
          title: 'Total de Usuários',
          value: users?.filter(u => u.role !== 'admin').length || 0,
          change: '+12.5%',
          trend: 'up',
          icon: Users,
          gradient: 'from-blue-500 to-cyan-500',
          bgGradient: 'from-blue-500/10 to-cyan-500/10',
          iconBg: 'from-blue-400 to-cyan-500',
        },
        {
          title: 'Mikrotiks Ativos',
          value: mikrotiks?.length || 0,
          change: '+8.1%',
          trend: 'up',
          icon: Router,
          gradient: 'from-green-500 to-emerald-500',
          bgGradient: 'from-green-500/10 to-emerald-500/10',
          iconBg: 'from-green-400 to-emerald-500',
        },
        {
          title: 'Senhas Vendidas',
          value: senhas?.filter(s => s.vendida).length || 0,
          change: '+24.3%',
          trend: 'up',
          icon: Key,
          gradient: 'from-purple-500 to-pink-500',
          bgGradient: 'from-purple-500/10 to-pink-500/10',
          iconBg: 'from-purple-400 to-pink-500',
        },
        {
          title: 'MACs Coletados',
          value: macs?.length || 0,
          change: '+15.7%',
          trend: 'up',
          icon: Wifi,
          gradient: 'from-orange-500 to-amber-500',
          bgGradient: 'from-orange-500/10 to-amber-500/10',
          iconBg: 'from-orange-400 to-amber-500',
        },
        {
          title: 'Receita Total',
          value: `R$ ${totalReceita.toFixed(2)}`,
          change: '+32.1%',
          trend: 'up',
          icon: DollarSign,
          gradient: 'from-emerald-500 to-teal-500',
          bgGradient: 'from-emerald-500/10 to-teal-500/10',
          iconBg: 'from-emerald-400 to-teal-500',
        },
        {
          title: 'Lucro Admin',
          value: `R$ ${totalLucro.toFixed(2)}`,
          change: '+18.9%',
          trend: 'up',
          icon: TrendingUp,
          gradient: 'from-indigo-500 to-purple-500',
          bgGradient: 'from-indigo-500/10 to-purple-500/10',
          iconBg: 'from-indigo-400 to-purple-500',
        },
        {
          title: 'Saques Pendentes',
          value: totalSaques,
          change: totalSaques > 0 ? '-5.2%' : '0%',
          trend: totalSaques > 0 ? 'down' : 'neutral',
          icon: Wallet,
          gradient: 'from-yellow-500 to-orange-500',
          bgGradient: 'from-yellow-500/10 to-orange-500/10',
          iconBg: 'from-yellow-400 to-orange-500',
        },
      ]);

      setRecentSales(vendas?.slice(0, 8).map((venda) => ({
        id: venda.id,
        mikrotik: venda.mikrotik_id || 'N/A',
        plan: venda.plano_id || 'N/A',
        value: venda.preco || 0,
        time: new Date(venda.data).toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        date: new Date(venda.data).toLocaleDateString('pt-BR'),
        saldo_admin: venda.lucro || 0,
        saldo_cliente: venda.valor || 0,
      })) || []);

      setTopMikrotiks(mikrotiks?.map((mikrotik) => ({
        name: mikrotik.nome,
        sales: vendas?.filter((venda) => venda.mikrotik_id === mikrotik.id).length || 0,
        revenue: vendas?.filter((venda) => venda.mikrotik_id === mikrotik.id).reduce((sum, venda) => sum + (venda.preco || 0), 0) || 0,
      })).sort((a, b) => b.sales - a.sales).slice(0, 5) || []);

      // Top usuários por saldo (excluindo admins)
      setTopUsers(users?.filter(u => u.role !== 'admin')
        .sort((a, b) => (b.saldo || 0) - (a.saldo || 0))
        .slice(0, 6)
        .map((user, index) => ({
          name: user.nome || 'N/A',
          email: user.email,
          saldo: user.saldo || 0,
          position: index + 1,
          avatar: user.nome ? user.nome.charAt(0).toUpperCase() : 'U'
        })) || []);

      setLoading(false);
    }

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-purple-200 border-b-purple-600 rounded-full animate-spin mx-auto opacity-60" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
          </div>
          <h3 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Carregando Dashboard
          </h3>
          <p className="text-slate-600 mt-2">Preparando dados em tempo real...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-cyan-300/10 to-blue-300/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="relative z-10 p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Dashboard Administrativo
                </h1>
                <p className="text-slate-600 font-medium">Visão geral completa e em tempo real do sistema</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="px-4 py-2 bg-white/70 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg flex items-center gap-2">
              <div className="relative">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20"></div>
              </div>
              <span className="text-green-700 font-semibold text-sm">Sistema Online</span>
            </div>
            <div className="px-4 py-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm rounded-xl border border-blue-200/50 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <span className="text-blue-700 font-semibold text-sm">Tempo Real</span>
            </div>
            <div className="px-4 py-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-xl border border-purple-200/50 flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-600" />
              <span className="text-purple-700 font-semibold text-sm">
                {new Date().toLocaleTimeString('pt-BR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div 
              key={index} 
              className="group relative"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Glassmorphism Card */}
              <div className="relative bg-white/70 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 overflow-hidden">
                {/* Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                
                {/* Content */}
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-14 h-14 bg-gradient-to-br ${stat.iconBg} rounded-2xl flex items-center justify-center shadow-lg transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                      <stat.icon className="w-7 h-7 text-white drop-shadow-sm" />
                    </div>
                    {stat.change && (
                      <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold ${
                        stat.trend === 'up' ? 'bg-green-100 text-green-700' : 
                        stat.trend === 'down' ? 'bg-red-100 text-red-700' : 
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {stat.trend === 'up' && <ArrowUpRight className="w-4 h-4" />}
                        {stat.trend === 'down' && <ArrowDownRight className="w-4 h-4" />}
                        {stat.change}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-slate-800 group-hover:text-slate-900 transition-colors">
                      {stat.value}
                    </h3>
                    <p className="text-slate-600 font-medium text-sm group-hover:text-slate-700 transition-colors">
                      {stat.title}
                    </p>
                  </div>
                </div>

                {/* Hover Glow Effect */}
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-3xl`}></div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts and Tables */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Recent Sales */}
          <div className="xl:col-span-1">
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl overflow-hidden">
              <div className="p-6 border-b border-white/10 bg-gradient-to-r from-blue-500/5 to-purple-500/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                      <ShoppingCart className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">Vendas Recentes</h3>
                      <p className="text-sm text-slate-600">Últimas transações</p>
                    </div>
                  </div>
                  <Eye className="w-5 h-5 text-slate-400" />
                </div>
              </div>
              
              <div className="p-6 max-h-96 overflow-y-auto">
                <div className="space-y-3">
                  {recentSales.map((sale, index) => (
                    <div 
                      key={sale.id} 
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-blue-50/50 rounded-xl hover:from-blue-50 hover:to-purple-50 transition-all duration-300 transform hover:scale-102 border border-slate-100/50"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center shadow-md">
                          <Router className="w-5 h-5 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-800 truncate">{sale.mikrotik}</p>
                          <p className="text-xs text-slate-500 truncate">{sale.plan}</p>
                          <p className="text-xs text-slate-400">{sale.date} • {sale.time}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <p className="text-sm font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                          R$ {sale.value.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {recentSales.length === 0 && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <ShoppingCart className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-slate-500 font-medium">Nenhuma venda registrada</p>
                      <p className="text-slate-400 text-sm mt-1">As vendas aparecerão aqui</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Top Mikrotiks */}
          <div className="xl:col-span-1">
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl overflow-hidden">
              <div className="p-6 border-b border-white/10 bg-gradient-to-r from-green-500/5 to-emerald-500/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Award className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">Top Mikrotiks</h3>
                      <p className="text-sm text-slate-600">Melhor performance</p>
                    </div>
                  </div>
                  <Target className="w-5 h-5 text-slate-400" />
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-3">
                  {topMikrotiks.map((mikrotik, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-green-50/50 rounded-xl hover:from-green-50 hover:to-emerald-50 transition-all duration-300 transform hover:scale-102 border border-slate-100/50"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${
                          index === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                          index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                          index === 2 ? 'bg-gradient-to-br from-orange-400 to-red-500' :
                          'bg-gradient-to-br from-green-400 to-emerald-500'
                        }`}>
                          <span className="text-sm font-bold text-white">#{index + 1}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-800 truncate">{mikrotik.name}</p>
                          <p className="text-xs text-slate-500">{mikrotik.sales} vendas</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <p className="text-sm font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                          R$ {mikrotik.revenue.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {topMikrotiks.length === 0 && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Router className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-slate-500 font-medium">Nenhum mikrotik cadastrado</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Top Users */}
          <div className="xl:col-span-1">
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl overflow-hidden">
              <div className="p-6 border-b border-white/10 bg-gradient-to-r from-purple-500/5 to-pink-500/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">Top Usuários</h3>
                      <p className="text-sm text-slate-600">Maiores saldos</p>
                    </div>
                  </div>
                  <Sparkles className="w-5 h-5 text-slate-400" />
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-3">
                  {topUsers.map((user, index) => (
                    <div 
                      key={user.email} 
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-purple-50/50 rounded-xl hover:from-purple-50 hover:to-pink-50 transition-all duration-300 transform hover:scale-102 border border-slate-100/50"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md font-bold text-white text-sm ${
                          index === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                          index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                          index === 2 ? 'bg-gradient-to-br from-orange-400 to-red-500' :
                          'bg-gradient-to-br from-purple-400 to-pink-500'
                        }`}>
                          {user.avatar}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-800 truncate">{user.name}</p>
                          <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <p className="text-sm font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                          R$ {user.saldo.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {topUsers.length === 0 && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-slate-500 font-medium">Nenhum usuário cadastrado</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
