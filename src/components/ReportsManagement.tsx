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
  Percent,
  Router
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
  pagamento_gerado_em?: string;
  pagamento_aprovado_em?: string;
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
    initializeData();
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
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: cliente, error } = await supabase
        .from('clientes')
        .select('id, role')
        .eq('email', user.email)
        .single();

      if (error) {
        console.error('Failed to fetch user data', error);
        setError('Erro ao carregar dados do usuário');
        setLoading(false);
        return;
      }

      if (cliente) {
        setCurrentUser(cliente);
      }
    } catch (err) {
      console.error('Failed to get current user', err);
      setError('Erro ao carregar usuário');
      setLoading(false);
    }
  };

  const fetchSalesData = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      setError('');
      
      let query;

      if (currentUser.role === 'admin') {
        // Admin vê todas as vendas (aprovadas, pendentes, canceladas)
        query = supabase
          .from('vendas')
          .select(`
            *,
            planos!inner(nome),
            mikrotiks!inner(nome)
          `)
          .order('data', { ascending: false });
      } else {
        // Usuário normal: buscar vendas de todos os mikrotiks vinculados a ele
        const { data: userMikrotiks } = await supabase
          .from('mikrotiks')
          .select('id')
          .eq('cliente_id', currentUser.id);

        if (!userMikrotiks || userMikrotiks.length === 0) {
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

        query = supabase
          .from('vendas')
          .select(`
            *,
            planos!inner(nome),
            mikrotiks!inner(nome)
          `)
          .in('mikrotik_id', mikrotikIds)
          .order('data', { ascending: false });
      }

      // Aplicar filtros de data se necessário
      if (dateRange === 'today') {
        const today = new Date().toISOString().split('T')[0];
        query = query.gte('data', today + 'T00:00:00').lte('data', today + 'T23:59:59');
      } else if (dateRange === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        query = query.gte('data', weekAgo.toISOString());
      } else if (dateRange === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        query = query.gte('data', monthAgo.toISOString());
      } else if (dateRange === 'custom' && startDate && endDate) {
        query = query.gte('data', startDate + 'T00:00:00').lte('data', endDate + 'T23:59:59');
      }

      const { data, error } = await query;

      if (error) {
        console.error('Failed to fetch sales data', error);
        setError('Erro ao carregar dados de vendas');
        return;
      }

      setSalesData(data || []);
      calculateStats(data || []);
      calculateTopMikrotiks(data || []);
      
    } catch (err) {
      console.error('Failed to fetch sales data', err);
      setError('Erro ao carregar dados de vendas');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (vendas: Venda[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    // Apenas vendas aprovadas para cálculos de estatísticas
    const vendasAprovadas = vendas.filter(v => v.status === 'aprovado');
    
    const todayVendas = vendasAprovadas.filter(v => new Date(v.data) >= today);
    const weekVendas = vendasAprovadas.filter(v => new Date(v.data) >= weekAgo);
    const monthVendas = vendasAprovadas.filter(v => new Date(v.data) >= monthAgo);

    const totalRevenue = vendasAprovadas.reduce((sum, v) => sum + (v.preco || v.valor || 0), 0);

    setStats({
      todayTotal: todayVendas.reduce((sum, v) => sum + (v.preco || v.valor || 0), 0),
      todaySales: todayVendas.length,
      weekTotal: weekVendas.reduce((sum, v) => sum + (v.preco || v.valor || 0), 0),
      weekSales: weekVendas.length,
      monthTotal: monthVendas.reduce((sum, v) => sum + (v.preco || v.valor || 0), 0),
      monthSales: monthVendas.length,
      totalTransactions: vendasAprovadas.length,
      averageTicket: vendasAprovadas.length > 0 ? totalRevenue / vendasAprovadas.length : 0
    });
  };

  const calculateTopMikrotiks = (vendas: Venda[]) => {
    const mikrotikSales: Record<string, { name: string; sales: number; transactions: number }> = {};

    vendas.forEach(venda => {
      const mikrotikName = venda.mikrotiks?.nome || 'Desconhecido';
      if (!mikrotikSales[mikrotikName]) {
        mikrotikSales[mikrotikName] = { name: mikrotikName, sales: 0, transactions: 0 };
      }
      mikrotikSales[mikrotikName].sales += (venda.preco || venda.valor || 0);
      mikrotikSales[mikrotikName].transactions += 1;
    });

    const totalSales = Object.values(mikrotikSales).reduce((sum, m) => sum + m.sales, 0);

    const topList = Object.values(mikrotikSales)
      .map(m => ({
        ...m,
        percentage: totalSales > 0 ? (m.sales / totalSales) * 100 : 0
      }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);

    setTopMikrotiks(topList);
  };

  const handleFilter = () => {
    fetchSalesData();
  };

  const clearFilters = () => {
    setDateRange('month');
    setReportType('general');
    setStartDate('');
    setEndDate('');
    fetchSalesData();
  };

  const exportToExcel = () => {
    setSuccess('Funcionalidade de exportação para Excel será implementada em breve');
  };

  const generatePDF = () => {
    setSuccess('Funcionalidade de geração de PDF será implementada em breve');
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
      case 'week': return 'Últimos 7 dias';
      case 'month': return 'Último mês';
      case 'custom': return `${startDate} até ${endDate}`;
      default: return 'Todos os períodos';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aprovado':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Aprovado
          </Badge>
        );
      case 'pendente':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Pendente
          </Badge>
        );
      case 'cancelado':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Cancelado
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            {status}
          </Badge>
        );
    }
  };

  if (loading && !salesData.length) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
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
    <div className="p-6 max-w-7xl mx-auto space-y-6">
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
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Resumo Financeiro
            </CardTitle>
            <CardDescription>Métricas de performance de vendas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-600">Total de Transações</span>
              <span className="text-lg font-bold text-gray-900">{stats.totalTransactions}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-600">Ticket Médio</span>
              <span className="text-lg font-bold text-green-600">{formatCurrency(stats.averageTicket)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-600">Total Geral</span>
              <span className="text-lg font-bold text-blue-600">
                {formatCurrency(salesData.reduce((sum, v) => sum + (v.preco || v.valor || 0), 0))}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Top Mikrotiks
            </CardTitle>
            <CardDescription>Equipamentos com melhor performance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {topMikrotiks.map((mikrotik, index) => (
              <div key={mikrotik.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                    index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-400'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{mikrotik.name}</p>
                    <p className="text-sm text-gray-600">{mikrotik.transactions} transações</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">{formatCurrency(mikrotik.sales)}</p>
                  <p className="text-sm text-gray-600">{mikrotik.percentage.toFixed(1)}%</p>
                </div>
              </div>
            ))}
            
            {topMikrotiks.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Nenhum dado disponível</p>
                <p className="text-sm">Vendas aparecerão aqui quando disponíveis</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sales Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Transações Recentes</CardTitle>
          <CardDescription>Últimas vendas realizadas no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Mikrotik</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salesData.slice(0, 10).map((venda) => (
                <TableRow key={venda.id}>
                  <TableCell className="font-medium">
                    {formatDate(venda.data)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Router className="w-4 h-4 text-gray-400" />
                      {venda.mikrotiks?.nome || 'Desconhecido'}
                    </div>
                  </TableCell>
                  <TableCell>
                    {venda.planos?.nome || 'Desconhecido'}
                  </TableCell>
                  <TableCell className="font-semibold text-green-600">
                    {formatCurrency(venda.preco || venda.valor || 0)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(venda.status)}
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
                Vendas aparecerão aqui quando estiverem disponíveis
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsManagement; 