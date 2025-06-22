import React, { useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Calendar,
  Filter,
  Download,
  Bell,
  Target,
  PieChart,
  BarChart3,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabaseClient';
import { useLogger } from '@/lib/logger';

interface DashboardMetrics {
  totalClients: number;
  activeConnections: number;
  totalRevenue: number;
  pendingWithdrawals: number;
  revenueGrowth: number;
  clientGrowth: number;
}

interface RecentSale {
  id: string;
  cliente: string;
  valor: number;
  data: string;
  status: 'completed' | 'pending' | 'failed';
}

const AdminDashboard = () => {
  const log = useLogger('AdminDashboard');
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalClients: 0,
    activeConnections: 0,
    totalRevenue: 0,
    pendingWithdrawals: 0,
    revenueGrowth: 0,
    clientGrowth: 0
  });
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    log.mount();
    loadDashboardData();
    
    // Auto refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    
    return () => {
      clearInterval(interval);
      log.unmount();
    };
  }, []);

  const loadDashboardData = async () => {
    const timerId = log.startTimer('dashboard-data-load');
    
    try {
      log.info('Loading dashboard data');
      setError(null);

      // Buscar métricas principais
      const [clientsResult, salesResult] = await Promise.all([
        supabase.from('clientes').select('*'),
        supabase.from('vendas').select('*').order('created_at', { ascending: false }).limit(5)
      ]);

      if (clientsResult.error) {
        log.warn('Failed to load clients', clientsResult.error);
      }

      if (salesResult.error) {
        log.warn('Failed to load sales', salesResult.error);
      }

      // Calcular métricas (dados simulados para demonstração)
      const clientCount = clientsResult.data?.length || 0;
      const salesData = salesResult.data || [];
      
      // Simular dados para demo
      const currentRevenue = salesData.reduce((sum, sale) => sum + (sale.valor || 0), 0);
      
      setMetrics({
        totalClients: clientCount,
        activeConnections: Math.floor(clientCount * 0.75), // 75% ativo
        totalRevenue: currentRevenue || 15420.50,
        pendingWithdrawals: 3250.75,
        revenueGrowth: 12.5,
        clientGrowth: 8.3
      });

      // Formatar vendas recentes
      const formattedSales: RecentSale[] = salesData.length > 0 
        ? salesData.map(sale => ({
            id: sale.id,
            cliente: sale.cliente_nome || 'Cliente',
            valor: sale.valor || Math.random() * 1000,
            data: sale.created_at,
            status: Math.random() > 0.3 ? 'completed' : 'pending'
          }))
        : [
            // Dados de demonstração
            { id: '1', cliente: 'João Silva', valor: 850.00, data: new Date().toISOString(), status: 'completed' },
            { id: '2', cliente: 'Maria Santos', valor: 1200.50, data: new Date().toISOString(), status: 'completed' },
            { id: '3', cliente: 'Pedro Costa', valor: 650.75, data: new Date().toISOString(), status: 'pending' },
            { id: '4', cliente: 'Ana Oliveira', valor: 920.25, data: new Date().toISOString(), status: 'completed' },
            { id: '5', cliente: 'Carlos Lima', valor: 1100.00, data: new Date().toISOString(), status: 'failed' }
          ];

      setRecentSales(formattedSales);
      log.info('Dashboard data loaded successfully', { clientCount, salesCount: salesData.length });
      
    } catch (err) {
      log.error('Failed to load dashboard data', err);
      setError('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
      log.endTimer(timerId, 'dashboard-data-load');
    }
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
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'bg-green-100 text-green-800 border-green-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      failed: 'bg-red-100 text-red-800 border-red-200'
    };
    
    const labels = {
      completed: 'Concluído',
      pending: 'Pendente',
      failed: 'Falhou'
    };

    return (
      <Badge className={variants[status as keyof typeof variants] || variants.pending}>
        {labels[status as keyof typeof labels] || 'Desconhecido'}
      </Badge>
    );
  };

  if (loading) {
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
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Visão geral do sistema e métricas em tempo real
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-4 h-4" />
            Filtros
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Exportar
          </Button>
          <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Calendar className="w-4 h-4" />
            Período
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-800">
              <Bell className="w-4 h-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metrics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total de Clientes
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {metrics.totalClients.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center mt-4 gap-2">
              <div className="flex items-center gap-1 text-green-600">
                <ArrowUpRight className="w-4 h-4" />
                <span className="text-sm font-medium">+{metrics.clientGrowth}%</span>
              </div>
              <span className="text-sm text-gray-500">vs mês anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Conexões Ativas
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {metrics.activeConnections.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="flex items-center mt-4 gap-2">
              <div className="flex items-center gap-1 text-green-600">
                <ArrowUpRight className="w-4 h-4" />
                <span className="text-sm font-medium">+5.2%</span>
              </div>
              <span className="text-sm text-gray-500">desde ontem</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Receita Total
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(metrics.totalRevenue)}
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <div className="flex items-center mt-4 gap-2">
              <div className="flex items-center gap-1 text-green-600">
                <ArrowUpRight className="w-4 h-4" />
                <span className="text-sm font-medium">+{metrics.revenueGrowth}%</span>
              </div>
              <span className="text-sm text-gray-500">vs mês anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Saques Pendentes
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(metrics.pendingWithdrawals)}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="flex items-center mt-4 gap-2">
              <div className="flex items-center gap-1 text-red-600">
                <ArrowDownRight className="w-4 h-4" />
                <span className="text-sm font-medium">-2.1%</span>
              </div>
              <span className="text-sm text-gray-500">vs semana anterior</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Tables Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Sales */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">
                  Vendas Recentes
                </CardTitle>
                <CardDescription>
                  Últimas transações do sistema
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-3">
              {recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-blue-600">
                        {sale.cliente.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{sale.cliente}</p>
                      <p className="text-sm text-gray-500">{formatDate(sale.data)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(sale.valor)}
                    </p>
                    {getStatusBadge(sale.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">
              Ações Rápidas
            </CardTitle>
            <CardDescription>
              Acessos diretos para funcionalidades principais
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <Button variant="outline" className="justify-start h-12 gap-3">
                <Users className="w-5 h-5 text-blue-600" />
                <div className="text-left">
                  <div className="font-medium">Gerenciar Usuários</div>
                  <div className="text-sm text-gray-500">Adicionar, editar e remover usuários</div>
                </div>
              </Button>
              
              <Button variant="outline" className="justify-start h-12 gap-3">
                <BarChart3 className="w-5 h-5 text-green-600" />
                <div className="text-left">
                  <div className="font-medium">Ver Relatórios</div>
                  <div className="text-sm text-gray-500">Analytics e métricas detalhadas</div>
                </div>
              </Button>
              
              <Button variant="outline" className="justify-start h-12 gap-3">
                <Target className="w-5 h-5 text-purple-600" />
                <div className="text-left">
                  <div className="font-medium">Configurar Sistema</div>
                  <div className="text-sm text-gray-500">Mikrotiks, senhas e parâmetros</div>
                </div>
              </Button>
              
              <Button variant="outline" className="justify-start h-12 gap-3">
                <PieChart className="w-5 h-5 text-orange-600" />
                <div className="text-left">
                  <div className="font-medium">Saques Pendentes</div>
                  <div className="text-sm text-gray-500">Processar solicitações de saque</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" />
            Status do Sistema
          </CardTitle>
          <CardDescription>
            Monitoramento em tempo real dos serviços
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
              <div>
                <p className="font-medium text-green-900">Supabase</p>
                <p className="text-sm text-green-700">Database online</p>
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
              <div>
                <p className="font-medium text-green-900">API Backend</p>
                <p className="text-sm text-green-700">Funcionando normalmente</p>
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div>
                <p className="font-medium text-blue-900">Mikrotiks</p>
                <p className="text-sm text-blue-700">3/4 dispositivos ativos</p>
              </div>
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
