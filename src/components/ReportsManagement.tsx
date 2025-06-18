import React, { useState, useEffect } from 'react';
import { BarChart3, DollarSign, TrendingUp, Calendar, Download, FileText, Filter, Router } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const ReportsManagement = () => {
  const [dateRange, setDateRange] = useState('today');
  const [reportType, setReportType] = useState('general');
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSales() {
      setLoading(true);
      const { data, error } = await supabase.from('vendas').select('*');
      if (!error) setSalesData(data || []);
      setLoading(false);
    }
    fetchSales();
  }, []);

  // Estatísticas do dia
  const todaySales = salesData.filter(sale => sale.date.startsWith('2024-01-15'));
  const todayTotal = todaySales.reduce((sum, sale) => sum + parseFloat(sale.value.replace('R$ ', '').replace(',', '.')), 0);
  const todayProfit = todaySales.reduce((sum, sale) => sum + parseFloat(sale.profit.replace('R$ ', '').replace(',', '.')), 0);

  // Estatísticas da semana (últimos 7 dias)
  const weekSales = salesData.filter(sale => {
    const saleDate = new Date(sale.date.split(' ')[0]);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return saleDate >= weekAgo;
  });
  const weekTotal = weekSales.reduce((sum, sale) => sum + parseFloat(sale.value.replace('R$ ', '').replace(',', '.')), 0);
  const weekProfit = weekSales.reduce((sum, sale) => sum + parseFloat(sale.profit.replace('R$ ', '').replace(',', '.')), 0);

  // Estatísticas do mês
  const monthSales = salesData.filter(sale => sale.date.startsWith('2024-01'));
  const monthTotal = monthSales.reduce((sum, sale) => sum + parseFloat(sale.value.replace('R$ ', '').replace(',', '.')), 0);
  const monthProfit = monthSales.reduce((sum, sale) => sum + parseFloat(sale.profit.replace('R$ ', '').replace(',', '.')), 0);

  // Top Mikrotiks
  const mikrotikStats = salesData.reduce((acc, sale) => {
    if (!acc[sale.mikrotik]) {
      acc[sale.mikrotik] = { sales: 0, profit: 0, transactions: 0 };
    }
    acc[sale.mikrotik].sales += parseFloat(sale.value.replace('R$ ', '').replace(',', '.'));
    acc[sale.mikrotik].profit += parseFloat(sale.profit.replace('R$ ', '').replace(',', '.'));
    acc[sale.mikrotik].transactions += 1;
    return acc;
  }, {} as Record<string, { sales: number; profit: number; transactions: number }>);

  const topMikrotiks = Object.entries(mikrotikStats)
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 3);

  const summaryStats = {
    totalSales: `R$ ${monthTotal.toFixed(2)}`,
    totalProfit: `R$ ${monthProfit.toFixed(2)}`,
    totalTransactions: monthSales.length,
    successRate: `${Math.round((monthSales.filter(s => s.status === 'Pago').length / monthSales.length) * 100)}%`
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-600 mt-1">Análise detalhada de vendas e lucros</p>
        </div>
        <div className="flex gap-3 mt-4 lg:mt-0">
          <button className="btn-success flex items-center gap-2">
            <Download className="w-4 h-4" />
            Exportar Excel
          </button>
          <button className="btn-primary flex items-center gap-2">
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
              <option value="yesterday">Ontem</option>
              <option value="week">Esta Semana</option>
              <option value="month">Este Mês</option>
              <option value="custom">Personalizado</option>
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
            <input type="date" className="input-field" />
          </div>
          
          <div className="form-group">
            <label className="form-label">Data Final</label>
            <input type="date" className="input-field" />
          </div>
        </div>
        
        <div className="flex gap-3 mt-4">
          <button className="btn-primary flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtrar
          </button>
          <button className="btn-secondary">
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
              <span className="text-gray-600">Vendas:</span>
              <span className="font-bold text-gray-900">R$ {todayTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Lucro:</span>
              <span className="font-bold text-green-600">R$ {todayProfit.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Transações:</span>
              <span className="font-bold text-blue-600">{todaySales.length}</span>
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
              <span className="text-gray-600">Vendas:</span>
              <span className="font-bold text-gray-900">R$ {weekTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Lucro:</span>
              <span className="font-bold text-green-600">R$ {weekProfit.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Transações:</span>
              <span className="font-bold text-blue-600">{weekSales.length}</span>
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
              <span className="text-gray-600">Vendas:</span>
              <span className="font-bold text-gray-900">R$ {monthTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Lucro:</span>
              <span className="font-bold text-green-600">R$ {monthProfit.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Transações:</span>
              <span className="font-bold text-blue-600">{monthSales.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="stats-card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{summaryStats.totalSales}</h3>
          <p className="text-gray-600">Total de Vendas (Mês)</p>
        </div>

        <div className="stats-card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{summaryStats.totalProfit}</h3>
          <p className="text-gray-600">Lucro Total (Mês)</p>
        </div>

        <div className="stats-card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{summaryStats.totalTransactions}</h3>
          <p className="text-gray-600">Transações (Mês)</p>
        </div>

        <div className="stats-card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{summaryStats.successRate}</h3>
          <p className="text-gray-600">Taxa de Sucesso</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Table */}
        <div className="lg:col-span-2 data-table">
          <div className="table-header">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Vendas Detalhadas
            </h2>
          </div>

          <div className="divide-y divide-gray-100">
            {salesData.map((sale) => (
              <div key={sale.id} className="table-cell hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <Router className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{sale.mikrotik}</p>
                      <p className="text-sm text-gray-500">{sale.plan}</p>
                      <p className="text-xs text-gray-400">{sale.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{sale.value}</p>
                    <p className="text-green-600 font-semibold">+{sale.profit}</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      sale.status === 'Pago' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {sale.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Mikrotiks */}
        <div className="stats-card">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            Top Mikrotiks
          </h3>
          <div className="space-y-4">
            {topMikrotiks.map((mikrotik, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-900">{mikrotik.name}</p>
                  <p className="text-sm text-gray-500">{mikrotik.transactions} transações</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">R$ {mikrotik.sales.toFixed(2)}</p>
                  <p className="text-green-600 font-semibold">+R$ {mikrotik.profit.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsManagement;
