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
  Settings
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
  nome: string;
  total_vendas: number;
  saldo: number;
}

interface DatabaseSale {
  id: string;
  mac_address: string;
  valor: number;
  data: string;
  planos: {
    nome: string;
  };
  mikrotiks: {
    nome: string;
  };
  status: string;
}

interface VendaComMikrotik {
  mikrotik_id: string;
  preco: number;
  mikrotiks: {
    nome: string;
  };
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
        vendasMesRes
      ] = await Promise.all([
        supabase.from('clientes').select('id'),
        supabase.from('mikrotiks').select('id').eq('status', 'Ativo'),
        supabase.from('vendas').select('preco, lucro, status').eq('status', 'aprovado'),
        supabase.from('vendas').select('preco, lucro').eq('status', 'aprovado').gte('data', inicioHoje.toISOString()),
        supabase.from('vendas').select('preco, lucro').eq('status', 'aprovado').gte('data', inicioSemana.toISOString()),
        supabase.from('vendas').select('preco, lucro').eq('status', 'aprovado').gte('data', inicioMes.toISOString())
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
        macsConectados = macsData.filter(mac => mac.status === 'conectado' || mac.status === 'connected').length;
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
        mikrotiksOnline: mikrotiksStatus?.filter(m => m.is_online).length || 0,
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
          data,
          planos!inner(nome),
          mikrotiks!inner(nome),
          status
        `)
        .eq('status', 'aprovado')
        .order('data', { ascending: false })
        .limit(10);

      const recentSales = (recentSalesData || []).map((sale: any) => ({
        id: sale.id,
        mac_address: sale.mac_address,
        valor: sale.valor,
        created_at: sale.data,
        plano_nome: sale.planos?.nome || 'Plano não encontrado',
        mikrotik_nome: sale.mikrotiks?.nome || 'MikroTik não encontrado'
      }));

      setRecentSales(recentSales);

      // Carregar top MikroTiks por valor de vendas
      const { data: mikrotiksComVendas } = await supabase
        .from('vendas')
        .select(`
          mikrotik_id,
          preco,
          mikrotiks!inner(nome)
        `)
        .eq('status', 'aprovado');

      // Agrupar e calcular totais por MikroTik
      const mikrotikTotals = (mikrotiksComVendas || []).reduce((acc: Record<string, TopMikrotik>, venda: any) => {
        const mikrotikId = venda.mikrotik_id;
        if (!acc[mikrotikId]) {
          acc[mikrotikId] = {
            id: mikrotikId,
            nome: venda.mikrotiks?.nome || 'MikroTik sem nome',
            total_vendas: 0,
            total_valor: 0
          };
        }
        acc[mikrotikId].total_vendas += 1;
        acc[mikrotikId].total_valor += Number(venda.preco) || 0;
        return acc;
      }, {});

      const topMikrotiksArray = Object.values(mikrotikTotals)
        .sort((a, b) => b.total_valor - a.total_valor)
        .slice(0, 5);

      setTopMikrotiks(topMikrotiksArray);

      // Carregar top usuários por saldo
      const { data: topUsersData } = await supabase
        .from('clientes')
        .select('id, email, nome, saldo')
        .order('saldo', { ascending: false })
        .limit(6);

      // Calcular total de vendas por cliente
      const { data: vendasPorCliente } = await supabase
        .from('vendas')
        .select('cliente_id')
        .eq('status', 'aprovado');

      const clienteVendas = (vendasPorCliente || []).reduce((acc, venda) => {
        acc[venda.cliente_id] = (acc[venda.cliente_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topUsersWithVendas = (topUsersData || []).map(user => ({
        ...user,
        total_vendas: clienteVendas[user.id] || 0
      }));

      setTopUsers(topUsersWithVendas);

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
                {formatCurrency(stats.lucroHoje)}
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
                {formatCurrency(stats.lucroSemana)}
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
                {formatCurrency(stats.lucroMes)}
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
                {formatCurrency(stats.receitaHoje)}
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
                {formatCurrency(stats.receitaSemana)}
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
                {formatCurrency(stats.receitaMes)}
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
              {topMikrotiks.length > 0 ? (
                topMikrotiks.map((mikrotik, index) => (
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
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p>Nenhuma venda registrada ainda</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Users e Vendas Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Users Card */}
        <Card>
          <CardHeader>
            <CardTitle>Top Usuários</CardTitle>
            <CardDescription>Ranking por saldo disponível</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topUsers.length > 0 ? (
                topUsers.map((user, index) => (
                  <div key={user.id} className="flex items-center space-x-4">
                    <div className="flex-none w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="font-bold text-gray-700">#{index + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.nome || user.email}
                      </p>
                      <p className="text-sm text-gray-500">{user.total_vendas} vendas</p>
                    </div>
                    <div className="flex-none">
                      <span className="text-sm font-medium text-gray-900">{formatCurrency(user.saldo)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p>Nenhum usuário encontrado</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Vendas Recentes Card */}
        <Card>
          <CardHeader>
            <CardTitle>Vendas Recentes</CardTitle>
            <CardDescription>Últimas 10 vendas aprovadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentSales.length > 0 ? (
                recentSales.map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 font-mono">
                        {sale.mac_address}
                      </p>
                      <p className="text-xs text-gray-500">
                        {sale.plano_nome} • {sale.mikrotik_nome}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(sale.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex-none ml-4">
                      <span className="text-sm font-medium text-green-600">
                        {formatCurrency(sale.valor)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p>Nenhuma venda recente</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SimplePage({ title }: { title: string }) {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">{title}</h1>
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <p className="text-gray-600">Conteúdo da página {title} será implementado aqui.</p>
      </div>
    </div>
  );
}

export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { pendingCount } = usePendingWithdrawals();

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Usuários', href: '/admin/users', icon: Users },
    { name: 'MikroTiks', href: '/admin/mikrotiks', icon: Router },
    { name: 'Senhas', href: '/admin/passwords', icon: Key },
    { name: 'MACs', href: '/admin/macs', icon: Monitor },
    { 
      name: 'Saques', 
      href: '/admin/withdrawals', 
      icon: CreditCard,
      badge: pendingCount > 0 ? pendingCount : undefined
    },
    { name: 'Relatórios', href: '/admin/reports', icon: BarChart3 },
    { name: 'Configurações', href: '/admin/settings', icon: Settings },
  ];

  const isActivePath = (href: string) => {
    if (href === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar para desktop */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
            </div>
            <div className="mt-5 flex-grow flex flex-col">
              <nav className="flex-1 px-2 space-y-1">
                {navigation.map((item) => {
                  const isActive = isActivePath(item.href);
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive
                          ? 'bg-blue-100 text-blue-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <item.icon
                        className={`mr-3 flex-shrink-0 h-5 w-5 ${
                          isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                        }`}
                      />
                      {item.name}
                      {item.badge && (
                        <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
              <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
                <div className="flex-shrink-0 w-full group block">
                  <div className="flex items-center">
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                        {user.email}
                      </p>
                      <button
                        onClick={onLogout}
                        className="flex items-center text-xs font-medium text-gray-500 group-hover:text-gray-700"
                      >
                        <LogOut className="mr-1 h-3 w-3" />
                        Sair
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar móvel */}
      {sidebarOpen && (
        <div className="fixed inset-0 flex z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4">
                <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
              </div>
              <nav className="mt-5 px-2 space-y-1">
                {navigation.map((item) => {
                  const isActive = isActivePath(item.href);
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                        isActive
                          ? 'bg-blue-100 text-blue-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <item.icon
                        className={`mr-4 flex-shrink-0 h-6 w-6 ${
                          isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                        }`}
                      />
                      {item.name}
                      {item.badge && (
                        <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex-shrink-0 w-full group block">
                <div className="flex items-center">
                  <div className="ml-3">
                    <p className="text-base font-medium text-gray-700 group-hover:text-gray-900">
                      {user.email}
                    </p>
                    <button
                      onClick={onLogout}
                      className="flex items-center text-sm font-medium text-gray-500 group-hover:text-gray-700"
                    >
                      <LogOut className="mr-1 h-4 w-4" />
                      Sair
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo principal */}
      <div className="flex-1 overflow-hidden">
        <div className="lg:hidden">
          <div className="flex items-center justify-between bg-white px-4 py-2 border-b border-gray-200">
            <h1 className="text-lg font-medium text-gray-900">Admin Panel</h1>
            <button
              onClick={() => setSidebarOpen(true)}
              className="h-8 w-8 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>

        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/users" element={<UsersManagement />} />
            <Route path="/mikrotiks" element={<MikrotiksManagement />} />
            <Route path="/passwords" element={<PasswordsManagement />} />
            <Route path="/macs" element={<MacsManagement />} />
            <Route path="/withdrawals" element={<WithdrawalsManagement />} />
            <Route path="/reports" element={<ReportsManagement />} />
            <Route path="/settings" element={<SiteSettings />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
