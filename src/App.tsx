import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import SupabaseDebug from './debug/SupabaseDebug';
import { supabase, testConnection, debugConfig } from './lib/supabaseClient';
import { logger, useLogger } from './lib/logger';
import './App.css';

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
  id: string;
  email: string;
  role: 'admin' | 'client';
  name?: string;
}

// Componente de erro melhorado com logs
function ErrorScreen({ error, onRetry }: { error: string; onRetry: () => void }) {
  const log = useLogger('ErrorScreen');
  
  useEffect(() => {
    log.mount({ error });
    log.error('Error screen displayed', { error, timestamp: new Date().toISOString() });
  }, [error]);

  const handleExportLogs = () => {
    log.info('Exporting logs for debugging');
    logger.exportLogs();
  };

  const handleViewLogs = () => {
    log.info('Opening console for log inspection');
    console.log('📋 Recent Error Logs:', logger.getErrorLogs());
    console.log('📋 Recent 5min Logs:', logger.getRecentLogs(5));
    alert('Logs exportados para o console! Abra F12 para ver.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 max-w-md w-full border border-white/20 shadow-2xl">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-white mb-4">Erro de Conexão</h1>
          <p className="text-gray-300 mb-6">{error}</p>
          
          <div className="space-y-3">
            <button
              onClick={onRetry}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              🔄 Tentar Novamente
            </button>
            
            <button
              onClick={handleViewLogs}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              📋 Ver Logs (Console)
            </button>
            
            <button
              onClick={handleExportLogs}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              📁 Exportar Logs
            </button>
          </div>

          <div className="mt-6 text-xs text-gray-400 space-y-1">
            <p>🔧 Para debug avançado:</p>
            <p>1. Abra F12 (Console)</p>
            <p>2. Digite: logger.getLogs()</p>
            <p>3. Procure por erros vermelhos 🔴</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente de loading melhorado com timeout
function LoadingScreen({ message = "Carregando..." }: { message?: string }) {
  const log = useLogger('LoadingScreen');
  const [loadingTime, setLoadingTime] = useState(0);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    log.mount({ message });
    const timerId = log.startTimer('loading-screen');
    
    // Monitorar tempo de loading
    const interval = setInterval(() => {
      setLoadingTime(prev => {
        const newTime = prev + 1;
        
        // Avisar se loading demorar muito
        if (newTime === 10) {
          log.warn('Long loading detected', { seconds: newTime, message });
        } else if (newTime === 30) {
          log.error('Very long loading detected', { seconds: newTime, message });
          setShowDebug(true);
        }
        
        return newTime;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      log.endTimer(timerId, 'loading-screen');
      log.unmount();
    };
  }, [message]);

  const handleForceDebug = () => {
    log.info('Force debug activated by user');
    setShowDebug(true);
    console.log('🔍 Debug Info:', {
      loadingTime,
      message,
      recentLogs: logger.getRecentLogs(2),
      errorLogs: logger.getErrorLogs()
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-blue-400 rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        </div>
        
        <h2 className="text-xl font-semibold text-white mb-2">{message}</h2>
        <p className="text-gray-400 mb-4">Tempo: {loadingTime}s</p>
        
        {(loadingTime > 5 || showDebug) && (
          <div className="mt-6 space-y-2">
            <button
              onClick={handleForceDebug}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              🔍 Debug Info
            </button>
            
            {showDebug && (
              <div className="mt-4 p-4 bg-black/50 rounded-lg text-left text-xs text-gray-300 max-w-md">
                <p>🔍 <strong>Debug Info:</strong></p>
                <p>⏱️ Loading há {loadingTime} segundos</p>
                <p>📍 Operação: {message}</p>
                <p>🔧 Abra F12 e digite: logger.getLogs()</p>
                <p>🔴 Errors: {logger.getErrorLogs().length}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const App = () => {
  const log = useLogger('App');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'connected' | 'failed'>('testing');

  // Função para inicializar aplicação com logs detalhados
  const initializeApp = async () => {
    const initTimerId = log.startTimer('app-initialization');
    
    try {
      log.info('Starting app initialization');
      setLoading(true);
      setError(null);
      setConnectionStatus('testing');

      // Passo 1: Testar conexão Supabase
      log.info('Step 1: Testing Supabase connection');
      const connectionOk = await testConnection();
      
      if (!connectionOk) {
        throw new Error('Falha na conexão com Supabase - verifique as variáveis de ambiente no EasyPanel');
      }
      
      log.info('Step 1 completed: Supabase connection OK');
      setConnectionStatus('connected');

      // Passo 2: Verificar sessão existente
      log.info('Step 2: Checking existing session');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        log.warn('Session check warning', sessionError);
        // Não é um erro fatal, continua sem usuário logado
      }

      if (session?.user) {
        log.info('Step 2 completed: Found existing session', { userId: session.user.id });
        
        // Passo 3: Buscar dados do usuário
        log.info('Step 3: Fetching user profile');
        const { data: profile, error: profileError } = await supabase
          .from('clientes')
          .select('id, email, role, nome')
          .eq('email', session.user.email)
          .single();

        if (profileError) {
          log.warn('Step 3: Profile not found in clientes table, treating as admin', profileError);
          // Se não encontrou na tabela clientes, considerar como admin de sistema
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            role: 'admin',
            name: session.user.email?.split('@')[0] // Nome baseado no email
          });
        } else {
          log.info('Step 3 completed: Profile loaded', { profile });
          setUser({
            id: profile.id.toString(),
            email: profile.email,
            role: profile.role === 'admin' ? 'admin' : 'client',
            name: profile.nome
          });
        }
      } else {
        log.info('Step 2 completed: No existing session found');
        setUser(null);
      }

      log.info('App initialization completed successfully');
      setError(null);
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido na inicialização';
      log.error('App initialization failed', { error: errorMsg, err });
      setError(errorMsg);
      setConnectionStatus('failed');
    } finally {
      setLoading(false);
      log.endTimer(initTimerId, 'app-initialization');
    }
  };

  // Configurar listener de auth com logs
  useEffect(() => {
    log.mount();
    log.info('Setting up auth state listener');

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      log.info('Auth state changed', { event, hasSession: !!session, userId: session?.user?.id });

      if (event === 'SIGNED_IN' && session?.user) {
        try {
          log.info('Processing sign in event');
          const { data: profile, error } = await supabase
            .from('clientes')
            .select('id, email, role, nome')
            .eq('email', session.user.email)
            .single();

          if (error) {
            log.warn('Profile not found in clientes table on sign in, treating as admin', error);
            // Se não encontrou na tabela clientes, considerar como admin de sistema
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              role: 'admin',
              name: session.user.email?.split('@')[0]
            });
          } else {
            log.info('Sign in completed successfully', { profile });
            setUser({
              id: profile.id.toString(),
              email: profile.email,
              role: profile.role === 'admin' ? 'admin' : 'client',
              name: profile.nome
            });
          }
        } catch (err) {
          log.error('Exception during sign in processing', err);
          setUser(null);
        }
      } else if (event === 'SIGNED_OUT') {
        log.info('Processing sign out event');
        setUser(null);
      }
    });

    // Inicializar app
    initializeApp();

    // Cleanup
    return () => {
      log.info('Cleaning up auth listener');
      subscription.unsubscribe();
      log.unmount();
    };
  }, []);

  // Função para lidar com login
  const handleLogin = async (userId: string, userRole: 'admin' | 'user') => {
    try {
      log.info('Processing login', { userId, userRole });
      
      // Buscar dados do usuário autenticado
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser) {
        log.error('Failed to get authenticated user', authError);
        return;
      }
      
      // Converter role se necessário e criar objeto User
      const mappedRole: 'admin' | 'client' = userRole === 'user' ? 'client' : 'admin';
      
      setUser({
        id: userId,
        email: authUser.email || '',
        role: mappedRole
      });
      
      log.info('Login successful', { userId, mappedRole });
    } catch (err) {
      log.error('Login processing failed', err);
    }
  };

  // Loading inicial
  if (loading) {
    const message = connectionStatus === 'testing' 
      ? 'Testando conexão...' 
      : 'Carregando aplicação...';
    return <LoadingScreen message={message} />;
  }

  // Erro de conexão
  if (error) {
    return <ErrorScreen error={error} onRetry={initializeApp} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Router>
          <Routes>
            <Route 
              path="/debug" 
              element={<SupabaseDebug />} 
            />
            <Route 
              path="/login" 
              element={user ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />} 
            />
            <Route 
              path="/*" 
              element={user ? (
                <Layout 
                  userRole={user.role === 'admin' ? 'admin' : 'user'} 
                  onLogout={() => setUser(null)}
                >
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
              ) : <Navigate to="/login" replace />} 
            />
          </Routes>
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
