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
import ErrorBoundary from './components/ErrorBoundary';
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

// Componente de loading otimizado
function LoadingScreen({ message = "Carregando..." }: { message?: string }) {
  const log = useLogger('LoadingScreen');
  const [loadingTime, setLoadingTime] = useState(0);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    log.mount({ message });
    const timerId = log.startTimer('loading-screen');
    
    // Monitorar tempo de loading - reduzido para 5s
    const interval = setInterval(() => {
      setLoadingTime(prev => {
        const newTime = prev + 1;
        
        // Avisar mais cedo
        if (newTime === 5) {
          log.warn('Loading taking longer than expected', { seconds: newTime, message });
          setShowDebug(true);
        } else if (newTime === 15) {
          log.error('Very long loading detected', { seconds: newTime, message });
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
    console.log('🔍 Loading Debug Info:', {
      loadingTime,
      message,
      timestamp: new Date().toISOString(),
      url: window.location.href
    });
    
    // Informar usuário via alert também
    alert(`Debug: Loading há ${loadingTime}s. Verifique o console (F12) para mais detalhes.`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="text-center max-w-md w-full">
        {/* Spinner animado */}
        <div className="relative mb-6">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-blue-400 rounded-full animate-spin mx-auto" 
               style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}>
          </div>
        </div>
        
        {/* Texto principal */}
        <h2 className="text-xl font-semibold text-white mb-2">{message}</h2>
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          <p className="text-gray-400 text-sm">Tempo: {loadingTime}s</p>
        </div>
        
        {/* Debug info quando demora */}
        {loadingTime > 3 && (
          <div className="mt-6 space-y-3">
            {!showDebug && (
              <div className="text-yellow-400 text-sm">
                ⏳ Isso está demorando mais que o esperado...
              </div>
            )}
            
            {showDebug && (
              <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 text-sm">
                <div className="text-yellow-400 font-semibold mb-2">🔍 Debug Info:</div>
                <div className="text-gray-300 space-y-1 text-left">
                  <div>⏱️ Loading há {loadingTime} segundos</div>
                  <div>📍 Operação: {message}</div>
                  <div>🔧 Para mais detalhes, abra F12 (DevTools)</div>
                </div>
                
                <button
                  onClick={handleForceDebug}
                  className="mt-3 bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1.5 rounded text-xs transition-colors"
                >
                  Ver Console Debug
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Dicas para usuário */}
        {loadingTime > 10 && (
          <div className="mt-4 p-3 bg-red-900/30 border border-red-500/30 rounded-lg text-xs text-red-200">
            <p className="font-semibold">Problema detectado:</p>
            <p>1. Verifique sua conexão com a internet</p>
            <p>2. Acesse /debug para verificar configuração</p>
            <p>3. Recarregue a página se necessário</p>
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

      // Passo 1: Verificação rápida de configuração
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_KEY) {
        throw new Error('❌ Variáveis de ambiente Supabase não configuradas no EasyPanel');
      }

      // Passo 2: Teste de conexão com timeout
      log.info('Step 1: Testing Supabase connection (max 8s)');
      const connectionOk = await testConnection();
      
      if (!connectionOk) {
        log.warn('Connection test failed, but continuing...');
        // Não falha completamente - pode ser problema temporário de rede
      }
      
      log.info('Step 1 completed');
      setConnectionStatus('connected');

      // Passo 3: Verificar sessão existente (rápido)
      log.info('Step 2: Checking existing session');
      
      const sessionPromise = supabase.auth.getSession();
      const sessionResult = await Promise.race([
        sessionPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session timeout')), 5000)
        )
      ]);
      
      const { data: { session }, error: sessionError } = sessionResult as any;
      
      if (sessionError) {
        log.warn('Session check warning', sessionError);
        setUser(null);
      } else if (session?.user) {
        log.info('Step 2 completed: Found existing session', { userId: session.user.id });
        
        // Passo 4: Buscar dados do usuário (rápido, com fallback)
        log.info('Step 3: Fetching user profile');
        
        try {
          const profilePromise = supabase
            .from('clientes')
            .select('id, email, role, nome')
            .eq('email', session.user.email)
            .single();
            
          const profileResult = await Promise.race([
            profilePromise,
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Profile timeout')), 3000)
            )
          ]);
          
          const { data: profile, error: profileError } = profileResult as any;

          if (profileError) {
            log.warn('Step 3: Profile not found, treating as admin', profileError);
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              role: 'admin',
              name: session.user.email?.split('@')[0]
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
        } catch (profileErr) {
          log.warn('Profile fetch timeout, using fallback', profileErr);
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            role: 'admin',
            name: session.user.email?.split('@')[0]
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

      // Evitar loop infinito - só processar se não estivermos no loading inicial
      if (loading) {
        log.debug('Ignoring auth change during initial loading');
        return;
      }

      if (event === 'SIGNED_IN' && session?.user) {
        try {
          log.info('Processing sign in event');
          
          // Busca rápida do perfil com timeout
          const profilePromise = supabase
            .from('clientes')
            .select('id, email, role, nome')
            .eq('email', session.user.email)
            .single();
            
          const profileResult = await Promise.race([
            profilePromise,
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Profile timeout')), 2000)
            )
          ]);
          
          const { data: profile, error } = profileResult as any;

          if (error) {
            log.warn('Profile not found on sign in, treating as admin', error);
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
          log.warn('Sign in processing timeout or error, using fallback', err);
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            role: 'admin',
            name: session.user.email?.split('@')[0]
          });
        }
      } else if (event === 'SIGNED_OUT') {
        log.info('Processing sign out event');
        setUser(null);
      }
    });

    // Inicializar app apenas uma vez
    initializeApp();

    // Cleanup
    return () => {
      log.info('Cleaning up auth listener');
      subscription.unsubscribe();
      log.unmount();
    };
  }, []); // Dependency array vazio para executar apenas uma vez

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
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
};

export default App;
