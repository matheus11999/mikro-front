import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Key, DollarSign, BarChart3, TrendingUp, Calendar, Download, RefreshCw, Wallet, Radio, Users } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const ClientDashboard = () => {
  const [showPasswords, setShowPasswords] = useState(false);
  const [clientData, setClientData] = useState(null);
  const [userMikrotiks, setUserMikrotiks] = useState([]);
  const [salesHistory, setSalesHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      // Buscar o cliente logado
      const { data: clientes } = await supabase.from('clientes').select('*').limit(1);
      if (clientes && clientes.length > 0) {
        setClientData(clientes[0]);
        // Buscar mikrotiks do cliente
        const { data: mikrotiks } = await supabase.from('mikrotiks').select('*').eq('cliente_id', clientes[0].id);
        setUserMikrotiks(mikrotiks || []);
        // Buscar vendas do cliente (por mikrotik_id)
        let vendasCliente = [];
        for (const mk of mikrotiks || []) {
          const { data: vendas } = await supabase.from('vendas').select('*').eq('mikrotik_id', mk.id).eq('status', 'aprovado');
          vendasCliente = vendasCliente.concat(vendas || []);
        }
        setSalesHistory(vendasCliente);
      }
      setLoading(false);
    }
    fetchAll();
  }, []);

  // Calcular totais
  const totalPasswords = userMikrotiks.reduce((acc, mikrotik) => 
    acc + mikrotik.plans.reduce((planAcc, plan) => planAcc + plan.totalPasswords, 0), 0
  );
  
  const totalAvailable = userMikrotiks.reduce((acc, mikrotik) => 
    acc + mikrotik.plans.reduce((planAcc, plan) => planAcc + plan.available, 0), 0
  );
  
  const totalSold = userMikrotiks.reduce((acc, mikrotik) => 
    acc + mikrotik.plans.reduce((planAcc, plan) => planAcc + plan.sold, 0), 0
  );

  const monthlyStats = [
    { month: 'Jan', sales: 28, revenue: 420.50 },
    { month: 'Dez', sales: 35, revenue: 525.75 },
    { month: 'Nov', sales: 22, revenue: 330.25 },
    { month: 'Out', sales: 31, revenue: 465.30 }
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Dashboard do Cliente</h1>
          <p className="text-gray-600 mt-1">Bem-vindo, {clientData?.name}</p>
        </div>
        <div className="flex items-center gap-4 mt-4 lg:mt-0">
          <button className="btn-primary flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
          <div className="flex items-center bg-white px-3 py-2 rounded-lg shadow-sm border border-gray-200">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            <span className="text-gray-600 text-sm font-medium">Online</span>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Wallet className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-green-600 text-xs font-semibold">Disponível</span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">{clientData?.balance}</h3>
          <p className="text-gray-600 text-sm">Saldo Atual</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-blue-600 text-xs font-semibold">+12%</span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">{clientData?.totalSales}</h3>
          <p className="text-gray-600 text-sm">Vendas Totais</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-purple-600 text-xs font-semibold">+23%</span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">{clientData?.totalRevenue}</h3>
          <p className="text-gray-600 text-sm">Receita Total</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <Key className="w-4 h-4 text-orange-600" />
            </div>
            <span className="text-orange-600 text-xs font-semibold">{totalAvailable} Disponíveis</span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">{totalPasswords}</h3>
          <p className="text-gray-600 text-sm">Total de Senhas</p>
        </div>
      </div>

      {/* Meus Mikrotiks */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Radio className="w-5 h-5 text-blue-600" />
          Meus Mikrotiks
        </h2>
        
        <div className="space-y-6">
          {userMikrotiks.map((mikrotik) => (
            <div key={mikrotik.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <Radio className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{mikrotik.name}</h3>
                    <p className="text-sm text-gray-500">{mikrotik.providerName}</p>
                  </div>
                </div>
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                  {mikrotik.status}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {mikrotik.plans.map((plan, index) => (
                  <div key={index} className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-gray-900 text-sm">{plan.name}</h4>
                      <span className="text-sm font-bold text-green-600">{plan.price}</span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Disponíveis:</span>
                        <span className="font-semibold text-green-600">{plan.available}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Vendidas:</span>
                        <span className="font-semibold text-blue-600">{plan.sold}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total:</span>
                        <span className="font-bold text-gray-900">{plan.totalPasswords}</span>
                      </div>
                      <div className="flex justify-between border-t border-gray-200 pt-1">
                        <span className="text-gray-600">Receita:</span>
                        <span className="font-semibold text-purple-600">{plan.revenue}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Sales History */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                Histórico de Vendas
              </h2>
              <button className="btn-primary text-sm flex items-center gap-2">
                <Download className="w-4 h-4" />
                Exportar
              </button>
            </div>
            
            <div className="space-y-3">
              {salesHistory.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                      <DollarSign className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{sale.plan}</p>
                      <p className="text-xs text-gray-500">{sale.mikrotik}</p>
                      <p className="text-xs text-gray-400">{sale.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 text-sm">{sale.value}</p>
                    <p className="text-green-600 font-semibold text-xs">+{sale.profit}</p>
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      Concluída
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
            <div className="space-y-3">
              <button className="w-full btn-primary flex items-center justify-center gap-2 text-sm">
                <Wallet className="w-4 h-4" />
                Solicitar Saque
              </button>
              <button className="w-full btn-secondary flex items-center justify-center gap-2 text-sm">
                <Download className="w-4 h-4" />
                Baixar Relatório
              </button>
              <button className="w-full btn-secondary flex items-center justify-center gap-2 text-sm">
                <Calendar className="w-4 h-4" />
                Ver Histórico Completo
              </button>
            </div>
          </div>

          {/* Monthly Performance */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Performance Mensal
            </h3>
            <div className="space-y-3">
              {monthlyStats.map((stat, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600 font-medium text-sm">{stat.month}</span>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 text-sm">{stat.sales} vendas</p>
                    <p className="text-green-600 text-xs">R$ {stat.revenue.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Password Summary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo de Senhas</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Disponíveis</span>
                <span className="font-bold text-green-600">{totalAvailable}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Vendidas</span>
                <span className="font-bold text-gray-600">{totalSold}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Total</span>
                <span className="font-bold text-blue-600">{totalPasswords}</span>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Taxa de Conversão</span>
                  <span className="font-bold text-purple-600">
                    {((totalSold / totalPasswords) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
