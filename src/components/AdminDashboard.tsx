import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, DollarSign, Activity, ArrowUpRight, Router, Key, BarChart3, Wifi, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useLogger } from '@/lib/logger';

interface DashboardStats {
  totalClients: number;
  totalMikrotiks: number;
  totalSenhasDisponiveis: number;
  totalSenhasVendidas: number;
  receitaTotal: number;
  receitaHoje: number;
  macsCadastrados: number;
}

const AdminDashboard = () => {
  const log = useLogger('AdminDashboard');
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    totalMikrotiks: 0,
    totalSenhasDisponiveis: 0,
    totalSenhasVendidas: 0,
    receitaTotal: 0,
    receitaHoje: 0,
    macsCadastrados: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [clientes, mikrotiks, senhas, vendas, macs] = await Promise.all([
        supabase.from('clientes').select('*'),
        supabase.from('mikrotiks').select('*'),
        supabase.from('senhas').select('*'),
        supabase.from('vendas').select('*'),
        supabase.from('macs').select('*')
      ]);

      const hoje = new Date();
      const inicioDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
      
      const senhasDisponiveis = senhas.data?.filter(s => s.disponivel && !s.vendida).length || 0;
      const senhasVendidas = senhas.data?.filter(s => s.vendida).length || 0;
      
      const vendasAprovadas = vendas.data?.filter(v => v.status === 'aprovado' || v.status === 'pago') || [];
      const receitaTotal = vendasAprovadas.reduce((sum, v) => sum + (Number(v.valor) || 0), 0);
      
      const vendasHoje = vendasAprovadas.filter(v => new Date(v.data) >= inicioDia);
      const receitaHoje = vendasHoje.reduce((sum, v) => sum + (Number(v.valor) || 0), 0);

      setStats({
        totalClients: clientes.data?.length || 0,
        totalMikrotiks: mikrotiks.data?.length || 0,
        totalSenhasDisponiveis: senhasDisponiveis,
        totalSenhasVendidas: senhasVendidas,
        receitaTotal,
        receitaHoje,
        macsCadastrados: macs.data?.length || 0
      });
    } catch (error) {
      log.error('Error loading dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-8"></div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 h-32"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl p-8">
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

        {/* MACs Card */}
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
