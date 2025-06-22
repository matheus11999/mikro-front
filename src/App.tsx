import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import ClientDashboard from './components/ClientDashboard';
import ErrorBoundary from './components/ErrorBoundary';
import { supabase, checkPersistedSession } from './lib/supabaseClient';
import { Wifi, AlertCircle, Loader2, Server } from 'lucide-react';
import './App.css';

interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  name?: string;
}

// Detectar ambiente VPS/EasyPanel
const isVPS = typeof window !== 'undefined' && (
  window.location.hostname !== 'localhost' && 
  window.location.hostname !== '127.0.0.1' &&
  !window.location.hostname.includes('.local')
);

const isEasyPanel = typeof window !== 'undefined' && (
  window.location.hostname.includes('.easypanel') ||
  window.location.port === '' // Produção geralmente não tem porta
);

// Configurações otimizadas para VPS
const VPS_CONFIG = {
  sessionTimeout: isVPS ? 8000 : 5000, // Mais tempo para VPS
  userLookupTimeout: isVPS ? 8000 : 5000,
  initTimeout: isVPS ? 15000 : 10000, // Mais tempo total para VPS
  retryDelay: isVPS ? 2000 : 1000,
  maxRetries: isVPS ? 2 : 1
};

function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center z-50">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl mb-6 shadow-lg">
          {isVPS ? <Server className="w-8 h-8 text-white" /> : <Wifi className="w-8 h-8 text-white" />}
        </div>
        <div className="flex items-center justify-center gap-3 mb-4">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          <h2 className="text-xl font-semibold text-gray-900">Carregando...</h2>
        </div>
        <p className="text-gray-600">
          {isVPS ? 'Conectando ao servidor...' : 'Verificando autenticação'}
        </p>
        {isEasyPanel && (
          <p className="text-xs text-blue-600 mt-2">🚀 EasyPanel</p>
        )}
      </div>
    </div>
  );
}

function ErrorScreen({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-red-200 p-8 max-w-md w-full">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Erro de Conexão</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          {isVPS && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                🌐 Ambiente: VPS/EasyPanel
                <br />
                Verifique as variáveis de ambiente
              </p>
            </div>
          )}
          <button
            onClick={onRetry}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    </div>
  );
}

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const initializingRef = useRef(false);
  const [shouldShowLogin, setShouldShowLogin] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Log ambiente na inicialização
  useEffect(() => {
    console.log('🌐 Ambiente detectado:', {
      isVPS,
      isEasyPanel,
      hostname: window.location.hostname,
      port: window.location.port,
      protocol: window.location.protocol,
      timeouts: VPS_CONFIG
    });
  }, []);

  // Função melhorada para verificar sessão persistida (otimizada para VPS)
  const checkPersistedSession = useCallback(async () => {
    try {
      console.log('🔍 Verificando sessão persistida (VPS otimizado)...');
      
      // Timeout maior para VPS
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout na verificação de sessão')), VPS_CONFIG.sessionTimeout)
      );
      
      const { data: { session }, error } = await Promise.race([
        sessionPromise,
        timeoutPromise
      ]) as any;

      if (error) {
        console.error('❌ Erro ao verificar sessão:', error);
        return null;
      }

      if (session?.user) {
        console.log('✅ Sessão encontrada:', session.user.email);
        
        // Verificar se a sessão não está expirada
        const now = new Date().getTime();
        const expiresAt = new Date(session.expires_at * 1000).getTime();
        
        if (expiresAt <= now) {
          console.log('⚠️ Sessão expirada, removendo...');
          await supabase.auth.signOut();
          return null;
        }
        
        return session;
      } else {
        console.log('📝 Nenhuma sessão persistida');
        return null;
      }
    } catch (err: any) {
      console.error('❌ Erro na verificação de sessão:', err);
      return null;
    }
  }, []);

  // Função para buscar dados do usuário baseado na sessão (otimizada para VPS)
  const fetchUserData = useCallback(async (session: any): Promise<User | null> => {
    try {
      console.log('🔍 Buscando dados do usuário (VPS):', session.user.email);
      
      // Timeout maior para VPS
      const userPromise = supabase
        .from('clientes')
        .select('id, email, role, nome')
        .eq('email', session.user.email)
        .single();
        
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout na busca do usuário')), VPS_CONFIG.userLookupTimeout)
      );
      
      const { data: userData, error } = await Promise.race([
        userPromise,
        timeoutPromise
      ]) as any;

      if (error) {
        console.error('❌ Erro ao buscar usuário:', error);
        return null;
      }

      if (!userData) {
        console.log('⚠️ Usuário não encontrado no banco de dados');
        return null;
      }

      console.log('✅ Usuário encontrado (VPS):', userData.email, userData.role);
      
      // Validar sessão
      const now = new Date().getTime();
      const sessionTime = new Date(session.expires_at).getTime();
      
      if (sessionTime <= now) {
        console.log('⚠️ Sessão expirada');
        return null;
      }

      console.log('✅ Sessão válida confirmada (VPS):', userData.email);
      
      return {
        id: userData.id,
        email: userData.email,
        role: userData.role,
        name: userData.nome
      };
    } catch (err: any) {
      console.error('❌ Erro ao buscar dados do usuário (VPS):', err);
      return null;
    }
  }, []);

  const initializeApp = useCallback(async () => {
    // Evitar múltiplas inicializações simultâneas
    if (initializingRef.current) {
      console.log('⏳ Inicialização já em andamento...');
      return;
    }

    try {
      initializingRef.current = true;
      setLoading(true);
      setError(null);
      setShouldShowLogin(false); // Não mostrar login durante inicialização

      console.log('🚀 Inicializando aplicação (VPS otimizado)...');

      // Timeout geral maior para VPS
      const initPromise = (async () => {
        // Usar a nova função de verificação de sessão
        const session = await checkPersistedSession();

        if (session?.user) {
          const userData = await fetchUserData(session);
          if (userData) {
            console.log('✅ Usuário autenticado (VPS):', userData.email, userData.role);
            setUser(userData);
            setShouldShowLogin(false);
          } else {
            console.log('⚠️ Sessão inválida, fazendo logout...');
            await supabase.auth.signOut();
            setUser(null);
            setShouldShowLogin(true);
          }
        } else {
          console.log('📝 Nenhuma sessão ativa');
          setUser(null);
          setShouldShowLogin(true);
        }
      })();

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout na inicialização da aplicação')), VPS_CONFIG.initTimeout)
      );

      await Promise.race([initPromise, timeoutPromise]);

      setInitialized(true);
      console.log('✅ Aplicação inicializada com sucesso (VPS)');

    } catch (err: any) {
      console.error('❌ Erro na inicialização:', err);
      
      // Retry automático para VPS (até 2 tentativas)
      if (retryCount < VPS_CONFIG.maxRetries && isVPS) {
        console.log(`🔄 Tentativa ${retryCount + 1}/${VPS_CONFIG.maxRetries} em ${VPS_CONFIG.retryDelay}ms...`);
        setRetryCount(prev => prev + 1);
        setTimeout(() => {
          initializingRef.current = false;
          initializeApp();
        }, VPS_CONFIG.retryDelay);
        return;
      }
      
      let errorMessage = 'Erro desconhecido';
      
      if (err.message?.includes('Timeout')) {
        errorMessage = isVPS 
          ? 'Timeout de conexão com o servidor. Verifique sua conexão de internet.'
          : 'Tempo limite de conexão excedido';
      } else if (err.message?.includes('Failed to fetch')) {
        errorMessage = isVPS
          ? 'Erro de rede. Verifique se o servidor está acessível.'
          : 'Erro de conexão com o servidor';
      } else if (err.message?.includes('variáveis')) {
        errorMessage = 'Configuração incompleta. Verifique as variáveis de ambiente no EasyPanel.';
      } else {
        errorMessage = err.message || 'Erro na inicialização da aplicação';
      }
      
      setError(errorMessage);
      setShouldShowLogin(false); // Não mostrar login em caso de erro
    } finally {
      setLoading(false);
      initializingRef.current = false;
    }
  }, [checkPersistedSession, fetchUserData, retryCount]);

  // Inicialização da aplicação
  useEffect(() => {
    if (!initialized && !initializingRef.current) {
      initializeApp();
    }
  }, [initialized, initializeApp]);

  // Listener para mudanças de visibilidade (otimizado para VPS)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && initialized && !user && !loading) {
        console.log('👁️ Página visível novamente, re-verificando sessão...');
        // Delay menor para VPS
        setTimeout(() => {
          if (!initializingRef.current) {
            initializeApp();
          }
        }, isVPS ? 500 : 1000);
      }
    };

    const handleFocus = () => {
      if (initialized && !user && !loading) {
        console.log('🎯 Foco retornado, verificando sessão...');
        setTimeout(() => {
          if (!initializingRef.current) {
            initializeApp();
          }
        }, isVPS ? 300 : 500);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [initialized, user, loading, initializeApp]);

  // Handler para login bem-sucedido
  const handleLogin = (userData: User) => {
    console.log('✅ Login realizado:', userData.email);
    setUser(userData);
    setShouldShowLogin(false);
    setError(null);
    setRetryCount(0); // Reset retry count
  };

  // Handler para logout
  const handleLogout = async () => {
    try {
      console.log('🚪 Fazendo logout...');
      
      // Limpar localStorage manualmente
      try {
        localStorage.removeItem('pix-mikro-auth-token');
        localStorage.removeItem('sb-zzfugxcsinasxrhcwvcp-auth-token');
        console.log('🗑️ localStorage limpo');
      } catch (storageError) {
        console.warn('⚠️ Erro ao limpar localStorage:', storageError);
      }
      
      // Fazer logout no Supabase
      await supabase.auth.signOut();
      
      // Resetar estados
      setUser(null);
      setShouldShowLogin(true);
      setInitialized(false);
      setRetryCount(0);
      
      console.log('✅ Logout realizado com sucesso');
      
      // Forçar reload da página para garantir limpeza completa
      setTimeout(() => {
        window.location.reload();
      }, 100);
      
    } catch (err) {
      console.error('❌ Erro no logout:', err);
      
      // Em caso de erro, forçar reload mesmo assim
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };

  // Handler para retry manual
  const handleRetry = () => {
    console.log('🔄 Retry manual solicitado');
    setError(null);
    setRetryCount(0);
    setInitialized(false);
    initializeApp();
  };

  // Renderização condicional
  if (error) {
    return <ErrorScreen error={error} onRetry={handleRetry} />;
  }

  if (loading || !initialized) {
    return <LoadingScreen />;
  }

  if (!user && shouldShowLogin) {
    return (
      <ErrorBoundary>
        <Login onLogin={handleLogin} />
      </ErrorBoundary>
    );
  }

  if (!user) {
    return <LoadingScreen />;
  }

  // Renderizar aplicação principal
  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route 
              path="/" 
              element={
                user.role === 'admin' ? (
                  <AdminDashboard user={user} onLogout={handleLogout} />
                ) : (
                  <ClientDashboard user={user} onLogout={handleLogout} />
                )
              } 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  );
};

export default App;
