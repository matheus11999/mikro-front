import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CreditCard, 
  BarChart3, 
  LogOut,
  Menu,
  X,
  DollarSign,
  TrendingUp,
  UserCheck,
  RefreshCw,
  Activity,
  Clock,
  CheckCircle,
  Router,
  Wifi,
  Calendar,
  Plus,
  Edit,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import ClientWithdrawals from './ClientWithdrawals';
import { MikrotikStatusBadge } from './MikrotikStatusBadge';
import { useMikrotikStatus } from '../hooks/useMikrotikStatus';

interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  name?: string;
}

interface ClientDashboardProps {
  user: User;
  onLogout: () => Promise<void>;
}

interface ClientStats {
  saldo: number;
  totalVendas: number;
  receitaTotal: number;
  mikrotiksAtivos: number;
  macsOnline: number;
  totalMacs: number;
  // Lucro do cliente por período
  lucroHoje: number;
  lucroSemana: number;
  lucroMes: number;
}

// Dashboard principal do cliente
function DashboardContent() {
  const [stats, setStats] = useState<ClientStats>({
    saldo: 0,
    totalVendas: 0,
    receitaTotal: 0,
    mikrotiksAtivos: 0,
    macsOnline: 0,
    totalMacs: 0,
    lucroHoje: 0,
    lucroSemana: 0,
    lucroMes: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [connectedMacs, setConnectedMacs] = useState<any[]>([]);
  const [salesStats, setSalesStats] = useState({
    vendasHoje: 0,
    valorHoje: 0,
    vendasSemana: 0,
    valorSemana: 0,
    vendasMes: 0,
    valorMes: 0
  });

  useEffect(() => {
    loadClientData();
  }, []);

  // Cleanup loading state when component unmounts
  useEffect(() => {
    return () => {
      setLoading(false);
    };
  }, []);

  const loadClientData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Carregando dados do cliente (VPS otimizado)...');

      // Timeout para VPS
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout ao carregar dados do cliente')), 10000)
      );

      const loadData = async () => {
        // Buscar dados do usuário atual de forma mais direta
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser?.email) {
          console.error('❌ Nenhum usuário autenticado');
          return;
        }

        // Buscar cliente diretamente por email
        const { data: cliente, error: clienteError } = await supabase
          .from('clientes')
          .select('*')
          .eq('email', authUser.email)
          .single();

        if (clienteError || !cliente) {
          console.error('❌ Cliente não encontrado:', clienteError);
          throw new Error('Cliente não encontrado no banco de dados');
        }


        return cliente;
      };

      const cliente = await Promise.race([loadData(), timeout]);

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

      // Carregar dados com timeout para VPS
      const dataTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout ao carregar dados das vendas')), 12000)
      );

      const loadAllData = Promise.all([
        supabase.from('mikrotiks').select('id, nome, status').eq('cliente_id', cliente.id).eq('status', 'Ativo'),
        supabase.from('vendas').select('preco, valor, mikrotik_id, status, data'),
        supabase.from('vendas').select('preco, valor, mikrotik_id, status, data').eq('status', 'aprovado').gte('data', inicioHoje.toISOString()),
        supabase.from('vendas').select('preco, valor, mikrotik_id, status, data').eq('status', 'aprovado').gte('data', inicioSemana.toISOString()),
        supabase.from('vendas').select('preco, valor, mikrotik_id, status, data').eq('status', 'aprovado').gte('data', inicioMes.toISOString()),
        supabase.from('macs').select('id, mikrotik_id, status'),
        supabase.from('vendas').select('*, mikrotiks(nome), planos(nome)').order('data', { ascending: false }).limit(10)
      ]);

      const results = await Promise.race([loadAllData, dataTimeout]) as any[];
      const [
        mikrotiksRes,
        vendasTodasRes,
        vendasHojeRes,
        vendasSemanaRes,
        vendasMesRes,
        macsRes,
        recentVendasRes
      ] = results;

      const saldo = parseFloat(cliente.saldo || '0');
      const mikrotiks = mikrotiksRes.data || [];
      const allVendasTodas = vendasTodasRes.data || [];
      const allVendasHoje = vendasHojeRes.data || [];
      const allVendasSemana = vendasSemanaRes.data || [];
      const allVendasMes = vendasMesRes.data || [];
      const allMacs = macsRes.data || [];
      const allRecentVendas = recentVendasRes.data || [];



      // Filtrar dados do usuário logado
      const userMikrotikIds = mikrotiks.map(m => m.id);
      
      const userVendasTodas = allVendasTodas.filter(venda => 
        userMikrotikIds.includes(venda.mikrotik_id)
      );
      
      const userVendasHoje = allVendasHoje.filter(venda => 
        userMikrotikIds.includes(venda.mikrotik_id)
      );
      
      const userVendasSemana = allVendasSemana.filter(venda => 
        userMikrotikIds.includes(venda.mikrotik_id)
      );
      
      const userVendasMes = allVendasMes.filter(venda => 
        userMikrotikIds.includes(venda.mikrotik_id)
      );
      
      const userMacs = allMacs.filter(mac => 
        userMikrotikIds.includes(mac.mikrotik_id)
      );
      
      const userRecentVendas = allRecentVendas.filter(venda => 
        userMikrotikIds.includes(venda.mikrotik_id)
      );



      // Calcular receita total e lucros por período (valor = parte do cliente)
      const receitaTotal = userVendasTodas.reduce((sum, v) => sum + parseFloat(v.preco || '0'), 0);
      const lucroHoje = userVendasHoje.reduce((sum, v) => sum + parseFloat(v.valor || '0'), 0);
      const lucroSemana = userVendasSemana.reduce((sum, v) => sum + parseFloat(v.valor || '0'), 0);
      const lucroMes = userVendasMes.reduce((sum, v) => sum + parseFloat(v.valor || '0'), 0);
      
      const totalMacs = userMacs.length;
      const macsConectados = userMacs.filter(mac => mac.status === 'conectado').length;

      // Calcular estatísticas de vendas
      const vendasHoje = userVendasHoje.length;
      const valorHoje = userVendasHoje.reduce((sum, v) => sum + parseFloat(v.preco || '0'), 0);
      const vendasSemana = userVendasSemana.length;
      const valorSemana = userVendasSemana.reduce((sum, v) => sum + parseFloat(v.preco || '0'), 0);
      const vendasMes = userVendasMes.length;
      const valorMes = userVendasMes.reduce((sum, v) => sum + parseFloat(v.preco || '0'), 0);

      // Buscar MACs conectados com detalhes
      const { data: macsDetalhados } = await supabase
        .from('macs')
        .select(`
          id,
          mac_address,
          status,
          connected_at,
          mikrotiks(nome)
        `)
        .in('mikrotik_id', userMikrotikIds)
        .eq('status', 'conectado')
        .order('connected_at', { ascending: false })
        .limit(10);

      setStats({
        saldo: saldo,
        totalVendas: userVendasTodas.length,
        receitaTotal: receitaTotal,
        mikrotiksAtivos: mikrotiks.length,
        macsOnline: macsConectados,
        totalMacs: totalMacs,
        lucroHoje: lucroHoje,
        lucroSemana: lucroSemana,
        lucroMes: lucroMes
      });

      setSalesStats({
        vendasHoje,
        valorHoje,
        vendasSemana,
        valorSemana,
        vendasMes,
        valorMes
      });

      setRecentSales(userRecentVendas);
      setConnectedMacs(macsDetalhados || []);

    } catch (error: any) {
      console.error('❌ Erro ao carregar dados do dashboard (VPS):', error);
      
      // Em caso de erro, ainda mostrar interface básica
      setStats({
        saldo: 0,
        totalVendas: 0,
        receitaTotal: 0,
        mikrotiksAtivos: 0,
        macsOnline: 0,
        totalMacs: 0,
        lucroHoje: 0,
        lucroSemana: 0,
        lucroMes: 0
      });
      setRecentSales([]);
    } finally {
      // Garantir que loading seja sempre false no final
      setTimeout(() => setLoading(false), 100);
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
          <div className="bg-gray-200 rounded-lg h-64"></div>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <X className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Aprovado';
      case 'rejected':
        return 'Rejeitado';
      default:
        return 'Pendente';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-50';
      case 'rejected':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-yellow-600 bg-yellow-50';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Meu Dashboard</h1>
        <button
          onClick={loadClientData}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </button>
      </div>

      {/* Cards de Vendas por Período */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl shadow-sm border border-blue-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">Vendas Hoje</p>
              <p className="text-3xl font-bold text-blue-900">{salesStats.vendasHoje}</p>
              <p className="text-sm text-blue-700 mt-1">
                R$ {salesStats.valorHoje.toFixed(2)}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-200 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-700" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl shadow-sm border border-green-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">Vendas da Semana</p>
              <p className="text-3xl font-bold text-green-900">{salesStats.vendasSemana}</p>
              <p className="text-sm text-green-700 mt-1">
                R$ {salesStats.valorSemana.toFixed(2)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-200 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-green-700" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl shadow-sm border border-purple-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-800">Vendas do Mês</p>
              <p className="text-3xl font-bold text-purple-900">{salesStats.vendasMes}</p>
              <p className="text-sm text-purple-700 mt-1">
                R$ {salesStats.valorMes.toFixed(2)}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-200 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-700" />
            </div>
          </div>
        </div>
      </div>

      {/* Cards de estatísticas gerais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Saldo Disponível</p>
              <p className="text-2xl font-bold text-green-600">
                R$ {stats.saldo.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Disponível para saque
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
              <p className="text-sm font-medium text-gray-600">Meu Lucro</p>
              <p className="text-2xl font-bold text-green-600">R$ {stats.lucroHoje.toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-1">
                Valor creditado para você
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
              <p className="text-sm font-medium text-gray-600">MACs Conectados</p>
              <p className="text-2xl font-bold text-green-600">{stats.macsOnline}</p>
              <p className="text-xs text-gray-500 mt-1">
                De {stats.totalMacs} total
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Wifi className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">MikroTiks Ativos</p>
              <p className="text-2xl font-bold text-purple-600">{stats.mikrotiksAtivos}</p>
              <p className="text-xs text-gray-500 mt-1">
                Equipamentos online
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Router className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* MACs Conectados */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">MACs Conectados</h3>
        <div className="space-y-3">
          {connectedMacs.length > 0 ? (
            connectedMacs.map((mac, index) => (
              <div key={mac.id || index} className="flex items-center justify-between p-4 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Wifi className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 font-mono text-sm">
                      {mac.mac_address}
                    </p>
                    <p className="text-sm text-blue-600 font-medium">
                      {mac.mikrotiks?.nome || 'MikroTik'}
                    </p>
                    {mac.connected_at && (
                      <p className="text-xs text-gray-500">
                        Conectado: {new Date(mac.connected_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-2 py-1 rounded-full text-xs font-medium text-green-700 bg-green-100">
                    Online
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Wifi className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Nenhum MAC conectado</p>
              <p className="text-sm">MACs conectados aparecerão aqui</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Componente para gerenciar MikroTiks do cliente
function ClientMikrotiks() {
  const [mikrotiks, setMikrotiks] = useState<any[]>([]);
  const [planos, setPlanos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMikrotik, setEditingMikrotik] = useState<any>(null);
  const [editingPlano, setEditingPlano] = useState<any>(null);
  const [showPlanoModal, setShowPlanoModal] = useState(false);
  
  // Hook para status dos MikroTiks
  const { mikrotiks: mikrotiksStatus } = useMikrotikStatus();

  useEffect(() => {
    loadData();
  }, []);

  // Cleanup loading state when component unmounts
  useEffect(() => {
    return () => {
      setLoading(false);
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Buscar dados do usuário atual com fallback
      let userEmail = null;

      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        userEmail = authUser?.email;
      } catch (authError) {
        console.warn('⚠️ Erro ao buscar usuário via getUser():', authError);
      }

      // Fallback: tentar buscar da sessão
      if (!userEmail) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          userEmail = session?.user?.email;
        } catch (sessionError) {
          console.warn('⚠️ Erro ao buscar sessão:', sessionError);
        }
      }

      if (!userEmail) {
        console.error('❌ Nenhum usuário autenticado encontrado');
        setMikrotiks([]);
        setPlanos([]);
        return;
      }



      // Buscar cliente diretamente por email
      const { data: cliente, error: clienteError } = await supabase
        .from('clientes')
        .select('*')
        .eq('email', userEmail)
        .single();



      if (clienteError || !cliente) {
        console.error('❌ Cliente não encontrado:', clienteError);
        setMikrotiks([]);
        setPlanos([]);
        return;
      }



      // Buscar mikrotiks do cliente (sem order por enquanto para evitar erro de coluna)
      const { data: mikrotiks, error: mikrotiksError } = await supabase
        .from('mikrotiks')
        .select('*')
        .eq('cliente_id', cliente.id);



      if (mikrotiksError) {
        console.error('❌ Erro ao buscar mikrotiks:', mikrotiksError);
        setMikrotiks([]);
        setPlanos([]);
        return;
      }

      const mikrotiksData = mikrotiks || [];

      // Buscar planos para os mikrotiks encontrados
      let planosData = [];
      if (mikrotiksData.length > 0) {
        const mikrotiksIds = mikrotiksData.map(m => m.id);
        const { data: planos, error: planosError } = await supabase
          .from('planos')
          .select('*')
          .in('mikrotik_id', mikrotiksIds);



        if (!planosError) {
          planosData = planos || [];
        }
      }



      // Atualizar estados
      setMikrotiks(mikrotiksData);
      setPlanos(planosData);

    } catch (error) {
      console.error('❌ Erro geral ao carregar dados:', error);
      setMikrotiks([]);
      setPlanos([]);
    } finally {
      // Garantir que loading seja sempre false no final
      setTimeout(() => setLoading(false), 100);
    }
  };

  const updateMikrotikName = async (id: string, newName: string) => {
    try {
      const { error } = await supabase
        .from('mikrotiks')
        .update({ nome: newName })
        .eq('id', id);

      if (error) throw error;
      
      setMikrotiks(prev => prev.map(m => m.id === id ? { ...m, nome: newName } : m));
      setEditingMikrotik(null);
    } catch (error) {
      console.error('Erro ao atualizar nome:', error);
    }
  };

  // Função para converter tempo para minutos
  const convertToMinutes = (value: number, unit: string): number => {
    switch (unit) {
      case 'dias':
        return value * 24 * 60;
      case 'horas':
        return value * 60;
      case 'minutos':
      default:
        return value;
    }
  };

  // Função para converter minutos para a unidade apropriada para exibição
  const convertFromMinutes = (minutes: number): { value: number; unit: string } => {
    if (minutes >= 1440 && minutes % 1440 === 0) {
      return { value: minutes / 1440, unit: 'dias' };
    } else if (minutes >= 60 && minutes % 60 === 0) {
      return { value: minutes / 60, unit: 'horas' };
    } else {
      return { value: minutes, unit: 'minutos' };
    }
  };

  const savePlano = async (plano: any) => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      // Converter duração para minutos baseado na unidade selecionada
      const duracaoEmMinutos = convertToMinutes(
        parseInt(plano.duracao), 
        plano.unidadeTempo || 'minutos'
      );

      if (plano.id) {
        // Atualizar plano existente
        const { error } = await supabase
          .from('planos')
          .update({
            nome: plano.nome,
            preco: parseFloat(plano.preco),
            duracao: duracaoEmMinutos
          })
          .eq('id', plano.id);

        if (error) throw error;
      } else {
        // Criar novo plano
        const { error } = await supabase
          .from('planos')
          .insert({
            nome: plano.nome,
            preco: parseFloat(plano.preco),
            duracao: duracaoEmMinutos,
            mikrotik_id: plano.mikrotik_id
          });

        if (error) throw error;
      }

      // Recarregar dados após salvar
      await loadData();
      
      setShowPlanoModal(false);
      setEditingPlano(null);
    } catch (error) {
      console.error('Erro ao salvar plano:', error);
      alert('Erro ao salvar plano. Tente novamente.');
    }
  };

  const deletePlano = async (id: string) => {
    try {
      const { error } = await supabase
        .from('planos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setPlanos(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('Erro ao deletar plano:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-200 rounded-lg h-64"></div>
            <div className="bg-gray-200 rounded-lg h-64"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meus MikroTiks</h1>
          <p className="text-gray-600 mt-1">Gerencie seus equipamentos e planos de internet</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </button>
      </div>

      {/* MikroTiks com Planos Integrados - Grid 2 por linha */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {mikrotiks.length > 0 ? (
          mikrotiks.map((mikrotik) => {
            const mikrotiksPlanos = planos.filter(p => p.mikrotik_id === mikrotik.id);
            
            return (
              <div key={mikrotik.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                {/* Header do MikroTik - Reduzido */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Router className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        {editingMikrotik === mikrotik.id ? (
                          <input
                            type="text"
                            defaultValue={mikrotik.nome}
                            className="text-lg font-bold text-gray-900 bg-white border rounded px-2 py-1"
                            onBlur={(e) => updateMikrotikName(mikrotik.id, e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                updateMikrotikName(mikrotik.id, e.currentTarget.value);
                              }
                            }}
                            autoFocus
                          />
                        ) : (
                          <h3 className="text-lg font-bold text-gray-900">{mikrotik.nome}</h3>
                        )}
                        <div className="flex items-center space-x-3 mt-1">
                          <div className={`w-2 h-2 rounded-full ${mikrotik.status === 'Ativo' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <span className="text-sm font-medium text-gray-600">{mikrotik.status}</span>
                          
                          {/* Status de conexão */}
                          {(() => {
                            const statusData = mikrotiksStatus.find(s => s.id === mikrotik.id);
                            if (statusData) {
                              return (
                                <MikrotikStatusBadge
                                  isOnline={statusData.is_online}
                                  minutosOffline={statusData.minutos_offline}
                                  ultimoHeartbeat={statusData.ultimo_heartbeat}
                                  version={statusData.heartbeat_version}
                                  uptime={statusData.heartbeat_uptime}
                                  size="sm"
                                />
                              );
                            }
                            return null;
                          })()}
                        </div>
                        
                        {/* Informações de versão e uptime */}
                        {(() => {
                          const statusData = mikrotiksStatus.find(s => s.id === mikrotik.id);
                          if (statusData && (statusData.heartbeat_version || statusData.heartbeat_uptime)) {
                            return (
                              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                {statusData.heartbeat_version && (
                                  <div className="flex items-center gap-1">
                                    <Activity className="w-3 h-3 text-blue-500" />
                                    <span className="font-mono">{statusData.heartbeat_version}</span>
                                  </div>
                                )}
                                {statusData.heartbeat_uptime && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-green-500" />
                                    <span className="font-mono">{statusData.heartbeat_uptime}</span>
                                  </div>
                                )}
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditingMikrotik(editingMikrotik === mikrotik.id ? null : mikrotik.id)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Editar nome do MikroTik"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Planos do MikroTik */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-md font-semibold text-gray-900">Planos de Internet</h4>
                    <button
                      onClick={() => {
                        setEditingPlano({ nome: '', preco: '', duracao: '', unidadeTempo: 'horas', mikrotik_id: mikrotik.id });
                        setShowPlanoModal(true);
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Novo Plano
                    </button>
                  </div>
                  
                  {mikrotiksPlanos.length > 0 ? (
                    <div className="space-y-3">
                      {mikrotiksPlanos.map((plano) => {
                        const { value, unit } = convertFromMinutes(plano.duracao);
                        return (
                          <div key={plano.id} className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200 hover:border-green-300 hover:shadow-md transition-all duration-200">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-2">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <h5 className="font-semibold text-gray-900 truncate">{plano.nome}</h5>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <div className="flex items-center space-x-1">
                                      <DollarSign className="w-4 h-4 text-green-600" />
                                      <span className="text-lg font-bold text-green-600">
                                        {parseFloat(plano.preco || '0').toFixed(2)}
                                      </span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <Clock className="w-3 h-3 text-gray-500" />
                                      <span className="text-sm text-gray-600">
                                        {value} {unit}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <button
                                      onClick={() => {
                                        const { value, unit } = convertFromMinutes(plano.duracao);
                                        setEditingPlano({
                                          ...plano,
                                          duracao: value.toString(),
                                          unidadeTempo: unit
                                        });
                                        setShowPlanoModal(true);
                                      }}
                                      className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-100 rounded transition-colors"
                                      title="Editar plano"
                                    >
                                      <Edit className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (confirm('Tem certeza que deseja deletar este plano?')) {
                                          deletePlano(plano.id);
                                        }
                                      }}
                                      className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
                                      title="Deletar plano"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-1 text-xs text-green-700 bg-green-100 px-2 py-1 rounded mt-2">
                                  <TrendingUp className="w-3 h-3" />
                                  <span>R$ {(parseFloat(plano.preco || '0') / (plano.duracao / 60)).toFixed(2)}/hora</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="font-medium text-sm">Nenhum plano criado ainda</p>
                      <p className="text-xs">Clique em "Novo Plano" para criar o primeiro plano</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full bg-white rounded-xl shadow-sm border p-12 text-center">
            <Router className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum MikroTik vinculado</h3>
            <p className="text-gray-600 mb-4">
              Entre em contato com o administrador para vincular seus equipamentos ao seu usuário.
            </p>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-700">
                💡 <strong>Dica:</strong> Após a vinculação, você poderá criar e gerenciar planos de internet para cada equipamento.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modal para editar/criar plano */}
      {showPlanoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingPlano?.id ? 'Editar Plano' : 'Novo Plano'}
              {editingPlano?.mikrotik_id && (
                <span className="text-sm font-normal text-gray-600 ml-2">
                  - {mikrotiks.find(m => m.id === editingPlano.mikrotik_id)?.nome}
                </span>
              )}
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                savePlano({
                  id: editingPlano?.id,
                  nome: formData.get('nome'),
                  preco: formData.get('preco'),
                  duracao: formData.get('duracao'),
                  unidadeTempo: formData.get('unidadeTempo'),
                  mikrotik_id: formData.get('mikrotik_id')
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input
                  type="text"
                  name="nome"
                  defaultValue={editingPlano?.nome || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  name="preco"
                  defaultValue={editingPlano?.preco || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duração</label>
                  <input
                    type="number"
                    name="duracao"
                    defaultValue={editingPlano?.duracao || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
                  <select
                    name="unidadeTempo"
                    defaultValue={editingPlano?.unidadeTempo || 'horas'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="minutos">Minutos</option>
                    <option value="horas">Horas</option>
                    <option value="dias">Dias</option>
                  </select>
                </div>
              </div>
              {!editingPlano?.id && mikrotiks.length > 1 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">MikroTik</label>
                  <select
                    name="mikrotik_id"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    defaultValue={editingPlano?.mikrotik_id || ''}
                    required
                  >
                    <option value="">Selecione um MikroTik</option>
                    {mikrotiks.map((mikrotik) => (
                      <option key={mikrotik.id} value={mikrotik.id}>
                        {mikrotik.nome}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Campo hidden para mikrotik_id quando há apenas um MikroTik ou já está definido */}
              {(editingPlano?.mikrotik_id || mikrotiks.length === 1) && (
                <input
                  type="hidden"
                  name="mikrotik_id"
                  value={editingPlano?.mikrotik_id || mikrotiks[0]?.id || ''}
                />
              )}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPlanoModal(false);
                    setEditingPlano(null);
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Página de relatórios do cliente
function ClientReports() {
  const [salesData, setSalesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [statusFilter, setStatusFilter] = useState('all');
  const [mikrotikFilter, setMikrotikFilter] = useState('all');
  const [mikrotiks, setMikrotiks] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalVendas: 0,
    valorTotal: 0,
    lucroTotal: 0,
    vendasAprovadas: 0,
    vendasPendentes: 0,
    vendasRejeitadas: 0,
    ticketMedio: 0
  });

  useEffect(() => {
    loadReportsData();
  }, [dateRange]);

  // Cleanup loading state when component unmounts
  useEffect(() => {
    return () => {
      setLoading(false);
    };
  }, []);

  const loadReportsData = async () => {
    try {
      setLoading(true);
      setError('');

      // Buscar dados do usuário atual
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        setError('Sessão expirada. Por favor, faça login novamente.');
        setLoading(false);
        return;
      }

      // Buscar cliente por email
      const { data: cliente, error: clienteError } = await supabase
        .from('clientes')
        .select('*')
        .eq('email', authUser.email)
        .single();

      if (clienteError || !cliente) {
        setError('Erro ao carregar dados do cliente');
        setLoading(false);
        return;
      }

      // Buscar MikroTiks do cliente
      const { data: mikrotiksData } = await supabase
        .from('mikrotiks')
        .select('id, nome')
        .eq('cliente_id', cliente.id);

      if (!mikrotiksData || mikrotiksData.length === 0) {
        setSalesData([]);
        setStats({
          totalVendas: 0,
          valorTotal: 0,
          lucroTotal: 0,
          vendasAprovadas: 0,
          vendasPendentes: 0,
          vendasRejeitadas: 0,
          ticketMedio: 0
        });
        setLoading(false);
        return;
      }

      setMikrotiks(mikrotiksData);
      const mikrotikIds = mikrotiksData.map(m => m.id);

      // Construir query com filtros de data
      let query = supabase
        .from('vendas')
        .select(`
          id,
          data,
          preco,
          valor,
          status,
          mikrotik_id,
          plano_id,
          mac_id
        `)
        .in('mikrotik_id', mikrotikIds)
        .order('data', { ascending: false });

      // Aplicar filtros de data
      if (dateRange === 'today') {
        const today = new Date().toISOString().split('T')[0];
        query = query.gte('data', today + 'T00:00:00').lte('data', today + 'T23:59:59');
      } else if (dateRange === 'week') {
        const agora = new Date();
        const inicioSemana = new Date(agora);
        const diaDaSemana = agora.getDay();
        const diasParaSegunda = diaDaSemana === 0 ? 6 : diaDaSemana - 1;
        inicioSemana.setDate(agora.getDate() - diasParaSegunda);
        inicioSemana.setHours(0, 0, 0, 0);
        query = query.gte('data', inicioSemana.toISOString());
      } else if (dateRange === 'month') {
        const inicioMes = new Date(selectedYear, selectedMonth, 1);
        const fimMes = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);
        query = query.gte('data', inicioMes.toISOString()).lte('data', fimMes.toISOString());
      } else if (dateRange === 'custom' && startDate && endDate) {
        query = query.gte('data', startDate + 'T00:00:00').lte('data', endDate + 'T23:59:59');
      }

      // Aplicar filtro de MikroTik
      if (mikrotikFilter !== 'all') {
        query = query.eq('mikrotik_id', mikrotikFilter);
      }

      const { data: vendasData, error: queryError } = await query;

      if (queryError) {
        setError('Erro ao carregar relatórios');
        console.error('Erro:', queryError);
        return;
      }

      // Buscar dados relacionados separadamente
      const vendas = vendasData || [];
      
      if (vendas.length === 0) {
        setSalesData([]);
        return;
      }

      const mikrotikIdsFromVendas = [...new Set(vendas.map(v => v.mikrotik_id))];
      const planoIdsFromVendas = [...new Set(vendas.map(v => v.plano_id))];
      const macIdsFromVendas = [...new Set(vendas.map(v => v.mac_id).filter(Boolean))];

      const [mikrotiksRes, planosRes, macsRes] = await Promise.all([
        supabase.from('mikrotiks').select('id, nome').in('id', mikrotikIdsFromVendas),
        supabase.from('planos').select('id, nome, duracao').in('id', planoIdsFromVendas),
        macIdsFromVendas.length > 0 ? 
          supabase.from('macs').select('id, mac_address, primeiro_acesso').in('id', macIdsFromVendas) :
          Promise.resolve({ data: [] })
      ]);

      // Criar mapas para lookup rápido
      const mikrotiksMap = new Map((mikrotiksRes.data || []).map(m => [m.id, m]));
      const planosMap = new Map((planosRes.data || []).map(p => [p.id, p]));
      const macsMap = new Map((macsRes.data || []).map(m => [m.id, m]));

      // Combinar dados
      let vendasComDados = vendas.map(venda => ({
        ...venda,
        mikrotiks: mikrotiksMap.get(venda.mikrotik_id),
        planos: planosMap.get(venda.plano_id),
        macs: macsMap.get(venda.mac_id)
      }));

      // Aplicar filtro de status
      if (statusFilter !== 'all') {
        vendasComDados = vendasComDados.filter(venda => venda.status === statusFilter);
      }

      // Calcular estatísticas
      const totalVendas = vendasComDados.length;
      const valorTotal = vendasComDados.reduce((sum, v) => sum + parseFloat(v.preco || '0'), 0);
      const lucroTotal = vendasComDados.reduce((sum, v) => sum + parseFloat(v.valor || '0'), 0);
      const vendasAprovadas = vendasComDados.filter(v => v.status === 'aprovado').length;
      const vendasPendentes = vendasComDados.filter(v => v.status === 'pendente').length;
      const vendasRejeitadas = vendasComDados.filter(v => ['rejeitado', 'cancelado', 'expirado'].includes(v.status)).length;
      const ticketMedio = totalVendas > 0 ? valorTotal / totalVendas : 0;

      setStats({
        totalVendas,
        valorTotal,
        lucroTotal,
        vendasAprovadas,
        vendasPendentes,
        vendasRejeitadas,
        ticketMedio
      });

      setSalesData(vendasComDados);

    } catch (err) {
      console.error('Erro ao carregar relatórios:', err);
      setError('Erro ao carregar dados');
    } finally {
      // Garantir que loading seja sempre false no final
      setTimeout(() => setLoading(false), 100);
    }
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aprovado':
        return (
          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
            ✅ Aprovado
          </span>
        );
      case 'pendente':
        return (
          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
            ⏳ Pendente
          </span>
        );
      case 'processando':
        return (
          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
            🔄 Processando
          </span>
        );
      case 'autorizado':
        return (
          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">
            🔒 Autorizado
          </span>
        );
      case 'rejeitado':
        return (
          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
            ❌ Rejeitado
          </span>
        );
      case 'cancelado':
        return (
          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
            🚫 Cancelado
          </span>
        );
      case 'expirado':
        return (
          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
            ⏰ Expirado
          </span>
        );
      case 'reembolsado':
        return (
          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
            ↩️ Reembolsado
          </span>
        );
      case 'chargeback':
        return (
          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
            ⚠️ Chargeback
          </span>
        );
      default:
        return (
          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
            ❓ {status || 'Desconhecido'}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="bg-gray-200 rounded-lg h-64"></div>
        </div>
      </div>
    );
  }

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relatórios de Vendas</h1>
          <p className="text-gray-600 mt-1">
            {salesData.length} venda{salesData.length !== 1 ? 's' : ''} encontrada{salesData.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={loadReportsData}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Vendas</p>
              <p className="text-2xl font-bold text-blue-600">{stats.totalVendas}</p>
              <p className="text-xs text-gray-500 mt-1">Quantidade de vendas</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Valor Total</p>
              <p className="text-2xl font-bold text-green-600">R$ {stats.valorTotal.toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-1">Preço total dos planos vendidos</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Lucro Total</p>
              <p className="text-2xl font-bold text-purple-600">R$ {stats.lucroTotal.toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-1">Sua parte das vendas</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Status das Vendas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-green-50 rounded-xl border border-green-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">Vendas Aprovadas</p>
              <p className="text-2xl font-bold text-green-900">{stats.vendasAprovadas}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-800">Vendas Pendentes</p>
              <p className="text-2xl font-bold text-yellow-900">{stats.vendasPendentes}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-red-50 rounded-xl border border-red-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-800">Vendas Rejeitadas</p>
              <p className="text-2xl font-bold text-red-900">{stats.vendasRejeitadas}</p>
            </div>
            <X className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Período</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="today">Hoje</option>
              <option value="week">Esta semana</option>
              <option value="month">Mês específico</option>
              <option value="custom">Período personalizado</option>
            </select>
          </div>

          {dateRange === 'month' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mês</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {months.map((month, index) => (
                    <option key={index} value={index}>{month}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ano</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </>
          )}
          
          {dateRange === 'custom' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data inicial</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data final</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos os status</option>
              <option value="aprovado">Aprovado</option>
              <option value="pendente">Pendente</option>
              <option value="processando">Processando</option>
              <option value="rejeitado">Rejeitado</option>
              <option value="cancelado">Cancelado</option>
              <option value="expirado">Expirado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">MikroTik</label>
            <select
              value={mikrotikFilter}
              onChange={(e) => setMikrotikFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos os MikroTiks</option>
              {mikrotiks.map(mikrotik => (
                <option key={mikrotik.id} value={mikrotik.id}>{mikrotik.nome}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabela de vendas */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data/Hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  MikroTik
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plano
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  MAC Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {salesData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhuma venda encontrada</p>
                    <p className="text-gray-400 text-sm mt-1">
                      Vendas aparecerão aqui quando estiverem disponíveis
                    </p>
                  </td>
                </tr>
              ) : (
                salesData.map((venda) => {
                  return (
                    <tr key={venda.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(venda.data)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Router className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">
                            {venda.mikrotiks?.nome || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{venda.planos?.nome || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{venda.planos?.duracao || 0} min</div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono text-gray-900">
                          {venda.macs?.mac_address || 'N/A'}
                        </div>
                        {venda.macs?.primeiro_acesso && (
                          <div className="text-xs text-gray-500">
                            1º acesso: {formatDate(venda.macs.primeiro_acesso)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-green-600">
                          R$ {parseFloat(venda.valor || '0').toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Plano: R$ {parseFloat(venda.preco || '0').toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(venda.status)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}
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

export default function ClientDashboard({ user, onLogout }: ClientDashboardProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Saques', href: '/withdrawals', icon: CreditCard },
    { name: 'MikroTiks', href: '/mikrotiks', icon: Router },
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
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-green-600 to-green-700">
            <div>
              <h2 className="text-xl font-bold text-white">{import.meta.env.VITE_APP_NAME || 'Pix Mikro'}</h2>
              <p className="text-green-100 text-sm">{import.meta.env.VITE_APP_DESCRIPTION || 'Sistema de Vendas WiFi'}</p>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-md text-green-100 hover:text-white hover:bg-green-500/20"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User info */}
          <div className="p-4 border-b bg-gradient-to-r from-gray-50 to-green-50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{user.name || user.email}</p>
                <p className="text-sm text-green-600 font-medium">Cliente</p>
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
                className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isActivePath(item.href)
                    ? 'bg-green-50 text-green-700 border-r-2 border-green-700 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className={`w-5 h-5 mr-3 ${isActivePath(item.href) ? 'text-green-600' : ''}`} />
                {item.name}
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
            <Route path="/" element={<DashboardContent />} />
            <Route path="/withdrawals" element={<ClientWithdrawals />} />
            <Route path="/mikrotiks" element={<ClientMikrotiks />} />
            <Route path="/reports" element={<ClientReports />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
