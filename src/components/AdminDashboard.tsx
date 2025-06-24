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
  ShoppingCart,
  Settings,
  Calendar,
  Filter
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
import SiteSettings from './SiteSettings';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  nome?: string;
  total_vendas: number;
  saldo: number;
}

interface RecentSale {
  id: string;
  valor: number;
  data: string;
  descricao: string;
  plano_nome: string;
  mikrotik_nome: string;
  cliente_nome?: string;
  cliente_email?: string;
  mac_address: string;
  status: string;
}

type PeriodFilter = 'today' | 'week' | 'month' | 'all';

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
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [topMikrotiks, setTopMikrotiks] = useState<TopMikrotik[]>([]);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [rankingPeriod, setRankingPeriod] = useState<PeriodFilter>('week');
  const { mikrotiks: mikrotiksStatus, estatisticas: mikrotikStats, loading: mikrotikLoading } = useMikrotikStatus();

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    loadRankingData();
  }, [rankingPeriod]);

  const getDateFilter = (period: PeriodFilter) => {
    const now = new Date();
    
    switch (period) {
      case 'today':
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return today.toISOString();
      
      case 'week':
        const weekStart = new Date(now);
        const dayOfWeek = now.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        weekStart.setDate(now.getDate() - daysToMonday);
        weekStart.setHours(0, 0, 0, 0);
        return weekStart.toISOString();
      
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return monthStart.toISOString();
      
      default:
        return null;
    }
  };

  const getPeriodLabel = (period: PeriodFilter) => {
    switch (period) {
      case 'today': return 'Hoje';
      case 'week': return 'Esta Semana';
      case 'month': return 'Este Mês';
      case 'all': return 'Todos os Tempos';
    }
  };

  const loadRankingData = async () => {
    try {
      const dateFilter = getDateFilter(rankingPeriod);
      
      // Top MikroTiks por vendas no período
      const mikrotikQuery = supabase
        .from('vendas')
        .select(`
          mikrotik_id,
          valor,
          mikrotiks (
            id,
            nome
          )
        `)
        .eq('status', 'aprovado');
      
      if (dateFilter) {
        mikrotikQuery.gte('data', dateFilter);
      }

      const { data: mikrotikSales, error: mikrotikError } = await mikrotikQuery;
      
      if (mikrotikError) {
        console.error('Erro ao buscar dados dos MikroTiks:', mikrotikError);
      } else if (mikrotikSales) {
        // Agrupar vendas por MikroTik
        const mikrotikStats = mikrotikSales.reduce((acc, sale) => {
          const mikrotikId = sale.mikrotik_id;
          const mikrotikNome = sale.mikrotiks?.nome || 'MikroTik Desconhecido';
          
          if (!acc[mikrotikId]) {
            acc[mikrotikId] = {
              id: mikrotikId,
              nome: mikrotikNome,
              total_vendas: 0,
              total_valor: 0
            };
          }
          
          acc[mikrotikId].total_vendas += 1;
          acc[mikrotikId].total_valor += parseFloat(sale.valor || '0');
          
          return acc;
        }, {} as Record<string, TopMikrotik>);

        const topMikrotiksArray = Object.values(mikrotikStats)
          .sort((a, b) => b.total_valor - a.total_valor)
          .slice(0, 5);

        setTopMikrotiks(topMikrotiksArray);
      }

      // Top Usuários por saldo
      const { data: topUsersData, error: usersError } = await supabase
        .from('clientes')
        .select(`
          id,
          email,
          nome,
          saldo
        `)
        .order('saldo', { ascending: false })
        .limit(5);

      if (usersError) {
        console.error('Erro ao buscar top usuários:', usersError);
      } else {
        const processedUsers = topUsersData?.map(user => ({
          id: user.id,
          email: user.email,
          nome: user.nome,
          total_vendas: 0, // Será calculado se necessário
          saldo: parseFloat(user.saldo || '0')
        })) || [];

        setTopUsers(processedUsers);
      }

    } catch (error) {
      console.error('Erro ao carregar rankings:', error);
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Verificar qual chave está sendo usada
      console.log('🔧 Verificando configuração Supabase:', {
        anon_key: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Configurada' : 'Não configurada',
        service_role: import.meta.env.VITE_SUPABASE_SERVICE_ROLE ? 'Configurada' : 'Não configurada',
        key_fallback: import.meta.env.VITE_SUPABASE_KEY ? 'Configurada' : 'Não configurada'
      });

      // Datas para cálculos
      const agora = new Date();
      const inicioHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
      
      const inicioSemana = new Date(agora);
      const diaDaSemana = agora.getDay();
      const diasParaSegunda = diaDaSemana === 0 ? 6 : diaDaSemana - 1;
      inicioSemana.setDate(agora.getDate() - diasParaSegunda);
      inicioSemana.setHours(0, 0, 0, 0);
      
      const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);

      // Carregar estatísticas gerais
      const [
        clientesRes,
        mikrotiksRes,
        macsRes,
        vendasTodasRes,
        vendasHojeRes,
        vendasSemanaRes,
        vendasMesRes
      ] = await Promise.all([
        supabase.from('clientes').select('id'),
        supabase.from('mikrotiks').select('id').eq('status', 'Ativo'),
        supabase.from('macs').select('id, status'),
        supabase.from('vendas').select('preco, lucro, status'),
        supabase.from('vendas').select('preco, lucro').eq('status', 'aprovado').gte('data', inicioHoje.toISOString()),
        supabase.from('vendas').select('preco, lucro').eq('status', 'aprovado').gte('data', inicioSemana.toISOString()),
        supabase.from('vendas').select('preco, lucro').eq('status', 'aprovado').gte('data', inicioMes.toISOString())
      ]);

      // Carregar vendas recentes
      const { data: recentSalesData, error: salesError } = await supabase
        .from('vendas')
        .select(`
          id,
          valor,
          data,
          descricao,
          status,
          planos (
            nome
          ),
          mikrotiks (
            nome
          ),
          clientes (
            nome,
            email
          ),
          macs (
            mac_address
          )
        `)
        .eq('status', 'aprovado')
        .order('data', { ascending: false })
        .limit(10);

      if (salesError) {
        console.error('Erro ao buscar vendas recentes:', salesError);
      } else {
        const processedSales = recentSalesData?.map(sale => ({
          id: sale.id,
          valor: parseFloat(sale.valor || '0'),
          data: sale.data,
          descricao: sale.descricao || 'Venda',
          plano_nome: sale.planos?.nome || 'Plano Desconhecido',
          mikrotik_nome: sale.mikrotiks?.nome || 'MikroTik Desconhecido',
          cliente_nome: sale.clientes?.nome,
          cliente_email: sale.clientes?.email,
          mac_address: sale.macs?.mac_address || 'N/A',
          status: sale.status
        })) || [];

        setRecentSales(processedSales);
      }

      // Calcular estatísticas
      const totalClientes = clientesRes.data?.length || 0;
      const mikrotiksAtivos = mikrotiksRes.data?.length || 0;
      const totalMacs = macsRes.data?.length || 0;
      const macsConectados = macsRes.data?.filter(mac => mac.status === 'conectado').length || 0;

      const vendasAprovadas = vendasTodasRes.data?.filter(v => v.status === 'aprovado') || [];
      const totalVendas = vendasAprovadas.length;

      // Calcular receitas e lucros
      const calcularValores = (vendas: any[]) => {
        const receita = vendas.reduce((sum, v) => sum + parseFloat(v.preco || '0'), 0);
        const lucro = vendas.reduce((sum, v) => sum + parseFloat(v.lucro || '0'), 0);
        return { receita, lucro };
      };

      const valoresHoje = calcularValores(vendasHojeRes.data || []);
      const valoresSemana = calcularValores(vendasSemanaRes.data || []);
      const valoresMes = calcularValores(vendasMesRes.data || []);

      setStats({
        totalClientes,
        totalVendas,
        mikrotiksAtivos,
        totalMacs,
        macsConectados,
        lucroHoje: valoresHoje.lucro,
        lucroSemana: valoresSemana.lucro,
        lucroMes: valoresMes.lucro,
        receitaHoje: valoresHoje.receita,
        receitaSemana: valoresSemana.receita,
        receitaMes: valoresMes.receita,
        mikrotiksOnline: mikrotikStats?.online || 0,
        mikrotiksTotal: mikrotikStats?.total || 0,
        macsOnline: macsConectados,
        macsTotal: totalMacs,
      });

    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Carregando dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do sistema</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={loadDashboardData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClientes}</div>
            <p className="text-xs text-muted-foreground">Clientes registrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas Aprovadas</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVendas}</div>
            <p className="text-xs text-muted-foreground">Total de vendas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MikroTiks</CardTitle>
            <Router className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.mikrotiksOnline}/{stats.mikrotiksTotal}
            </div>
            <p className="text-xs text-muted-foreground">Online/Total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MACs</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.macsOnline}/{stats.macsTotal}
            </div>
            <p className="text-xs text-muted-foreground">Conectados/Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoje</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.receitaHoje)}</div>
            <p className="text-xs text-muted-foreground">
              Lucro: {formatCurrency(stats.lucroHoje)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.receitaSemana)}</div>
            <p className="text-xs text-muted-foreground">
              Lucro: {formatCurrency(stats.lucroSemana)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Este Mês</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.receitaMes)}</div>
            <p className="text-xs text-muted-foreground">
              Lucro: {formatCurrency(stats.lucroMes)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Rankings e Vendas Recentes */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Top MikroTiks */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Top MikroTiks</CardTitle>
              <Select value={rankingPeriod} onValueChange={(value: PeriodFilter) => setRankingPeriod(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Semana</SelectItem>
                  <SelectItem value="month">Mês</SelectItem>
                  <SelectItem value="all">Todos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <CardDescription>
              Ranking por vendas - {getPeriodLabel(rankingPeriod)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topMikrotiks.length > 0 ? (
                topMikrotiks.map((mikrotik, index) => (
                  <div key={mikrotik.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{mikrotik.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {mikrotik.total_vendas} vendas
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatCurrency(mikrotik.total_valor)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma venda no período
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Usuários */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Usuários</CardTitle>
            <CardDescription>Ranking por saldo disponível</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topUsers.length > 0 ? (
                topUsers.map((user, index) => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium">
                          {user.nome || user.email.split('@')[0]}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user.total_vendas} vendas • {user.email}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatCurrency(user.saldo)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum usuário encontrado
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Vendas Recentes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Vendas Recentes</CardTitle>
            <CardDescription>Últimas transações realizadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentSales.length > 0 ? (
                recentSales.map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{sale.plano_nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {sale.mikrotik_nome} • {formatDate(sale.data)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        MAC: {sale.mac_address}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatCurrency(sale.valor)}</p>
                      <p className="text-xs text-green-600">Aprovado</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma venda recente
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MikroTik Status */}
      <MikrotikStatusSummary />
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
    { name: 'Configurações', href: '/settings', icon: Settings },
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
            <Route path="/settings" element={<SiteSettings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
