import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Login from './components/Login';
import Layout from './components/Layout';
import AdminDashboard from './components/AdminDashboard';
import UsersManagement from './components/UsersManagement';
import MikrotiksManagement from './components/MikrotiksManagement';
import PasswordsManagement from './components/PasswordsManagement';
import MacsManagement from './components/MacsManagement';
import WithdrawalsManagement from './components/WithdrawalsManagement';
import ReportsManagement from './components/ReportsManagement';
import ClientDashboard from './components/ClientDashboard';
import ClientWithdrawals from './components/ClientWithdrawals';
import TestePix from './pages/TestePix';
import { supabase, testConnection, debugConfig } from './lib/supabaseClient';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutos
    },
  },
});

interface User {
  role: 'admin' | 'user';
  id: string;
  email: string;
}

// Componente de erro melhorado para falhas de conexão
const ConnectionError = ({ onRetry }: { onRetry: () => void }) => {
  const [showDebug, setShowDebug] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    setDebugInfo(debugConfig());
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-orange-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-r from-red-400/20 to-orange-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-gradient-to-r from-orange-400/20 to-yellow-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 text-center p-8 bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl max-w-2xl w-full">
        {/* Error Icon */}
        <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>

        <h2 className="text-3xl font-bold text-white mb-4">Erro de Conexão</h2>
        <p className="text-slate-300 text-lg mb-6">
          Não foi possível conectar ao servidor Supabase.
        </p>

        {/* Main error info */}
        <div className="bg-red-500/20 border border-red-500/30 rounded-2xl p-6 mb-6 text-left">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Possíveis Causas:
          </h3>
          <ul className="text-slate-200 space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
              Variáveis de ambiente não configuradas no EasyPanel
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
              Credenciais do Supabase incorretas
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
              Problema de conectividade com a internet
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
              Serviço Supabase temporariamente indisponível
            </li>
          </ul>
        </div>

        {/* Solution steps */}
        <div className="bg-blue-500/20 border border-blue-500/30 rounded-2xl p-6 mb-6 text-left">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Como Resolver (EasyPanel):
          </h3>
          <ol className="text-slate-200 space-y-2 text-sm">
            <li className="flex gap-3">
              <span className="text-blue-400 font-bold">1.</span>
              <div>
                <strong>Configure as variáveis de ambiente:</strong>
                <div className="mt-1 bg-slate-800/50 rounded-lg p-2 font-mono text-xs">
                  VITE_SUPABASE_URL=https://xxx.supabase.co<br />
                  VITE_SUPABASE_KEY=eyJhbGciOi...<br />
                  VITE_SUPABASE_SERVICE_ROLE=eyJhbGciOi...
                </div>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-400 font-bold">2.</span>
              <span>Reinicie o container no EasyPanel</span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-400 font-bold">3.</span>
              <span>Verifique se as credenciais do Supabase estão corretas</span>
            </li>
          </ol>
        </div>

        {/* Debug Info Toggle */}
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="text-slate-400 hover:text-white transition-colors text-sm mb-4 flex items-center gap-2 mx-auto"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {showDebug ? 'Ocultar' : 'Mostrar'} Informações de Debug
        </button>

        {/* Debug Info */}
        {showDebug && debugInfo && (
          <div className="bg-slate-800/50 border border-slate-600/30 rounded-2xl p-4 mb-6 text-left">
            <h4 className="text-white font-semibold mb-2 text-sm">Debug Info:</h4>
            <pre className="text-xs text-slate-300 overflow-x-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onRetry}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Tentar Novamente
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Recarregar Página
          </button>
        </div>

        {/* Footer */}
        <div className="mt-6 text-xs text-slate-500">
          PIX Mikro v2.1.0 • EasyPanel Deploy
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  const [appInitialized, setAppInitialized] = useState(false);

  // Função para inicializar a aplicação
  const initializeApp = async () => {
    try {
      setLoading(true);
      setConnectionError(false);

      console.log('🚀 Inicializando aplicação...');
      
      // Testar conexão com Supabase
      const isConnected = await testConnection();
      if (!isConnected) {
        console.error('❌ Falha no teste de conexão');
        throw new Error('Falha na conexão com Supabase');
      }

      console.log('✅ Aplicação inicializada com sucesso');
      setAppInitialized(true);
    } catch (error) {
      console.error('❌ Erro ao inicializar aplicação:', error);
      setConnectionError(true);
      setAppInitialized(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Verificar sessão atual
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erro ao verificar sessão:', error);
          if (mounted) {
            setUser(null);
          }
          return;
        }

        if (session?.user?.email && mounted) {
          // Buscar na tabela clientes (consistência com resto da app)
          try {
            const { data: clientes, error: clienteError } = await supabase
              .from('clientes')
              .select('id, role, email')
              .eq('email', session.user.email)
              .limit(1);

            if (clienteError) {
              console.warn('Cliente não encontrado na tabela clientes:', clienteError.message);
              // Se não encontrar na tabela clientes, considerar como admin
              setUser({
                role: 'admin',
                id: session.user.id,
                email: session.user.email
              });
              return;
            }

            if (clientes && clientes.length > 0) {
              setUser({
                role: clientes[0].role || 'user',
                id: clientes[0].id,
                email: clientes[0].email
              });
            } else {
              // Se não encontrar na tabela clientes, considerar como admin
              setUser({
                role: 'admin',
                id: session.user.id,
                email: session.user.email
              });
            }
          } catch (dbError) {
            console.error('Erro ao buscar dados do usuário:', dbError);
            // Em caso de erro de DB, ainda permitir login como admin
            setUser({
              role: 'admin',
              id: session.user.id,
              email: session.user.email
            });
          }
        } else if (mounted) {
          setUser(null);
        }
      } catch (error) {
        console.error('Erro inesperado ao verificar sessão:', error);
        if (mounted) {
          setUser(null);
        }
      }
    };

    // Inicializar app e verificar sessão
    const initialize = async () => {
      await initializeApp();
      if (appInitialized) {
        await checkSession();
      }
    };

    initialize();

    // Escutar mudanças de autenticação apenas se app foi inicializada
    let subscription: any;
    if (appInitialized) {
      subscription = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth state changed:', event, session?.user?.email);
          
          if (event === 'SIGNED_OUT' || !session?.user?.email) {
            if (mounted) {
              setUser(null);
            }
            return;
          }

          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            try {
              const { data: clientes, error: clienteError } = await supabase
                .from('clientes')
                .select('id, role, email')
                .eq('email', session.user.email)
                .limit(1);

              if (clienteError) {
                console.warn('Cliente não encontrado na tabela clientes:', clienteError.message);
                // Se não encontrar na tabela clientes, considerar como admin
                if (mounted) {
                  setUser({
                    role: 'admin',
                    id: session.user.id,
                    email: session.user.email
                  });
                }
                return;
              }

              if (clientes && clientes.length > 0 && mounted) {
                setUser({
                  role: clientes[0].role || 'user',
                  id: clientes[0].id,
                  email: clientes[0].email
                });
              } else if (mounted) {
                // Se não encontrar na tabela clientes, considerar como admin
                setUser({
                  role: 'admin',
                  id: session.user.id,
                  email: session.user.email
                });
              }
            } catch (error) {
              console.error('Erro ao processar mudança de auth:', error);
              // Em caso de erro, ainda permitir login como admin
              if (mounted) {
                setUser({
                  role: 'admin',
                  id: session.user.id,
                  email: session.user.email
                });
              }
            }
          }
        }
      );
    }

    return () => {
      mounted = false;
      if (subscription) {
        subscription.data?.subscription?.unsubscribe();
      }
    };
  }, [appInitialized]);

  const handleLogin = async (userId: string, userRole: 'admin' | 'user') => {
    try {
      setLoading(true);
      const { data: { user: authUser }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Erro ao verificar usuário:', error);
        return;
      }

      if (authUser?.email) {
        setUser({
          role: userRole,
          id: userId,
          email: authUser.email
        });
      }
    } catch (error) {
      console.error('Erro no login:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Erro ao fazer logout:', error);
      }
      setUser(null);
    } catch (error) {
      console.error('Erro inesperado no logout:', error);
    } finally {
      setLoading(false);
    }
  };

  // Função para deletar usuário do Auth
  async function deleteUserFromAuth(email: string) {
    try {
      const { data: { users }, error } = await supabase.auth.admin.listUsers();
      if (error) {
        console.error('Erro ao listar usuários:', error);
        return;
      }
      
      const user = users.find(u => u.email === email);
      if (user) {
        const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
        if (deleteError) {
          console.error('Erro ao deletar usuário:', deleteError);
        }
      }
    } catch (error) {
      console.error('Erro inesperado ao deletar usuário:', error);
    }
  }

  // Mostrar erro de conexão
  if (connectionError) {
    return <ConnectionError onRetry={initializeApp} />;
  }

  // Loading inicial
  if (loading || !appInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-purple-200 border-b-purple-600 rounded-full animate-spin mx-auto opacity-60" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
          </div>
          <h3 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            {loading ? 'Carregando Sistema...' : 'Conectando ao Servidor...'}
          </h3>
          <p className="text-slate-600">
            {loading ? 'Preparando interface' : 'Testando conectividade Supabase'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          {!user ? (
            <Login onLogin={handleLogin} />
          ) : (
            <Layout userRole={user.role} onLogout={handleLogout}>
              <Routes>
                {user.role === 'admin' ? (
                  <>
                    <Route path="/dashboard" element={<AdminDashboard />} />
                    <Route path="/users" element={<UsersManagement />} />
                    <Route path="/mikrotiks" element={<MikrotiksManagement />} />
                    <Route path="/passwords" element={<PasswordsManagement />} />
                    <Route path="/macs" element={<MacsManagement />} />
                    <Route path="/withdrawals" element={<WithdrawalsManagement />} />
                    <Route path="/reports" element={<ReportsManagement />} />
                    <Route path="/TestePix" element={<TestePix />} />
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  </>
                ) : (
                  <>
                    <Route path="/user-dashboard" element={<ClientDashboard />} />
                    <Route path="/user-reports" element={<ReportsManagement />} />
                    <Route path="/user-withdrawals" element={<ClientWithdrawals />} />
                    <Route path="/" element={<Navigate to="/user-dashboard" replace />} />
                  </>
                )}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          )}
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
