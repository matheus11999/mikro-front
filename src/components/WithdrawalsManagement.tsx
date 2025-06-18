import React, { useState, useEffect } from 'react';
import { Wallet, Clock, CheckCircle, XCircle, Search, Filter, DollarSign, TrendingUp, Users } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const WithdrawalsManagement = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchWithdrawals() {
      setLoading(true);
      const { data, error } = await supabase.from('withdrawals').select('*');
      if (!error) setWithdrawals(data || []);
      setLoading(false);
    }
    fetchWithdrawals();
  }, []);

  const processWithdrawal = (id: number, action: 'approve' | 'reject') => {
    setWithdrawals(withdrawals.map(w => 
      w.id === id 
        ? { 
            ...w, 
            status: action === 'approve' ? 'completed' : 'rejected',
            processedDate: new Date().toISOString().split('T')[0]
          }
        : w
    ));
  };

  const filteredWithdrawals = withdrawals.filter(withdrawal => {
    const matchesSearch = withdrawal.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         withdrawal.pixKey.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || withdrawal.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = withdrawals.filter(w => w.status === 'pending').length;
  const completedCount = withdrawals.filter(w => w.status === 'completed').length;
  const totalPending = withdrawals
    .filter(w => w.status === 'pending')
    .reduce((sum, w) => sum + parseFloat(w.amount.replace('R$ ', '').replace(',', '.')), 0);

  return (
    <div className="p-4 lg:p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center">
            <Wallet className="w-7 h-7 mr-2 text-green-600" />
            Gerenciar Saques
          </h1>
          <p className="text-gray-600 mt-1">Processamento de solicitações de saque</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stats-card">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-xl font-bold text-gray-900">{pendingCount}</p>
              <p className="text-sm text-gray-600">Pendentes</p>
            </div>
          </div>
        </div>

        <div className="stats-card">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-xl font-bold text-gray-900">{completedCount}</p>
              <p className="text-sm text-gray-600">Processados</p>
            </div>
          </div>
        </div>

        <div className="stats-card">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-xl font-bold text-gray-900">R$ {totalPending.toFixed(2).replace('.', ',')}</p>
              <p className="text-sm text-gray-600">Valor Pendente</p>
            </div>
          </div>
        </div>

        <div className="stats-card">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-xl font-bold text-gray-900">{withdrawals.length}</p>
              <p className="text-sm text-gray-600">Total de Saques</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-group">
            <label className="form-label flex items-center gap-2">
              <Search className="w-4 h-4" />
              Buscar
            </label>
            <input
              type="text"
              placeholder="Digite nome do usuário ou chave PIX..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field"
            />
          </div>

          <div className="form-group">
            <label className="form-label flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">Todos os status</option>
              <option value="pending">Pendente</option>
              <option value="completed">Processado</option>
              <option value="rejected">Rejeitado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Withdrawals Table */}
      <div className="data-table">
        <div className="table-header">
          <h3 className="text-lg font-semibold text-gray-900">Solicitações de Saque ({filteredWithdrawals.length})</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuário</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chave PIX</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Solicitação</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredWithdrawals.map((withdrawal) => (
                <tr key={withdrawal.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="text-sm font-medium text-gray-900">{withdrawal.user}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">{withdrawal.amount}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded">
                      {withdrawal.pixKey}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      withdrawal.status === 'pending' 
                        ? 'bg-yellow-100 text-yellow-800'
                        : withdrawal.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {withdrawal.status === 'pending' ? 'Pendente' : 
                       withdrawal.status === 'completed' ? 'Processado' : 'Rejeitado'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(withdrawal.requestDate).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {withdrawal.status === 'pending' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => processWithdrawal(withdrawal.id, 'approve')}
                          className="btn-success text-xs px-3 py-1"
                        >
                          Aprovar
                        </button>
                        <button
                          onClick={() => processWithdrawal(withdrawal.id, 'reject')}
                          className="btn-danger text-xs px-3 py-1"
                        >
                          Rejeitar
                        </button>
                      </div>
                    )}
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

export default WithdrawalsManagement;
