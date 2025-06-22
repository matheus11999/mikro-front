import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  Search, 
  Calendar, 
  MapPin, 
  ShoppingCart, 
  Clock, 
  Router, 
  DollarSign, 
  Filter,
  RefreshCw,
  Download,
  Activity,
  Users,
  BarChart3,
  AlertCircle,
  CheckCircle2
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

interface Mac {
  id: string;
  mac_address: string;
  mikrotik_id: string;
  primeiro_acesso: string;
  ultimo_acesso: string;
  total_compras: number;
  total_gasto: number;
  status: 'active' | 'inactive';
}

interface Mikrotik {
  id: string;
  nome: string;
}

const MacsManagement = () => {
  const log = useLogger('MacsManagement');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMikrotik, setSelectedMikrotik] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [collectedMacs, setCollectedMacs] = useState<Mac[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mikrotikList, setMikrotikList] = useState<Mikrotik[]>([]);
  const [mikrotikMap, setMikrotikMap] = useState<Record<string, string>>({});

  useEffect(() => {
    log.mount();
    fetchData();
    
    return () => {
      log.unmount();
    };
  }, []);

  const fetchData = async () => {
    const timerId = log.startTimer('fetch-data');
    
    try {
      log.info('Fetching MACs and mikrotiks data');
      setLoading(true);
      setError('');
      
      const [macsResult, mikrotiksResult] = await Promise.all([
        supabase.from('macs').select('*'),
        supabase.from('mikrotiks').select('id, nome')
      ]);
      
      if (macsResult.error) {
        log.error('Failed to fetch MACs', macsResult.error);
        throw macsResult.error;
      }
      
      if (mikrotiksResult.error) {
        log.error('Failed to fetch mikrotiks', mikrotiksResult.error);
        throw mikrotiksResult.error;
      }
      
      setCollectedMacs(macsResult.data || []);
      setMikrotikList(mikrotiksResult.data || []);
      
      // Create mikrotik map
      const map: Record<string, string> = {};
      (mikrotiksResult.data || []).forEach(m => { 
        map[m.id] = m.nome; 
      });
      setMikrotikMap(map);
      
      log.info('Data fetched successfully', { 
        macs: macsResult.data?.length, 
        mikrotiks: mikrotiksResult.data?.length 
      });
      
    } catch (err) {
      log.error('Failed to fetch data', err);
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
      log.endTimer(timerId, 'fetch-data');
    }
  };

  const filteredMacs = collectedMacs.filter(mac => {
    const macAddress = mac.mac_address || '';
    const mikrotikName = mikrotikMap[mac.mikrotik_id] || '';
    
    const matchesSearch = 
      macAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mikrotikName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesMikrotik = selectedMikrotik === 'all' || mac.mikrotik_id === selectedMikrotik;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const macDate = new Date(mac.ultimo_acesso);
      const now = new Date();
      
      switch (dateFilter) {
        case 'today':
          matchesDate = macDate.toDateString() === now.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = macDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          matchesDate = macDate >= monthAgo;
          break;
      }
    }
    
    return matchesSearch && matchesMikrotik && matchesDate;
  });

  const stats = {
    total: collectedMacs.length,
    active: collectedMacs.filter(mac => mac.status === 'active').length,
    totalPurchases: collectedMacs.reduce((sum, mac) => sum + (mac.total_compras || 0), 0),
    totalRevenue: collectedMacs.reduce((sum, mac) => sum + (Number(mac.total_gasto) || 0), 0),
    averageSpent: collectedMacs.length > 0 ? 
      collectedMacs.reduce((sum, mac) => sum + (Number(mac.total_gasto) || 0), 0) / collectedMacs.length : 0
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: Mac['status']) => {
    const isActive = status === 'active';
    return (
      <Badge 
        variant={isActive ? 'default' : 'secondary'}
        className={isActive ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'}
      >
        {isActive ? 'Ativo' : 'Inativo'}
      </Badge>
    );
  };

  const getDateRangeText = () => {
    switch (dateFilter) {
      case 'today': return 'Hoje';
      case 'week': return 'Esta Semana';
      case 'month': return 'Este Mês';
      case 'all': return 'Todos os Períodos';
      default: return 'Todos os Períodos';
    }
  };

  const handleExport = () => {
    setSuccess('Funcionalidade de exportação será implementada em breve');
    log.info('Export requested');
  };

  if (loading && collectedMacs.length === 0) {
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
            <Wifi className="w-8 h-8 text-indigo-600" />
            Gerenciamento de MACs
          </h1>
          <p className="text-gray-600 mt-1">
            Dispositivos que acessaram o portal - {getDateRangeText()}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-4 h-4" />
            Filtros
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={fetchData}>
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
            <Download className="w-4 h-4" />
            Exportar
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

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total de MACs
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Wifi className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  MACs Ativos
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.active}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="flex items-center mt-4 gap-2">
              <div className="flex items-center gap-1 text-green-600">
                <span className="text-sm font-medium">
                  {Math.round((stats.active / stats.total) * 100) || 0}% ativos
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total de Compras
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalPurchases}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-purple-600" />
              </div>
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
                  {formatCurrency(stats.totalRevenue)}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="flex items-center mt-4 gap-2">
              <div className="flex items-center gap-1 text-orange-600">
                <span className="text-sm font-medium">
                  {formatCurrency(stats.averageSpent)} médio
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Filtros de Dispositivos</CardTitle>
          <CardDescription>Configure os parâmetros para filtrar os dispositivos MAC</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar MAC ou Mikrotik</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Digite o MAC address ou nome do Mikrotik..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="mikrotik">Mikrotik</Label>
              <Select value={selectedMikrotik} onValueChange={setSelectedMikrotik}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um Mikrotik" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Mikrotiks</SelectItem>
                  {mikrotikList.map((mikrotik) => (
                    <SelectItem key={mikrotik.id} value={mikrotik.id}>
                      {mikrotik.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="period">Período</Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os períodos</SelectItem>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Esta semana</SelectItem>
                  <SelectItem value="month">Este mês</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MACs Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Wifi className="w-5 h-5" />
            Dispositivos Coletados ({filteredMacs.length})
          </CardTitle>
          <CardDescription>
            Lista completa de dispositivos que acessaram o portal captivo
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-100">
                <TableHead className="font-semibold">MAC Address</TableHead>
                <TableHead className="font-semibold">Mikrotik</TableHead>
                <TableHead className="font-semibold">Compras</TableHead>
                <TableHead className="font-semibold">Total Gasto</TableHead>
                <TableHead className="font-semibold">Último Acesso</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMacs.map((mac) => (
                <TableRow key={mac.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Wifi className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-mono font-bold text-gray-900">{mac.mac_address}</p>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          Primeiro: {formatDate(mac.primeiro_acesso)}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Router className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="font-medium text-gray-900">
                        {mikrotikMap[mac.mikrotik_id] || 'N/A'}
                      </span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-purple-500" />
                      <span className="font-bold text-gray-900">
                        {mac.total_compras || 0}
                      </span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <span className="font-bold text-green-600">
                      {formatCurrency(Number(mac.total_gasto || 0))}
                    </span>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      {formatDate(mac.ultimo_acesso)}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {getStatusBadge(mac.status)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredMacs.length === 0 && (
            <div className="text-center py-12">
              <Wifi className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">Nenhum dispositivo encontrado</p>
              <p className="text-gray-400 text-sm mt-1">
                {searchTerm || selectedMikrotik !== 'all' || dateFilter !== 'all' ? 
                  'Tente ajustar seus filtros' : 
                  'Nenhum dispositivo acessou o portal ainda'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MacsManagement;
