
import React, { useState } from 'react';
import { Wallet, Clock, CheckCircle, XCircle, Plus, Search, Filter, DollarSign } from 'lucide-react';

const ClientWithdrawals = () => {
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [pixKey, setPixKey] = useState('');
  
  // Histórico de saques apenas do usuário logado (João Silva)
  const userWithdrawals = [
    {
      id: 1,
      amount: 'R$ 150,00',
      pixKey: '11999999999',
      status: 'pending',
      requestDate: '2024-01-15',
      processedDate: null
    },
    {
      id: 2,
      amount: 'R$ 89,20',
      pixKey: 'joao@email.com',
      status: 'completed',
      requestDate: '2024-01-10',
      processedDate: '2024-01-11'
    },
    {
      id: 3,
      amount: 'R$ 203,75',
      pixKey: '11999999999',
      status: 'rejected',
      requestDate: '2024-01-05',
      processedDate: '2024-01-06'
    }
  ];

  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredWithdrawals = userWithdrawals.filter(withdrawal => {
    const matchesSearch = withdrawal.pixKey.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || withdrawal.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = userWithdrawals.filter(w => w.status === 'pending').length;
  const completedCount = userWithdrawals.filter(w => w.status === 'completed').length;
  const totalPending = userWithdrawals
    .filter(w => w.status === 'pending')
    .reduce((sum, w) => sum + parseFloat(w.amount.replace('R$ ', '').replace(',', '.')), 0);

  const handleRequestWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
    // Aqui seria feita a requisição para solicitar o saque
    console.log('Solicitando saque:', { amount: withdrawalAmount, pixKey });
    setShowRequestModal(false);
    setWithdrawalAmount('');
    setPixKey('');
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center">
            <Wallet className="w-7 h-7 mr-2 text-green-600" />
            Meus Saques
          </h1>
          <p className="text-gray-600 mt-1">Gerencie suas solicitações de saque</p>
        </div>
        <button 
          onClick={() => setShowRequestModal(true)}
          className="btn-primary flex items-center gap-2 mt-4 sm:mt-0"
        >
          <Plus className="w-4 h-4" />
          Solicitar Saque
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-lg font-bold text-gray-900">{pendingCount}</p>
              <p className="text-sm text-gray-600">Pendentes</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-lg font-bold text-gray-900">{completedCount}</p>
              <p className="text-sm text-gray-600">Processados</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-lg font-bold text-gray-900">R$ {totalPending.toFixed(2).replace('.', ',')}</p>
              <p className="text-sm text-gray-600">Valor Pendente</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-group">
            <label className="form-label flex items-center gap-2">
              <Search className="w-4 h-4" />
              Buscar
            </label>
            <input
              type="text"
              placeholder="Digite a chave PIX..."
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Histórico de Saques ({filteredWithdrawals.length})</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chave PIX</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Solicitação</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Processamento</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredWithdrawals.map((withdrawal) => (
                <tr key={withdrawal.id} className="hover:bg-gray-50 transition-colors">
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {withdrawal.processedDate ? new Date(withdrawal.processedDate).toLocaleDateString('pt-BR') : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Request Withdrawal Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-green-600" />
                Solicitar Saque
              </h2>
              <button 
                onClick={() => setShowRequestModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleRequestWithdrawal} className="space-y-4">
              <div className="form-group">
                <label className="form-label">Valor do Saque</label>
                <input 
                  type="text" 
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                  className="input-field" 
                  placeholder="Ex: 100,00" 
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Chave PIX</label>
                <input 
                  type="text" 
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  className="input-field" 
                  placeholder="CPF, telefone ou e-mail" 
                  required
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowRequestModal(false)} 
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary flex-1">
                  Solicitar Saque
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientWithdrawals;
