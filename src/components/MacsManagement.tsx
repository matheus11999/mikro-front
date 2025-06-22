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

interface Mac {
  id: string;
  mac_address: string;
  mikrotik_id: string;
  primeiro_acesso: string;
  ultimo_acesso: string;
  total_compras: number;
  total_gasto: number;
  status: 'conectado' | 'desconectado' | 'coletado';
}

interface Mikrotik {
  id: string;
  nome: string;
}

const MacsManagement = () => {
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
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [macsResult, mikrotiksResult] = await Promise.all([
        supabase.from('macs').select('*'),
        supabase.from('mikrotiks').select('id, nome').eq('status', 'Ativo')
      ]);
      
      if (macsResult.error) {
        console.error('Failed to fetch MACs', macsResult.error);
        throw macsResult.error;
      }
      
      if (mikrotiksResult.error) {
        console.error('Failed to fetch mikrotiks', mikrotiksResult.error);
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
      
    } catch (err) {
      console.error('Failed to fetch data', err);
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
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
    conectados: collectedMacs.filter(mac => mac.status === 'conectado').length,
    desconectados: collectedMacs.filter(mac => mac.status === 'desconectado').length,
    novosHoje: (() => {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      return collectedMacs.filter(mac => {
        const primeiroAcesso = new Date(mac.primeiro_acesso);
        primeiroAcesso.setHours(0, 0, 0, 0);
        return primeiroAcesso.getTime() === hoje.getTime();
      }).length;
    })(),
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
    const isConnected = status === 'conectado';
    const isDisconnected = status === 'desconectado';
    const isCollected = status === 'coletado';
    
    if (isConnected) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Conectado
        </Badge>
      );
    } else if (isDisconnected) {
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200">
          <AlertCircle className="w-3 h-3 mr-1" />
          Desconectado
        </Badge>
      );
    } else {
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-800 border-gray-200">
          <Clock className="w-3 h-3 mr-1" />
          Coletado
        </Badge>
      );
    }
  };

  const getDateRangeText = () => {
    switch (dateFilter) {
      case 'today': return 'Hoje';
      case 'week': return 'Últimos 7 dias';
      case 'month': return 'Último mês';
      default: return 'Todos os períodos';
    }
  };

  const handleExport = () => {
    setSuccess('Funcionalidade de exportação será implementada em breve');
  };

  if (loading && collectedMacs.length === 0) {
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

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de MACs</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Dispositivos registrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MACs Conectados</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.conectados}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? ((stats.conectados / stats.total) * 100).toFixed(1) : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Novos MACs Hoje</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.novosHoje}</div>
            <p className="text-xs text-muted-foreground">
              Primeiro acesso hoje
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Total</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {formatCurrency(stats.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalPurchases} compras realizadas
            </p>
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
              <Label htmlFor="dateFilter">Período de Acesso</Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os períodos</SelectItem>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Últimos 7 dias</SelectItem>
                  <SelectItem value="month">Último mês</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MACs Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Dispositivos MAC Coletados ({filteredMacs.length})
          </CardTitle>
          <CardDescription>
            Lista de dispositivos que acessaram o portal captivo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>MAC Address</TableHead>
                <TableHead>Mikrotik</TableHead>
                <TableHead>Primeiro Acesso</TableHead>
                <TableHead>Último Acesso</TableHead>
                <TableHead>Compras</TableHead>
                <TableHead>Total Gasto</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMacs.map((mac) => (
                <TableRow key={mac.id}>
                  <TableCell className="font-mono">
                    <div className="flex items-center gap-2">
                      <Wifi className="w-4 h-4 text-indigo-600" />
                      {mac.mac_address}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Router className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">
                        {mikrotikMap[mac.mikrotik_id] || 'Desconhecido'}
                      </span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      {formatDate(mac.primeiro_acesso)}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      {formatDate(mac.ultimo_acesso)}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4 text-purple-600" />
                      <span className="font-medium">{mac.total_compras || 0}</span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="font-semibold text-green-600">
                        {formatCurrency(Number(mac.total_gasto) || 0)}
                      </span>
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
                {searchTerm || selectedMikrotik !== 'all' || dateFilter !== 'all' 
                  ? 'Tente ajustar os filtros de busca' 
                  : 'Dispositivos aparecerão aqui conforme acessarem o portal'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MacsManagement;

