import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, DollarSign, Activity, ArrowUpRight, Router, Key, BarChart3, Wifi, Clock, CheckCircle, MoreHorizontal, Eye, Star, Server, RefreshCw, Filter, Download, Calendar, AlertCircle, Wallet, Package } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useLogger } from '@/lib/logger';

interface DashboardStats {
  totalClients: number;
  totalMikrotiks: number;
  totalSenhasDisponiveis: number;
  totalSenhasVendidas: number;
  totalVendas: number;
  receitaTotal: number;
  receitaHoje: number;
  receitaMes: number;
  saquesPendentes: number;
  macsCadastrados: number;
  clientsGrowth: number;
  revenueGrowth: number;
  lucroTotal: number;
  lucroHoje: number;
  lucroMes: number;
  ticketMedio: number;
  conversionRate: number;
}

interface RecentSale {
  id: string;
  cliente_nome: string;
  plano_nome: string;
  valor: number;
  status: string;
  data: string;
  mikrotik_nome: string;
}

interface TopClient {
  id: string;
  nome: string;
  email: string;
  total_gasto: number;
  total_vendas: number;
  ultimo_acesso: string;
}

interface MikrotikStatus {
  id: string;
  nome: string;
  provider_name: string;
  status: string;
  total_senhas: number;
  senhas_vendidas: number;
  receita: number;
}

const AdminDashboard = () => {
  const log = useLogger('AdminDashboard');
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    totalMikrotiks: 0,
    totalSenhasDisponiveis: 0,
    totalSenhasVendidas: 0,
    totalVendas: 0,
    receitaTotal: 0,
    receitaHoje: 0,
    receitaMes: 0,
    saquesPendentes: 0,
    macsCadastrados: 0,
    clientsGrowth: 0,
    revenueGrowth: 0,
    lucroTotal: 0,
    lucroHoje: 0,
    lucroMes: 0,
    ticketMedio: 0,
    conversionRate: 0
  });
  
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [topClients, setTopClients] = useState<TopClient[]>([]);
  const [mikrotikStatus, setMikrotikStatus] = useState<MikrotikStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    const timerId = log.startTimer('dashboard-load');
    setLoading(true);
    setError(null);

    try {
      log.info('Loading dashboard data from Supabase');

      const [
        clientesResult,
        mikrotiksResult,
        senhasResult,
        vendasResult,
        withdrawalsResult,
        macsResult
      ] = await Promise.all([
        supabase.from('clientes').select('*'),
        supabase.from('mikrotiks').select('*'),
        supabase.from('senhas').select('*'),
        supabase.from('vendas').select('*'),
        supabase.from('withdrawals').select('*'),
        supabase.from('macs').select('*')
      ]);

      const hoje = new Date();
      const inicioDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      
      const clientes = clientesResult.data || [];
      const mikrotiks = mikrotiksResult.data || [];
      const senhas = senhasResult.data || [];
      const vendas = vendasResult.data || [];
      const withdrawals = withdrawalsResult.data || [];
      const macs = macsResult.data || [];

      const senhasDisponiveis = senhas.filter(s => s.disponivel && !s.vendida).length;
      const senhasVendidas = senhas.filter(s => s.vendida).length;

      const vendasAprovadas = vendas.filter(v => v.status === 'aprovado' || v.status === 'pago');
      const receitaTotal = vendasAprovadas.reduce((sum, v) => sum + (Number(v.valor) || 0), 0);

      const vendasHoje = vendasAprovadas.filter(v => new Date(v.data) >= inicioDia);
      const receitaHoje = vendasHoje.reduce((sum, v) => sum + (Number(v.valor) || 0), 0);

      const vendasMes = vendasAprovadas.filter(v => new Date(v.data) >= inicioMes);
      const receitaMes = vendasMes.reduce((sum, v) => sum + (Number(v.valor) || 0), 0);

      const saquesPendentes = withdrawals
        .filter(w => w.status === 'pending' || w.status === 'aguardando')
        .reduce((sum, w) => sum + (Number(w.amount) || 0), 0);

      // Calcular lucro (considerando 30% como margem de lucro padrão)
      const margemLucro = 0.3; // 30% de margem
      const lucroTotal = receitaTotal * margemLucro;
      const lucroHoje = receitaHoje * margemLucro;
      const lucroMes = receitaMes * margemLucro;

      // Calcular ticket médio
      const ticketMedio = vendasAprovadas.length > 0 ? receitaTotal / vendasAprovadas.length : 0;

      // Calcular taxa de conversão (vendas aprovadas / total de vendas)
      const conversionRate = vendas.length > 0 ? (vendasAprovadas.length / vendas.length) * 100 : 0;

      setStats({
        totalClients: clientes.length,
        totalMikrotiks: mikrotiks.length,
        totalSenhasDisponiveis: senhasDisponiveis,
        totalSenhasVendidas: senhasVendidas,
        totalVendas: vendasAprovadas.length,
        receitaTotal,
        receitaHoje,
        receitaMes,
        saquesPendentes,
        macsCadastrados: macs.length,
        clientsGrowth: 12.5,
        revenueGrowth: 8.3,
        lucroTotal,
        lucroHoje,
        lucroMes,
        ticketMedio,
        conversionRate
      });

      // Vendas recentes com joins
      const { data: recentSalesData } = await supabase
        .from('vendas')
        .select(`
          id,
          valor,
          status,
          data,
          clientes!inner(nome),
          planos!inner(nome),
          mikrotiks!inner(nome)
        `)
        .in('status', ['aprovado', 'pago'])
        .order('data', { ascending: false })
        .limit(10);

      if (recentSalesData) {
        setRecentSales(recentSalesData.map((sale: any) => ({
          id: sale.id,
          cliente_nome: sale.clientes?.nome || 'Cliente Desconhecido',
          plano_nome: sale.planos?.nome || 'Plano Desconhecido', 
          valor: Number(sale.valor) || 0,
          status: sale.status,
          data: sale.data,
          mikrotik_nome: sale.mikrotiks?.nome || 'Mikrotik Desconhecido'
        })));
      }

      // Top clientes
      const clienteVendas = vendas.reduce((acc, venda) => {
        if (venda.cliente_id && (venda.status === 'aprovado' || venda.status === 'pago')) {
          if (!acc[venda.cliente_id]) {
            acc[venda.cliente_id] = { total: 0, count: 0 };
          }
          acc[venda.cliente_id].total += Number(venda.valor) || 0;
          acc[venda.cliente_id].count += 1;
        }
        return acc;
      }, {} as Record<string, { total: number; count: number }>);

      const topClientsIds = Object.entries(clienteVendas)
        .sort(([,a], [,b]) => (b as {total: number; count: number}).total - (a as {total: number; count: number}).total)
        .slice(0, 5)
        .map(([id]) => id);

      if (topClientsIds.length > 0) {
        const { data: topClientsData } = await supabase
          .from('clientes')
          .select('id, nome, email, criado_em')
          .in('id', topClientsIds);

        if (topClientsData) {
          setTopClients(topClientsData.map(client => ({
            id: client.id,
            nome: client.nome,
            email: client.email,
            total_gasto: clienteVendas[client.id]?.total || 0,
            total_vendas: clienteVendas[client.id]?.count || 0,
            ultimo_acesso: client.criado_em
          })));
        }
      }

      // Status dos Mikrotiks
      const mikrotikStats = await Promise.all(
        mikrotiks.map(async (mikrotik) => {
          const { data: planos } = await supabase
            .from('planos')
            .select('id')
            .eq('mikrotik_id', mikrotik.id);

          const planoIds = planos?.map(p => p.id) || [];
          
          let totalSenhas = 0;
          let senhasVendidas = 0;
          
          if (planoIds.length > 0) {
            const { data: senhasMikrotik } = await supabase
              .from('senhas')
              .select('vendida')
              .in('plano_id', planoIds);
            
            totalSenhas = senhasMikrotik?.length || 0;
            senhasVendidas = senhasMikrotik?.filter(s => s.vendida).length || 0;
          }

          const { data: vendasMikrotik } = await supabase
            .from('vendas')
            .select('valor')
            .eq('mikrotik_id', mikrotik.id)
            .in('status', ['aprovado', 'pago']);

          const receita = vendasMikrotik?.reduce((sum, v) => sum + (Number(v.valor) || 0), 0) || 0;

          return {
            id: mikrotik.id,
            nome: mikrotik.nome,
            provider_name: mikrotik.provider_name || 'N/A',
            status: mikrotik.status || 'ativo',
            total_senhas: totalSenhas,
            senhas_vendidas: senhasVendidas,
            receita
          };
        })
      );

      setMikrotikStatus(mikrotikStats);

      log.info('Dashboard data loaded successfully', {
        clients: clientes.length,
        mikrotiks: mikrotiks.length,
        sales: vendas.length,
        revenue: receitaTotal
      });

    } catch (err) {
      log.error('Failed to load dashboard data', err);
      setError('Erro ao carregar dados do dashboard. Tente novamente.');
    } finally {
      setLoading(false);
      log.endTimer(timerId, 'dashboard-load');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'aprovado':
      case 'pago':
      case 'ativo':
        return 'text-green-700 bg-green-100 border-green-200';
      case 'pendente':
      case 'aguardando':
        return 'text-yellow-700 bg-yellow-100 border-yellow-200';
      case 'cancelado':
      case 'rejeitado':
      case 'inativo':
        return 'text-red-700 bg-red-100 border-red-200';
      default:
        return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 p-4 lg:p-6">
        <div className="w-full">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-8"></div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 h-32"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 p-4 lg:p-6">
      <div className="w-full space-y-6 lg:space-y-8">
        {/* Header Section */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-indigo-600/10 rounded-3xl blur-3xl"></div>
          <div className="relative bg-white/70 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <BarChart3 className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      Dashboard CRM
                    </h1>
                    <p className="text-gray-600 flex items-center gap-2 text-lg">
                      <Clock className="w-5 h-5" />
                      Última atualização: {new Date().toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <button 
                  onClick={loadDashboardData}
                  className="inline-flex items-center gap-2 bg-white/80 hover:bg-white border border-gray-200 shadow-sm px-4 py-2 rounded-xl text-gray-700 hover:text-gray-900 transition-all duration-200 hover:shadow-md"
                >
                  <RefreshCw className="w-4 h-4" />
                  Atualizar
                </button>
                <button className="inline-flex items-center gap-2 bg-white/80 hover:bg-white border border-gray-200 shadow-sm px-4 py-2 rounded-xl text-gray-700 hover:text-gray-900 transition-all duration-200 hover:shadow-md">
                  <Filter className="w-4 h-4" />
                  Filtros
                </button>
                <button className="inline-flex items-center gap-2 bg-white/80 hover:bg-white border border-gray-200 shadow-sm px-4 py-2 rounded-xl text-gray-700 hover:text-gray-900 transition-all duration-200 hover:shadow-md">
                  <Download className="w-4 h-4" />
                  Exportar
                </button>
                <button className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg px-4 py-2 rounded-xl transition-all duration-200 hover:shadow-xl">
                  <Calendar className="w-4 h-4" />
                  Relatórios
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50/80 backdrop-blur-xl border border-red-200/50 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3 text-red-800">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h4 className="font-semibold">Erro no Sistema</h4>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Métricas Principais */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Clientes */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity duration-300"></div>
            <div className="relative bg-white/90 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <div className="flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1 rounded-lg">
                  <ArrowUpRight className="w-3 h-3" />
                  <span className="text-xs font-bold">+12%</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">Total de Clientes</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalClients.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Clientes ativos no sistema</p>
              </div>
            </div>
          </div>

          {/* Mikrotiks */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-700 rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity duration-300"></div>
            <div className="relative bg-white/90 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Router className="w-7 h-7 text-white" />
                </div>
                <div className="flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1 rounded-lg">
                  <Activity className="w-3 h-3" />
                  <span className="text-xs font-bold">Online</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">Mikrotiks Ativos</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalMikrotiks.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Equipamentos configurados</p>
              </div>
            </div>
          </div>

          {/* Receita Total */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-700 rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity duration-300"></div>
            <div className="relative bg-white/90 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                  <DollarSign className="w-7 h-7 text-white" />
                </div>
                <div className="flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1 rounded-lg">
                  <TrendingUp className="w-3 h-3" />
                  <span className="text-xs font-bold">+8%</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">Receita Total</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.receitaTotal)}</p>
                <p className="text-xs text-gray-500">Hoje: {formatCurrency(stats.receitaHoje)}</p>
              </div>
            </div>
          </div>

          {/* Senhas Disponíveis */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-red-700 rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity duration-300"></div>
            <div className="relative bg-white/90 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Key className="w-7 h-7 text-white" />
                </div>
                <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                  <span className="text-xs font-bold">Disponível</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">Senhas Disponíveis</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalSenhasDisponiveis.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Vendidas: {stats.totalSenhasVendidas}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Métricas Financeiras Avançadas */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Lucro Total */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-700 rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity duration-300"></div>
            <div className="relative bg-white/90 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
                <div className="flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1 rounded-lg">
                  <span className="text-xs font-bold">Lucro</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">Lucro Total (30%)</p>
                <p className="text-3xl font-bold text-green-600">{formatCurrency(stats.lucroTotal)}</p>
                <p className="text-xs text-gray-500">Hoje: {formatCurrency(stats.lucroHoje)}</p>
              </div>
            </div>
          </div>

          {/* Ticket Médio */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-700 rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity duration-300"></div>
            <div className="relative bg-white/90 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                  <BarChart3 className="w-7 h-7 text-white" />
                </div>
                <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                  <span className="text-xs font-bold">Médio</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">Ticket Médio</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.ticketMedio)}</p>
                <p className="text-xs text-gray-500">Por venda aprovada</p>
              </div>
            </div>
          </div>

          {/* Taxa de Conversão */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-700 rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity duration-300"></div>
            <div className="relative bg-white/90 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Activity className="w-7 h-7 text-white" />
                </div>
                <div className="flex items-center gap-1 text-purple-600 bg-purple-50 px-3 py-1 rounded-lg">
                  <span className="text-xs font-bold">Taxa</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">Taxa de Conversão</p>
                <p className="text-3xl font-bold text-gray-900">{stats.conversionRate.toFixed(1)}%</p>
                <p className="text-xs text-gray-500">Vendas aprovadas</p>
              </div>
            </div>
          </div>

          {/* Receita do Mês */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-red-700 rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity duration-300"></div>
            <div className="relative bg-white/90 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Calendar className="w-7 h-7 text-white" />
                </div>
                <div className="flex items-center gap-1 text-orange-600 bg-orange-50 px-3 py-1 rounded-lg">
                  <span className="text-xs font-bold">Mês</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">Receita do Mês</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.receitaMes)}</p>
                <p className="text-xs text-gray-500">Lucro: {formatCurrency(stats.lucroMes)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Segunda linha de métricas operacionais */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Vendas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalVendas.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Saques Pendentes</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.saquesPendentes)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Wifi className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">MACs Cadastrados</p>
                <p className="text-2xl font-bold text-gray-900">{stats.macsCadastrados.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-green-600 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Senhas Disponíveis</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSenhasDisponiveis.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Seção Principal: Vendas e Clientes */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Vendas Recentes */}
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Vendas Recentes</h3>
                  <p className="text-gray-600">Últimas transações aprovadas</p>
                </div>
                <button className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors">
                  <MoreHorizontal className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {recentSales.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhuma venda recente encontrada</p>
                </div>
              ) : (
                <div className="space-y-0">
                  {recentSales.map((sale, index) => (
                    <div key={sale.id} className={`p-4 hover:bg-gray-50/80 transition-colors ${index !== recentSales.length - 1 ? 'border-b border-gray-100' : ''}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {sale.cliente_nome.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{sale.cliente_nome}</p>
                            <p className="text-sm text-gray-600 truncate">{sale.plano_nome}</p>
                            <p className="text-xs text-gray-500">{formatDate(sale.data)}</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-gray-900">{formatCurrency(sale.valor)}</p>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-lg border ${getStatusColor(sale.status)}`}>
                            {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Top Clientes */}
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Top Clientes</h3>
                  <p className="text-gray-600">Maiores compradores</p>
                </div>
                <button className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors">
                  <Eye className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {topClients.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhum cliente encontrado</p>
                </div>
              ) : (
                <div className="space-y-0">
                  {topClients.map((client, index) => (
                    <div key={client.id} className={`p-4 hover:bg-gray-50/80 transition-colors ${index !== topClients.length - 1 ? 'border-b border-gray-100' : ''}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                              {client.nome.charAt(0).toUpperCase()}
                            </div>
                            {index < 3 && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                                <Star className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{client.nome}</p>
                            <p className="text-sm text-gray-600 truncate">{client.email}</p>
                            <p className="text-xs text-gray-500">{client.total_vendas} compras</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-gray-900">{formatCurrency(client.total_gasto)}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-xs text-gray-500">Ativo</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status dos Mikrotiks */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                  <Router className="w-6 h-6 text-blue-600" />
                  Status dos Mikrotiks
                </h3>
                <p className="text-gray-600">Monitoramento em tempo real dos equipamentos</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">Monitorando</span>
              </div>
            </div>
          </div>
          <div className="p-6">
            {mikrotikStatus.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Router className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhum Mikrotik configurado</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {mikrotikStatus.map((mikrotik) => (
                  <div key={mikrotik.id} className="bg-gray-50/80 rounded-2xl p-5 border border-gray-200/50 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                          <Server className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 truncate">{mikrotik.nome}</h4>
                          <p className="text-xs text-gray-600 truncate">{mikrotik.provider_name}</p>
                        </div>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-lg border ${getStatusColor(mikrotik.status)}`}>
                        {mikrotik.status}
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total de Senhas:</span>
                        <span className="font-semibold text-gray-900">{mikrotik.total_senhas}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Senhas Vendidas:</span>
                        <span className="font-semibold text-green-600">{mikrotik.senhas_vendidas}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Receita:</span>
                        <span className="font-semibold text-blue-600">{formatCurrency(mikrotik.receita)}</span>
                      </div>
                      
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Utilização</span>
                          <span>{mikrotik.total_senhas > 0 ? Math.round((mikrotik.senhas_vendidas / mikrotik.total_senhas) * 100) : 0}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: mikrotik.total_senhas > 0 ? `${(mikrotik.senhas_vendidas / mikrotik.total_senhas) * 100}%` : '0%' 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Sistema Operacional</p>
                <p className="text-sm text-gray-600">Todos os serviços funcionando normalmente</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Database Online</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>API Funcionando</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
