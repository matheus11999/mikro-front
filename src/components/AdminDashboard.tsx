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
  AlertTriangle,
  ShoppingCart
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { usePendingWithdrawals } from '../hooks/usePendingWithdrawals';
import { useMikrotikStatus } from '../hooks/useMikrotikStatus';
import { MikrotikStatusSummary } from './MikrotikStatusBadge';
import UsersManagement from './UsersManagement';
import MikrotiksManagement from './MikrotiksManagement';
import PasswordsManagement from './PasswordsManagement';
import MacsManagement from './MacsManagement';
import WithdrawalsManagement from './WithdrawalsManagement';
import ReportsManagement from './ReportsManagement';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

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
  mikrotiksOnline: number;
  mikrotiksTotal: number;
  macsOnline: number;
  macsTotal: number;
}

interface TopMikrotik {
  id: string;
  nome: string;
  total_vendas: number;
  total_valor: number;
}

interface TopUser {
  id: string;
  email: string;
  total_vendas: number;
  saldo: number;
}

interface DatabaseSale {
  id: string;
  mac_address: string;
  valor: number;
  created_at: string;
  planos: {
    nome: string;
  }[];
  mikrotiks: {
    nome: string;
  }[];
  status: string;
}

interface ProcessedSale {
  id: string;
  mac_address: string;
  valor: number;
  created_at: string;
  plano_nome: string;
  mikrotik_nome: string;
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
    mikrotiksOnline: 0,
    mikrotiksTotal: 0,
    macsOnline: 0,
    macsTotal: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentSales, setRecentSales] = useState<ProcessedSale[]>([]);
  const [topMikrotiks, setTopMikrotiks] = useState<TopMikrotik[]>([]);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const { mikrotiks: mikrotiksStatus, estatisticas: mikrotikStats, loading: mikrotikLoading } = useMikrotikStatus();

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Função para obter estatísticas de versões RouterOS
  const getVersionStats = () => {
    if (!mikrotiksStatus || mikrotiksStatus.length === 0) return [];
    
    const versions = mikrotiksStatus
      .filter(m => m.heartbeat_version)
      .map(m => m.heartbeat_version)
      .filter(Boolean);
    
    const versionCounts = versions.reduce((acc, version) => {
      acc[version!] = (acc[version!] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(versionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3); // Top 3 versões mais usadas
  };

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
          .select(`
            id,
            mac_address,
            valor,
            created_at,
            planos(nome),
            mikrotiks(nome),
            status
          `)
          .eq('status', 'aprovado')
          .order('created_at', { ascending: false })
          .limit(10)
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
        mikrotiksOnline: mikrotiksStatus?.filter(m => m.heartbeat_version).length || 0,
        mikrotiksTotal: mikrotiksStatus?.length || 0,
        macsOnline: macsConectados,
        macsTotal: totalMacs,
      });

      // Carregar vendas recentes
      const { data: recentSalesData } = await supabase
        .from('vendas')
        .select(`
          id,
          mac_address,
          valor,
          created_at,
          planos(nome),
          mikrotiks(nome),
          status
        `)
        .eq('status', 'aprovado')
        .order('created_at', { ascending: false })
        .limit(10);

      const recentSales = (recentSalesData as DatabaseSale[] || []).map(sale => ({
        id: sale.id,
        mac_address: sale.mac_address,
        valor: sale.valor,
        created_at: sale.created_at,
        plano_nome: sale.planos?.[0]?.nome || 'Plano não encontrado',
        mikrotik_nome: sale.mikrotiks?.[0]?.nome || 'MikroTik não encontrado'
      }));

      setRecentSales(recentSales);

      // Carregar top MikroTiks
      const { data: topMikrotiksData } = await supabase
        .from('mikrotiks')
        .select('id, nome, total_vendas, total_valor')
        .order('total_valor', { ascending: false })
        .limit(5);

      // Carregar top usuários
      const { data: topUsersData } = await supabase
        .from('users')
        .select('id, email, total_vendas, saldo')
        .order('saldo', { ascending: false })
        .limit(6);

      setTopMikrotiks(topMikrotiksData || []);
      setTopUsers(topUsersData || []);

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

      {/* Status dos MikroTiks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* MikroTik Status Card */}
        <Card>
          <CardHeader>
            <CardTitle>Status dos MikroTiks</CardTitle>
            <CardDescription>Visão geral dos equipamentos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col space-y-2 p-4 bg-green-50 rounded-lg">
                <span className="text-sm text-green-600 font-medium">Online</span>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-green-700">{stats.mikrotiksOnline}</span>
                  <span className="text-sm text-green-600">equipamentos</span>
                </div>
              </div>
              <div className="flex flex-col space-y-2 p-4 bg-red-50 rounded-lg">
                <span className="text-sm text-red-600 font-medium">Offline</span>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-red-700">{stats.mikrotiksTotal - stats.mikrotiksOnline}</span>
                  <span className="text-sm text-red-600">equipamentos</span>
                </div>
              </div>
              <div className="flex flex-col space-y-2 p-4 bg-blue-50 rounded-lg">
                <span className="text-sm text-blue-600 font-medium">MACs Ativos</span>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-blue-700">{stats.macsOnline}</span>
                  <span className="text-sm text-blue-600">dispositivos</span>
                </div>
              </div>
              <div className="flex flex-col space-y-2 p-4 bg-purple-50 rounded-lg">
                <span className="text-sm text-purple-600 font-medium">Total de MACs</span>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-purple-700">{stats.macsTotal}</span>
                  <span className="text-sm text-purple-600">registrados</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top MikroTiks Card */}
        <Card>
          <CardHeader>
            <CardTitle>Top MikroTiks</CardTitle>
            <CardDescription>Ranking por vendas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topMikrotiks.map((mikrotik, index) => (
                <div key={mikrotik.id} className="flex items-center space-x-4">
                  <div className="flex-none w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <span className="font-bold text-gray-700">#{index + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{mikrotik.nome}</p>
                    <p className="text-sm text-gray-500">{mikrotik.total_vendas} vendas</p>
                  </div>
                  <div className="flex-none">
                    <span className="text-sm font-medium text-gray-900">{formatCurrency(mikrotik.total_valor)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Users Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Top Usuários</CardTitle>
          <CardDescription>Ranking por saldo disponível</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topUsers.map((user, index) => (
              <div key={user.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-none w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="font-bold text-blue-700">#{index + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
                  <p className="text-sm text-gray-500">{user.total_vendas} vendas</p>
                </div>
                <div className="flex-none">
                  <span className="text-sm font-medium text-emerald-600">{formatCurrency(user.saldo)}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Sales Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Vendas Recentes</CardTitle>
          <CardDescription>Últimas transações realizadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentSales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{sale.mac_address}</p>
                    <p className="text-sm text-gray-500">{sale.plano_nome}</p>
                    <p className="text-xs text-gray-400">{new Date(sale.created_at).toLocaleString('pt-BR')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{formatCurrency(sale.valor)}</p>
                  <p className="text-xs text-gray-500">{sale.mikrotik_nome}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
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
