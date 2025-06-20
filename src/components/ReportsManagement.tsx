import React, { useState, useEffect } from 'react';
import { BarChart3, DollarSign, TrendingUp, Calendar, Download, FileText, Filter, Router } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface Venda {
  id: string;
  cliente_id: string;
  mikrotik_id: string;
  plano_id: string;
  valor: number;
  preco: number;
  lucro: number;
  status: string;
  data: string;
  planos?: { nome: string };
  mikrotiks?: { nome: string };
}

interface Cliente {
  id: string;
  role: string;
}

interface ReportStats {
  todayTotal: number;
  todaySales: number;
  weekTotal: number;
  weekSales: number;
  monthTotal: number;
  monthSales: number;
  totalTransactions: number;
}

const ReportsManagement = () => {
  const [dateRange, setDateRange] = useState('month');
  const [reportType, setReportType] = useState('general');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [salesData, setSalesData] = useState<Venda[]>([]);
  const [stats, setStats] = useState<ReportStats>({
    todayTotal: 0,
    todaySales: 0,
    weekTotal: 0,
    weekSales: 0,
    monthTotal: 0,
    monthSales: 0,
    totalTransactions: 0
  });
  const [topMikrotiks, setTopMikrotiks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<Cliente | null>(null);

  useEffect(() => {
    async function initializeData() {
      await getCurrentUser();
    }
    initializeData();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchSalesData();
    }
  }, [currentUser, dateRange]);

  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('Usuário não autenticado');
        setLoading(false);
        return;
      }

      const { data: cliente, error } = await supabase
        .from('clientes')
        .select('id, role')
        .eq('email', user.email)
        .single();

      if (error) {
        console.error('Erro ao buscar cliente:', error);
        setLoading(false);
        return;
      }

      if (cliente) {
        setCurrentUser(cliente);
      }
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      setLoading(false);
    }
  };

  const fetchSalesData = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      let query;

      if (currentUser.role === 'admin') {
        // Admin vê todas as vendas
        query = supabase
          .from('vendas')
          .select(`
            *,
            planos!inner(nome),
            mikrotiks!inner(nome)
          `)
          .eq('status', 'aprovado')
          .order('data', { ascending: false });
      } else {
        // Usuário normal: buscar vendas de todos os mikrotiks vinculados a ele
        const { data: userMikrotiks } = await supabase
          .from('mikrotiks')
          .select('id')
          .eq('cliente_id', currentUser.id);

        if (!userMikrotiks || userMikrotiks.length === 0) {
          console.log('Nenhum mikrotik encontrado para o usuário');
          setSalesData([]);
          setStats({
            todayTotal: 0,
            todaySales: 0,
            weekTotal: 0,
            weekSales: 0,
            monthTotal: 0,
            monthSales: 0,
            totalTransactions: 0
          });
          setTopMikrotiks([]);
          setLoading(false);
          return;
        }

        const mikrotikIds = userMikrotiks.map(m => m.id);
        console.log('Mikrotiks do usuário:', mikrotikIds);

        query = supabase
          .from('vendas')
          .select(`
            *,
            planos!inner(nome),
            mikrotiks!inner(nome)
          `)
          .eq('status', 'aprovado')
          .in('mikrotik_id', mikrotikIds)
          .order('data', { ascending: false });
      }

      // Aplicar filtro de data
      if (dateRange !== 'all') {
        const hoje = new Date();
        let startFilter: Date;

        switch (dateRange) {
          case 'today':
            startFilter = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
            break;
          case 'week':
            startFilter = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            startFilter = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
            break;
          default:
            startFilter = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        }

        query = query.gte('data', startFilter.toISOString());
      }

      // Aplicar filtro personalizado se definido
      if (startDate && endDate) {
        query = query
          .gte('data', new Date(startDate).toISOString())
          .lte('data', new Date(endDate + 'T23:59:59').toISOString());
      }

      const { data, error } = await query.limit(100);

      if (error) {
        console.error('Erro ao buscar vendas:', error);
        setSalesData([]);
        setStats({
          todayTotal: 0,
          todaySales: 0,
          weekTotal: 0,
          weekSales: 0,
          monthTotal: 0,
          monthSales: 0,
          totalTransactions: 0
        });
        setTopMikrotiks([]);
        return;
      }

      console.log('Vendas encontradas:', data?.length || 0);
      setSalesData(data || []);
      calculateStats(data || []);
      calculateTopMikrotiks(data || []);

    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      setSalesData([]);
      setStats({
        todayTotal: 0,
        todaySales: 0,
        weekTotal: 0,
        weekSales: 0,
        monthTotal: 0,
        monthSales: 0,
        totalTransactions: 0
      });
      setTopMikrotiks([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (vendas: Venda[]) => {
    const hoje = new Date();
    const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    const inicioSemana = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000);
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

    // Vendas de hoje
    const vendasHoje = vendas.filter(v => new Date(v.data) >= inicioHoje);
    const todayTotal = vendasHoje.reduce((sum, v) => sum + Number(v.preco || 0), 0);

    // Vendas da semana
    const vendasSemana = vendas.filter(v => new Date(v.data) >= inicioSemana);
    const weekTotal = vendasSemana.reduce((sum, v) => sum + Number(v.preco || 0), 0);

    // Vendas do mês
    const vendasMes = vendas.filter(v => new Date(v.data) >= inicioMes);
    const monthTotal = vendasMes.reduce((sum, v) => sum + Number(v.preco || 0), 0);

    setStats({
      todayTotal,
      todaySales: vendasHoje.length,
      weekTotal,
      weekSales: vendasSemana.length,
      monthTotal,
      monthSales: vendasMes.length,
      totalTransactions: vendas.length
    });
  };

  const calculateTopMikrotiks = (vendas: Venda[]) => {
    const mikrotikStats = vendas.reduce((acc, sale) => {
      const mikrotikName = sale.mikrotiks?.nome || 'N/A';
      if (!acc[mikrotikName]) {
        acc[mikrotikName] = { sales: 0, transactions: 0 };
      }
      acc[mikrotikName].sales += Number(sale.preco || 0);
      acc[mikrotikName].transactions += 1;
      return acc;
    }, {} as Record<string, { sales: number; transactions: number }>);

    const top = Object.entries(mikrotikStats)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);

    setTopMikrotiks(top);
  };

  const handleFilter = () => {
    fetchSalesData();
  };

  const clearFilters = () => {
    setDateRange('month');
    setReportType('general');
    setStartDate('');
    setEndDate('');
    setTimeout(() => {
      fetchSalesData();
    }, 100);
  };

  const exportToExcel = () => {
    // Implementar exportação para Excel
    console.log('Exportando para Excel...');
  };

  const generatePDF = () => {
    // Implementar geração de PDF
    console.log('Gerando PDF...');
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-6 space-y-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando relatórios...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-600 mt-1">Análise detalhada de vendas</p>
        </div>
        <div className="flex gap-3 mt-4 lg:mt-0">
          <button onClick={exportToExcel} className="btn-success flex items-center gap-2">
            <Download className="w-4 h-4" />
            Exportar Excel
          </button>
          <button onClick={generatePDF} className="btn-primary flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Gerar PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="form-group">
            <label className="form-label flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Período
            </label>
            <select 
              value={dateRange} 
              onChange={(e) => setDateRange(e.target.value)}
              className="input-field"
            >
              <option value="today">Hoje</option>
              <option value="week">Esta Semana</option>
              <option value="month">Este Mês</option>
              <option value="custom">Personalizado</option>
              <option value="all">Todos</option>
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Tipo de Relatório
            </label>
            <select 
              value={reportType} 
              onChange={(e) => setReportType(e.target.value)}
              className="input-field"
            >
              <option value="general">Geral</option>
              <option value="mikrotiks">Por Mikrotik</option>
              <option value="plans">Por Plano</option>
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label">Data Inicial</label>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input-field" 
              disabled={dateRange !== 'custom'}
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Data Final</label>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input-field" 
              disabled={dateRange !== 'custom'}
            />
          </div>
        </div>
        
        <div className="flex gap-3 mt-4">
          <button onClick={handleFilter} className="btn-primary flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtrar
          </button>
          <button onClick={clearFilters} className="btn-secondary">
            Limpar Filtros
          </button>
        </div>
      </div>

      {/* Period Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Hoje */}
        <div className="stats-card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Vendas de Hoje
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Receita:</span>
              <span className="font-bold text-gray-900">R$ {stats.todayTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Transações:</span>
              <span className="font-bold text-blue-600">{stats.todaySales}</span>
            </div>
          </div>
        </div>

        {/* Semana */}
        <div className="stats-card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            Vendas da Semana
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Receita:</span>
              <span className="font-bold text-gray-900">R$ {stats.weekTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Transações:</span>
              <span className="font-bold text-blue-600">{stats.weekSales}</span>
            </div>
          </div>
        </div>

        {/* Mês */}
        <div className="stats-card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-orange-600" />
            Vendas do Mês
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Receita:</span>
              <span className="font-bold text-gray-900">R$ {stats.monthTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Transações:</span>
              <span className="font-bold text-blue-600">{stats.monthSales}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stats-card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">R$ {stats.monthTotal.toFixed(2)}</h3>
          <p className="text-gray-600">Total de Receita (Período)</p>
        </div>

        <div className="stats-card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{stats.totalTransactions}</h3>
          <p className="text-gray-600">Transações (Período)</p>
        </div>

        <div className="stats-card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            R$ {stats.totalTransactions > 0 ? (stats.monthTotal / stats.totalTransactions).toFixed(2) : '0.00'}
          </h3>
          <p className="text-gray-600">Ticket Médio</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Table */}
        <div className="lg:col-span-2 data-table">
          <div className="table-header">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Vendas Detalhadas ({salesData.length})
            </h2>
          </div>

          <div className="divide-y divide-gray-100">
            {salesData.length === 0 ? (
              <div className="table-cell text-center py-8">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhuma venda encontrada no período selecionado</p>
              </div>
            ) : (
              salesData.map((sale) => (
                <div key={sale.id} className="table-cell hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <Router className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{sale.mikrotiks?.nome || 'N/A'}</p>
                        <p className="text-sm text-gray-500">{sale.planos?.nome || 'N/A'}</p>
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
                      <p className="font-bold text-gray-900">R$ {Number(sale.preco || 0).toFixed(2)}</p>
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {sale.status === 'aprovado' ? 'Pago' : sale.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Mikrotiks */}
        <div className="stats-card">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            Top Mikrotiks
          </h3>
          <div className="space-y-4">
            {topMikrotiks.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                Nenhum dado disponível
              </div>
            ) : (
              topMikrotiks.map((mikrotik, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-900">{mikrotik.name}</p>
                    <p className="text-sm text-gray-500">{mikrotik.transactions} transações</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">R$ {mikrotik.sales.toFixed(2)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsManagement;
