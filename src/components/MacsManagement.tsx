import React, { useState, useEffect } from 'react';
import { Wifi, Search, Calendar, MapPin, ShoppingCart, Clock, Router, DollarSign, Filter } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const MacsManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMikrotik, setSelectedMikrotik] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [collectedMacs, setCollectedMacs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mikrotikList, setMikrotikList] = useState([]);
  const [mikrotikMap, setMikrotikMap] = useState({});

  useEffect(() => {
    async function fetchMacs() {
      setLoading(true);
      const { data, error } = await supabase.from('macs').select('*');
      if (!error) setCollectedMacs(data || []);
      setLoading(false);
    }
    fetchMacs();
  }, []);

  useEffect(() => {
    async function fetchMikrotiks() {
      const { data, error } = await supabase.from('mikrotiks').select('id, nome');
      if (!error) {
        setMikrotikList(data || []);
        const map = {};
        (data || []).forEach(m => { map[m.id] = m.nome; });
        setMikrotikMap(map);
      }
    }
    fetchMikrotiks();
  }, []);

  const mikrotiks = ['Mikrotik Central', 'Mikrotik Norte', 'Mikrotik Sul'];

  const filteredMacs = collectedMacs.filter(mac => {
    const macAddress = mac.mac_address || '';
    const mikrotikName = mikrotikMap[mac.mikrotik_id] || '';
    const matchesSearch = macAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mikrotikName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMikrotik = selectedMikrotik === 'all' || mikrotikName === selectedMikrotik;
    return matchesSearch && matchesMikrotik;
  });

  const totalMacs = collectedMacs.length;
  const activeMacs = collectedMacs.filter(mac => mac.status === 'active').length;
  const totalPurchases = collectedMacs.reduce((sum, mac) => sum + (mac.total_compras || 0), 0);
  const totalRevenue = collectedMacs.reduce((sum, mac) => sum + (Number(mac.total_gasto) || 0), 0);

  return (
    <div className="p-4 lg:p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center">
            <Wifi className="w-7 h-7 mr-2 text-indigo-600" />
            MACs Coletados
          </h1>
          <p className="text-gray-600 mt-1">Dispositivos que acessaram o captive portal</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stats-card">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Wifi className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-xl font-bold text-gray-900">{totalMacs}</p>
              <p className="text-sm text-gray-600">Total de MACs</p>
            </div>
          </div>
        </div>

        <div className="stats-card">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <MapPin className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-xl font-bold text-gray-900">{activeMacs}</p>
              <p className="text-sm text-gray-600">MACs Ativos</p>
            </div>
          </div>
        </div>

        <div className="stats-card">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-xl font-bold text-gray-900">{totalPurchases}</p>
              <p className="text-sm text-gray-600">Total de Compras</p>
            </div>
          </div>
        </div>

        <div className="stats-card">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-xl font-bold text-gray-900">R$ {totalRevenue.toFixed(2)}</p>
              <p className="text-sm text-gray-600">Receita Total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="form-group">
            <label className="form-label flex items-center gap-2">
              <Search className="w-4 h-4" />
              Buscar MAC ou Mikrotik
            </label>
            <input
              type="text"
              placeholder="Digite o MAC address ou nome do Mikrotik..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field"
            />
          </div>

          <div className="form-group">
            <label className="form-label flex items-center gap-2">
              <Router className="w-4 h-4" />
              Mikrotik
            </label>
            <select
              value={selectedMikrotik}
              onChange={(e) => setSelectedMikrotik(e.target.value)}
              className="input-field"
            >
              <option value="all">Todos os Mikrotiks</option>
              {mikrotikList.map((mikrotik) => (
                <option key={mikrotik.id} value={mikrotik.nome}>{mikrotik.nome}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Período
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">Todos os períodos</option>
              <option value="today">Hoje</option>
              <option value="week">Esta semana</option>
              <option value="month">Este mês</option>
            </select>
          </div>
        </div>
      </div>

      {/* MACs Table */}
      <div className="data-table">
        <div className="table-header">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Wifi className="w-5 h-5" />
            Dispositivos Coletados ({filteredMacs.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MAC Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mikrotik</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Compras</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Gasto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Último Acesso</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMacs.map((mac) => (
                <tr key={mac.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                        <Wifi className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-mono font-bold text-gray-900">{mac.mac_address}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Primeiro acesso: {mac.primeiro_acesso ? new Date(mac.primeiro_acesso).toLocaleDateString('pt-BR') : '-'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Router className="w-4 h-4 text-blue-600 mr-2" />
                      <span className="text-sm font-medium text-gray-900">{mikrotikMap[mac.mikrotik_id] || '-'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{mac.total_compras || 0} compras</p>
                      {mac.lastPurchase && (
                        <p className="text-xs text-blue-600">
                          Última: {mac.lastPlan} - {mac.lastValue}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-bold text-green-600">{mac.total_gasto || 0}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm text-gray-900">{mac.ultimo_acesso ? new Date(mac.ultimo_acesso).toLocaleDateString('pt-BR') : '-'}</p>
                    <p className="text-xs text-gray-500">{mac.ultimo_acesso ? new Date(mac.ultimo_acesso).toLocaleTimeString('pt-BR') : '-'}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      mac.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {mac.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MacsManagement;
