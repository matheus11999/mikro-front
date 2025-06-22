import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Download, 
  FileText, 
  Filter, 
  RefreshCw,
  Search,
  AlertCircle,
  CheckCircle2,
  Users,
  Activity,
  Zap,
  PieChart,
  LineChart,
  Percent
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabaseClient';
import { useLogger } from '@/lib/logger';

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
  averageTicket: number;
}

interface TopMikrotik {
  name: string;
  sales: number;
  transactions: number;
  percentage: number;
}

const ReportsManagement = () => {
  const log = useLogger('ReportsManagement');
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
    totalTransactions: 0,
    averageTicket: 0
  });
  const [topMikrotiks, setTopMikrotiks] = useState<TopMikrotik[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentUser, setCurrentUser] = useState<Cliente | null>(null);

  useEffect(() => {
    log.mount();
    initializeData();
    
    return () => {
      log.unmount();
    };
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchSalesData();
    }
  }, [currentUser, dateRange]);

  const initializeData = async () => {
    await getCurrentUser();
  };

  const getCurrentUser = async () => {
    const timerId = log.startTimer('get-current-user');
    
    try {
      log.info('Getting current user');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        log.warn('User not authenticated');
        setLoading(false);
        return;
      }

      const { data: cliente, error } = await supabase
        .from('clientes')
        .select('id, role')
        .eq('email', user.email)
        .single();

      if (error) {
        log.error('Failed to fetch user data', error);
        setError('Erro ao carregar dados do usuário');
        setLoading(false);
        return;
      }

      if (cliente) {
        setCurrentUser(cliente);
        log.info('User loaded successfully', { role: cliente.role });
      }
    } catch (err) {
      log.error('Failed to get current user', err);
      setError('Erro ao carregar usuário');
      setLoading(false);
    } finally {
      log.endTimer(timerId, 'get-current-user');
    }
  };

  const fetchSalesData = async () => {
    if (!currentUser) return;
    
    const timerId = log.startTimer('fetch-sales-data');
    
    try {
      log.info('Fetching sales data');
      setLoading(true);
      setError('');
      
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
          log.info('No mikrotiks found for user');
          setSalesData([]);
          setStats({
            todayTotal: 0,
            todaySales: 0,
            weekTotal: 0,
            weekSales: 0,
            monthTotal: 0,
            monthSales: 0,
            totalTransactions: 0,
            averageTicket: 0
          });
          setTopMikrotiks([]);
          setLoading(false);
          return;
        }

        const mikrotikIds = userMikrotiks.map(m => m.id);
        log.info('User mikrotiks found', { count: mikrotikIds.length });

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

      const { data, error } = await query.limit(500);

      if (error) {
        log.error('Failed to fetch sales data', error);
        throw error;
      }

      log.info('Sales data fetched successfully', { count: data?.length });
      setSalesData(data || []);
      calculateStats(data || []);
      calculateTopMikrotiks(data || []);

    } catch (err) {
      log.error('Failed to fetch sales data', err);
      setError('Erro ao carregar dados de vendas');
      setSalesData([]);
      setStats({
        todayTotal: 0,
        todaySales: 0,
        weekTotal: 0,
        weekSales: 0,
        monthTotal: 0,
        monthSales: 0,
        totalTransactions: 0,
        averageTicket: 0
      });
      setTopMikrotiks([]);
    } finally {
      setLoading(false);
      log.endTimer(timerId, 'fetch-sales-data');
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

    // Total geral
    const totalValue = vendas.reduce((sum, v) => sum + Number(v.preco || 0), 0);
    const averageTicket = vendas.length > 0 ? totalValue / vendas.length : 0;

    setStats({
      todayTotal,
      todaySales: vendasHoje.length,
      weekTotal,
      weekSales: vendasSemana.length,
      monthTotal,
      monthSales: vendasMes.length,
      totalTransactions: vendas.length,
      averageTicket
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

    const totalSales = Object.values(mikrotikStats).reduce((sum, stat) => sum + stat.sales, 0);

    const top = Object.entries(mikrotikStats)
      .map(([name, stats]) => ({
        name,
        sales: stats.sales,
        transactions: stats.transactions,
        percentage: totalSales > 0 ? (stats.sales / totalSales) * 100 : 0
      }))
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
    setSuccess('Funcionalidade de exportação será implementada em breve');
    log.info('Export to Excel requested');
  };

  const generatePDF = () => {
    setSuccess('Funcionalidade de PDF será implementada em breve');
    log.info('PDF generation requested');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDateRangeText = () => {
    switch (dateRange) {
      case 'today': return 'Hoje';
      case 'week': return 'Esta Semana';
      case 'month': return 'Este Mês';
      case 'custom': return startDate && endDate ? `${startDate} a ${endDate}` : 'Personalizado';
      case 'all': return 'Todos os Períodos';
      default: return 'Este Mês';
    }
  };

  if (loading && !salesData.length) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            Relatórios de Vendas
          </h1>
          <p className="text-gray-600 mt-1">
            Análise detalhada de performance e vendas - {getDateRangeText()}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2" onClick={fetchSalesData}>
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={exportToExcel}>
            <Download className="w-4 h-4" />
            Excel
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={generatePDF}>
            <FileText className="w-4 h-4" />
            PDF
          </Button>
        </div>
      </div>

      {/* Alert Messages */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Filtros de Relatório</CardTitle>
          <CardDescription>Configure os parâmetros para gerar relatórios personalizados</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateRange">Período</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Esta Semana</SelectItem>
                  <SelectItem value="month">Este Mês</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                  <SelectItem value="all">Todos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reportType">Tipo de Relatório</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de relatório" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">Geral</SelectItem>
                  <SelectItem value="mikrotiks">Por Mikrotik</SelectItem>
                  <SelectItem value="plans">Por Plano</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="startDate">Data Inicial</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={dateRange !== 'custom'}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endDate">Data Final</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={dateRange !== 'custom'}
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button onClick={handleFilter} className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Filter className="w-4 h-4" />
              Aplicar Filtros
            </Button>
            <Button variant="outline" onClick={clearFilters}>
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Period Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Vendas de Hoje</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.todayTotal)}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center mt-4 gap-2">
              <Badge variant="outline" className="text-blue-600">
                {stats.todaySales} transações
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Vendas da Semana</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.weekTotal)}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="flex items-center mt-4 gap-2">
              <Badge variant="outline" className="text-purple-600">
                {stats.weekSales} transações
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Vendas do Mês</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.monthTotal)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="flex items-center mt-4 gap-2">
              <Badge variant="outline" className="text-green-600">
                {stats.monthSales} transações
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total do Período</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.monthTotal)}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Transações</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalTransactions}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ticket Médio</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.averageTicket)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <LineChart className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Mikrotiks Ativos</p>
                <p className="text-2xl font-bold text-gray-900">{topMikrotiks.length}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sales Table */}
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Vendas Detalhadas ({salesData.length})
            </CardTitle>
            <CardDescription>
              Histórico completo de transações do período selecionado
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-100">
                  <TableHead className="font-semibold">Data</TableHead>
                  <TableHead className="font-semibold">Mikrotik</TableHead>
                  <TableHead className="font-semibold">Plano</TableHead>
                  <TableHead className="font-semibold">Valor</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesData.slice(0, 10).map((sale) => (
                  <TableRow key={sale.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        {formatDate(sale.data)}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Zap className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="text-sm font-medium">{sale.mikrotiks?.nome || 'N/A'}</span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <span className="text-sm text-gray-900">{sale.planos?.nome || 'N/A'}</span>
                    </TableCell>
                    
                    <TableCell>
                      <span className="font-bold text-green-600">{formatCurrency(sale.preco)}</span>
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                        Aprovado
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {salesData.length === 0 && (
              <div className="text-center py-12">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">Nenhuma venda encontrada</p>
                <p className="text-gray-400 text-sm mt-1">
                  Ajuste os filtros para ver mais dados
                </p>
              </div>
            )}
            
            {salesData.length > 10 && (
              <div className="p-4 border-t border-gray-100 text-center">
                <Button variant="outline" size="sm">
                  Ver todas as {salesData.length} vendas
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Mikrotiks */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Top Mikrotiks
            </CardTitle>
            <CardDescription>
              Equipamentos com melhor performance
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {topMikrotiks.map((mikrotik, index) => (
              <div key={mikrotik.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{mikrotik.name}</p>
                    <p className="text-xs text-gray-500">{mikrotik.transactions} vendas</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{formatCurrency(mikrotik.sales)}</p>
                  <div className="flex items-center gap-1">
                    <Percent className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-500">{mikrotik.percentage.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            ))}
            
            {topMikrotiks.length === 0 && (
              <div className="text-center py-8">
                <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-sm">Nenhum dado disponível</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReportsManagement; 