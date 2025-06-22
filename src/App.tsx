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
import { supabase, testConnection } from './lib/supabaseClient';

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

// Componente de erro para falhas de conexão
const ConnectionError = ({ onRetry }: { onRetry: () => void }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
      <div className="text-red-500 text-6xl mb-4">⚠️</div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Erro de Conexão</h2>
      <p className="text-gray-600 mb-4">
        Não foi possível conectar ao servidor. Verifique sua conexão com a internet.
      </p>
      <button
        onClick={onRetry}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
      >
        Tentar Novamente
      </button>
    </div>
  </div>
);

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

      // Testar conexão com Supabase
      const isConnected = await testConnection();
      if (!isConnected) {
        throw new Error('Falha na conexão com Supabase');
      }

      setAppInitialized(true);
    } catch (error) {
      console.error('Erro ao inicializar aplicação:', error);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {loading ? 'Carregando...' : 'Conectando ao servidor...'}
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
