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
import { supabase } from './lib/supabaseClient';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

interface User {
  role: 'admin' | 'user';
  id: string;
  email: string;
}

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
            setLoading(false);
          }
          return;
        }

        if (session?.user?.email) {
          const { data: clientes, error: clienteError } = await supabase
            .from('clientes')
            .select('id, role, email')
            .eq('email', session.user.email)
            .limit(1);

          if (clienteError) {
            console.error('Erro ao buscar cliente:', clienteError);
            if (mounted) {
              setUser(null);
              setLoading(false);
            }
            return;
          }

          if (clientes && clientes.length > 0 && mounted) {
            setUser({
              role: clientes[0].role || 'user',
              id: clientes[0].id,
              email: clientes[0].email
            });
          }
        } else if (mounted) {
          setUser(null);
        }
      } catch (error) {
        console.error('Erro inesperado:', error);
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkSession();

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (event === 'SIGNED_OUT' || !session?.user?.email) {
          if (mounted) {
            setUser(null);
            setLoading(false);
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
              console.error('Erro ao buscar cliente:', clienteError);
              return;
            }

            if (clientes && clientes.length > 0 && mounted) {
              setUser({
                role: clientes[0].role || 'user',
                id: clientes[0].id,
                email: clientes[0].email
              });
            }
          } catch (error) {
            console.error('Erro ao processar mudança de auth:', error);
          } finally {
            if (mounted) {
              setLoading(false);
            }
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogin = async () => {
    try {
      setLoading(true);
      const { data: { user: authUser }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Erro ao verificar usuário:', error);
        setLoading(false);
        return;
      }

      if (authUser?.email) {
        const { data: clientes, error: clienteError } = await supabase
          .from('clientes')
          .select('id, role, email')
          .eq('email', authUser.email)
          .limit(1);

        if (clienteError) {
          console.error('Erro ao buscar cliente:', clienteError);
          setLoading(false);
          return;
        }

        if (clientes && clientes.length > 0) {
          setUser({
            role: clientes[0].role || 'user',
            id: clientes[0].id,
            email: clientes[0].email
          });
        }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
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
