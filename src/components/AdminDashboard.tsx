// Conteúdo removido para reconstrução do componente.
import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Router, 
  Key, 
  Monitor, 
  CreditCard, 
  BarChart3, 
  LogOut,
  Menu,
  X,
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Wifi,
  UserCheck,
  RefreshCw,
  AlertCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { usePendingWithdrawals } from '../hooks/usePendingWithdrawals';
import UsersManagement from './UsersManagement';
import MikrotiksManagement from './MikrotiksManagement';
import PasswordsManagement from './PasswordsManagement';
import MacsManagement from './MacsManagement';
import WithdrawalsManagement from './WithdrawalsManagement';
import ReportsManagement from './ReportsManagement';

interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  name?: string;
}

interface AdminDashboardProps {
  user: User;
  onLogout: () => Promise<void>;
}

interface DashboardStats {
  totalClientes: number;
  totalVendas: number;
  mikrotiksAtivos: number;
  totalMacs: number;
  macsConectados: number;
  // Lucro do admin por período
  lucroHoje: number;
  lucroSemana: number;
  lucroMes: number;
  // Receita total por período
  receitaHoje: number;
  receitaSemana: number;
  receitaMes: number;
}

// Dashboard principal
function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalClientes: 0,
    totalVendas: 0,
    mikrotiksAtivos: 0,
    totalMacs: 0,
    macsConectados: 0,
    lucroHoje: 0,
    lucroSemana: 0,
    lucroMes: 0,
    receitaHoje: 0,
    receitaSemana: 0,
    receitaMes: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentSales, setRecentSales] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Datas para cálculos
      const agora = new Date();
      const inicioHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
      
      // Corrigir início da semana para segunda-feira
      const inicioSemana = new Date(agora);
      const diaDaSemana = agora.getDay(); // 0 = domingo, 1 = segunda, etc.
      const diasParaSegunda = diaDaSemana === 0 ? 6 : diaDaSemana - 1; // Se domingo, volta 6 dias; senão volta (dia - 1)
      inicioSemana.setDate(agora.getDate() - diasParaSegunda);
      inicioSemana.setHours(0, 0, 0, 0);
      
      const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);

      console.log('Datas de cálculo:', {
        hoje: inicioHoje.toISOString(),
        semana: inicioSemana.toISOString(),
        mes: inicioMes.toISOString()
      });

      // Carregar estatísticas gerais
      const [
        clientesRes,
        mikrotiksRes,
        vendasTodasRes,
        vendasHojeRes,
        vendasSemanaRes,
        vendasMesRes,
        recentSalesRes
      ] = await Promise.all([
        supabase.from('clientes').select('id'),
        supabase.from('mikrotiks').select('id').eq('status', 'Ativo'),
        supabase.from('vendas').select('preco, lucro, status'),
        supabase.from('vendas').select('preco, lucro').eq('status', 'aprovado').gte('data', inicioHoje.toISOString()),
        supabase.from('vendas').select('preco, lucro').eq('status', 'aprovado').gte('data', inicioSemana.toISOString()),
        supabase.from('vendas').select('preco, lucro').eq('status', 'aprovado').gte('data', inicioMes.toISOString()),
        supabase.from('vendas')
          .select('preco, data, status, mikrotiks(nome), planos(nome)')
          .order('data', { ascending: false })
          .limit(5)
      ]);

      // Buscar dados detalhados dos MACs apenas dos MikroTiks ativos
      const mikrotiksAtivos = mikrotiksRes.data || [];
      const mikrotiksIds = mikrotiksAtivos.map(m => m.id);
      
      let totalMacs = 0;
      let macsConectados = 0;
      
      if (mikrotiksIds.length > 0) {
        const macsRes = await supabase
          .from('macs')
          .select('id, status, mikrotik_id')
          .in('mikrotik_id', mikrotiksIds);
        
        const macsData = macsRes.data || [];
        totalMacs = macsData.length;
        macsConectados = macsData.filter(mac => mac.status === 'conectado').length;
      }

      // Calcular estatísticas por período
      const vendasTodas = vendasTodasRes.data || [];
      const vendasHoje = vendasHojeRes.data || [];
      const vendasSemana = vendasSemanaRes.data || [];
      const vendasMes = vendasMesRes.data || [];

      console.log('Vendas encontradas:', {
        todas: vendasTodas.length,
        hoje: vendasHoje.length,
        semana: vendasSemana.length,
        mes: vendasMes.length
      });

      // Calcular lucro (parte do admin) e receita por período
      const lucroHoje = vendasHoje.reduce((sum, v) => sum + (Number(v.lucro) || 0), 0);
      const lucroSemana = vendasSemana.reduce((sum, v) => sum + (Number(v.lucro) || 0), 0);
      const lucroMes = vendasMes.reduce((sum, v) => sum + (Number(v.lucro) || 0), 0);

      const receitaHoje = vendasHoje.reduce((sum, v) => sum + (Number(v.preco) || 0), 0);
      const receitaSemana = vendasSemana.reduce((sum, v) => sum + (Number(v.preco) || 0), 0);
      const receitaMes = vendasMes.reduce((sum, v) => sum + (Number(v.preco) || 0), 0);

      setStats({
        totalClientes: clientesRes.data?.length || 0,
        totalVendas: vendasTodas.length,
        mikrotiksAtivos: mikrotiksAtivos.length,
        totalMacs: totalMacs,
        macsConectados: macsConectados,
        lucroHoje: lucroHoje,
        lucroSemana: lucroSemana,
        lucroMes: lucroMes,
        receitaHoje: receitaHoje,
        receitaSemana: receitaSemana,
        receitaMes: receitaMes,
      });

      setRecentSales(recentSalesRes.data || []);

    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-32"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-64"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <button
          onClick={loadDashboardData}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </button>
      </div>

      {/* Cards de estatísticas - Primeira linha */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Meu Lucro Hoje</p>
              <p className="text-2xl font-bold text-green-600">
                R$ {stats.lucroHoje.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Comissão do dia
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Meu Lucro da Semana</p>
              <p className="text-2xl font-bold text-blue-600">
                R$ {stats.lucroSemana.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Últimos 7 dias
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Meu Lucro do Mês</p>
              <p className="text-2xl font-bold text-purple-600">
                R$ {stats.lucroMes.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date().toLocaleDateString('pt-BR', { month: 'long' })}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Cards de estatísticas - Segunda linha */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Receita Total Hoje</p>
              <p className="text-2xl font-bold text-emerald-600">
                R$ {stats.receitaHoje.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Vendas de hoje
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Receita Total da Semana</p>
              <p className="text-2xl font-bold text-cyan-600">
                R$ {stats.receitaSemana.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Últimos 7 dias
              </p>
            </div>
            <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-cyan-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Receita Total do Mês</p>
              <p className="text-2xl font-bold text-indigo-600">
                R$ {stats.receitaMes.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date().toLocaleDateString('pt-BR', { month: 'long' })}
              </p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Card único para MACs conectados */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">MACs Conectados</p>
              <p className="text-2xl font-bold text-orange-600">
                {stats.macsConectados}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                de {stats.totalMacs} total ({stats.totalMacs > 0 ? ((stats.macsConectados / stats.totalMacs) * 100).toFixed(1) : 0}%)
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Wifi className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Vendas</p>
              <p className="text-2xl font-bold text-blue-600">{stats.totalVendas}</p>
              <p className="text-xs text-gray-500 mt-1">
                Vendas aprovadas
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">MikroTiks Ativos</p>
              <p className="text-2xl font-bold text-slate-600">{stats.mikrotiksAtivos}</p>
              <p className="text-xs text-gray-500 mt-1">
                Equipamentos online
              </p>
            </div>
            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
              <Router className="w-6 h-6 text-slate-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Vendas recentes e métricas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vendas recentes */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Vendas Recentes</h3>
          <div className="space-y-3">
            {recentSales.length > 0 ? (
              recentSales.map((sale, index) => {
                const status = (sale as any).status;
                const getStatusConfig = (status: string) => {
                  switch (status) {
                    case 'aprovado':
                      return {
                        bgClass: 'bg-green-50 border border-green-200',
                        iconBg: 'bg-green-100',
                        icon: <Wifi className="w-4 h-4 text-green-600" />,
                        textColor: 'text-green-600',
                        statusText: 'Aprovado'
                      };
                    case 'pendente':
                      return {
                        bgClass: 'bg-yellow-50 border border-yellow-200',
                        iconBg: 'bg-yellow-100',
                        icon: <Clock className="w-4 h-4 text-yellow-600 animate-pulse" />,
                        textColor: 'text-yellow-600',
                        statusText: 'Aguardando Pagamento'
                      };
                    case 'processando':
                      return {
                        bgClass: 'bg-blue-50 border border-blue-200',
                        iconBg: 'bg-blue-100',
                        icon: <Clock className="w-4 h-4 text-blue-600 animate-pulse" />,
                        textColor: 'text-blue-600',
                        statusText: 'Processando'
                      };
                    case 'autorizado':
                      return {
                        bgClass: 'bg-indigo-50 border border-indigo-200',
                        iconBg: 'bg-indigo-100',
                        icon: <Wifi className="w-4 h-4 text-indigo-600" />,
                        textColor: 'text-indigo-600',
                        statusText: 'Autorizado'
                      };
                    case 'rejeitado':
                    case 'cancelado':
                    case 'expirado':
                      return {
                        bgClass: 'bg-red-50 border border-red-200',
                        iconBg: 'bg-red-100',
                        icon: <AlertTriangle className="w-4 h-4 text-red-600" />,
                        textColor: 'text-red-600',
                        statusText: status === 'rejeitado' ? 'Rejeitado' : 
                                   status === 'cancelado' ? 'Cancelado' : 'Expirado'
                      };
                    case 'reembolsado':
                      return {
                        bgClass: 'bg-orange-50 border border-orange-200',
                        iconBg: 'bg-orange-100',
                        icon: <AlertTriangle className="w-4 h-4 text-orange-600" />,
                        textColor: 'text-orange-600',
                        statusText: 'Reembolsado'
                      };
                    case 'chargeback':
                      return {
                        bgClass: 'bg-purple-50 border border-purple-200',
                        iconBg: 'bg-purple-100',
                        icon: <AlertTriangle className="w-4 h-4 text-purple-600" />,
                        textColor: 'text-purple-600',
                        statusText: 'Chargeback'
                      };
                    default:
                      return {
                        bgClass: 'bg-gray-50 border border-gray-200',
                        iconBg: 'bg-gray-100',
                        icon: <AlertTriangle className="w-4 h-4 text-gray-600" />,
                        textColor: 'text-gray-600',
                        statusText: status || 'Desconhecido'
                      };
                  }
                };

                const statusConfig = getStatusConfig(status);
                
                return (
                  <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${statusConfig.bgClass}`}>
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${statusConfig.iconBg}`}>
                        {statusConfig.icon}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {(sale as any).mikrotiks?.nome || 'MikroTik'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {(sale as any).planos?.nome || 'Plano'} - {new Date(sale.data).toLocaleDateString('pt-BR')}
                        </p>
                        <p className={`text-xs font-medium ${statusConfig.textColor}`}>
                          {statusConfig.statusText}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${statusConfig.textColor}`}>
                        R$ {Number(sale.preco).toFixed(2)}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Nenhuma venda recente</p>
              </div>
            )}
          </div>
        </div>

        {/* Métricas detalhadas */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Métricas Financeiras</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-green-600" />
                </div>
                <span className="font-medium text-gray-700">Receita Total</span>
              </div>
              <span className="font-bold text-green-600 text-lg">
                R$ {stats.receitaMes.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-100">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                </div>
                <span className="font-medium text-gray-700">Lucro Total</span>
              </div>
              <span className="font-bold text-blue-600 text-lg">
                R$ {stats.lucroMes.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg border border-purple-100">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Activity className="w-4 h-4 text-purple-600" />
                </div>
                <span className="font-medium text-gray-700">Margem de Lucro</span>
              </div>
              <span className="font-bold text-purple-600 text-lg">
                {stats.receitaMes > 0 ? ((stats.lucroMes / stats.receitaMes) * 100).toFixed(1) : 0}%
              </span>
            </div>

            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-100">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4 text-orange-600" />
                </div>
                <span className="font-medium text-gray-700">Total Clientes</span>
              </div>
              <span className="font-bold text-orange-600 text-lg">
                {stats.totalClientes}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Status do sistema */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Status do Sistema</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <div>
              <p className="font-medium text-gray-700">MikroTiks</p>
              <p className="text-sm text-gray-500">{stats.mikrotiksAtivos} ativos</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <div>
              <p className="font-medium text-gray-700">Dispositivos</p>
              <p className="text-sm text-gray-500">{stats.macsConectados} conectados</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
            <div className="w-3 h-3 bg-slate-500 rounded-full"></div>
            <div>
              <p className="font-medium text-gray-700">Total Clientes</p>
              <p className="text-sm text-gray-500">{stats.totalClientes} clientes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente simples para outras páginas
function SimplePage({ title }: { title: string }) {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">{title}</h1>
      <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <BarChart3 className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-600 text-lg font-medium mb-2">Esta página está sendo desenvolvida</p>
        <p className="text-gray-500">Em breve teremos mais funcionalidades!</p>
      </div>
    </div>
  );
}

export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { pendingCount } = usePendingWithdrawals();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Usuários', href: '/users', icon: Users },
    { name: 'MikroTiks', href: '/mikrotiks', icon: Router },
    { name: 'Senhas', href: '/passwords', icon: Key },
    { name: 'MACs', href: '/macs', icon: Monitor },
    { 
      name: 'Saques', 
      href: '/withdrawals', 
      icon: CreditCard,
      badge: pendingCount > 0 ? pendingCount : undefined
    },
    { name: 'Relatórios', href: '/reports', icon: BarChart3 },
  ];

  const isActivePath = (href: string) => {
    return location.pathname === href;
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 to-blue-700">
            <div>
              <h2 className="text-xl font-bold text-white">{import.meta.env.VITE_APP_NAME || 'Pix Mikro'}</h2>
              <p className="text-blue-100 text-sm">{import.meta.env.VITE_APP_DESCRIPTION || 'Sistema de Vendas WiFi'}</p>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-md text-blue-100 hover:text-white hover:bg-blue-500/20"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User info */}
          <div className="p-4 border-b bg-gradient-to-r from-gray-50 to-blue-50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{user.name || user.email}</p>
                <p className="text-sm text-blue-600 font-medium capitalize">{user.role}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isActivePath(item.href)
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center">
                  <item.icon className={`w-5 h-5 mr-3 ${isActivePath(item.href) ? 'text-blue-600' : ''}`} />
                  {item.name}
                </div>
                {item.badge && (
                  <div className="flex items-center">
                    <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
                      {item.badge}
                    </span>
                    <AlertCircle className="w-3 h-3 text-red-500 ml-1" />
                  </div>
                )}
              </Link>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t">
            <button
              onClick={onLogout}
              className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sair
            </button>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex h-16 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6">
          <button
            type="button"
            className="lg:hidden p-2.5 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" />
              <span className="text-sm text-gray-500">
                Bem-vindo, {user.name || user.email}
              </span>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/users" element={<UsersManagement />} />
            <Route path="/mikrotiks" element={<MikrotiksManagement currentUser={user} />} />
            <Route path="/passwords" element={<PasswordsManagement />} />
            <Route path="/macs" element={<MacsManagement />} />
            <Route path="/withdrawals" element={<WithdrawalsManagement />} />
            <Route path="/reports" element={<ReportsManagement />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
