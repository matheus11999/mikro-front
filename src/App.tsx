import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import ClientDashboard from './components/ClientDashboard';
import ErrorBoundary from './components/ErrorBoundary';
import { supabase } from './lib/supabaseClient';
import { checkAndRestoreSession, saveUserData, performLogout, UserData } from './lib/authHelpers';
import { Wifi, AlertCircle, Loader2, Server } from 'lucide-react';
import './App.css';

// Usar UserData do authHelpers
type User = UserData;

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

  // Removidas funções antigas - agora usando authHelpers

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
      setShouldShowLogin(false);

      console.log('🚀 Inicializando aplicação (VPS otimizado)...');

      // Usar o novo sistema de autenticação
      const userData = await checkAndRestoreSession();
      
      if (userData) {
        console.log('✅ Usuário restaurado:', userData.email, userData.role);
        setUser(userData);
        setShouldShowLogin(false);
      } else {
        console.log('📝 Nenhuma sessão ativa');
        setUser(null);
        setShouldShowLogin(true);
      }

      setInitialized(true);
      console.log('✅ Aplicação inicializada com sucesso');

    } catch (err: any) {
      console.error('❌ Erro na inicialização:', err);
      
      // Em caso de erro, mostrar login
      setUser(null);
      setShouldShowLogin(true);
      setError(null); // Não mostrar erro, apenas ir para login
      
    } finally {
      setLoading(false);
      initializingRef.current = false;
      setInitialized(true);
    }
  }, []);

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
    
    // Salvar dados do usuário
    saveUserData(userData);
    
    setUser(userData);
    setShouldShowLogin(false);
    setError(null);
    setRetryCount(0);
  };

  // Handler para logout
  const handleLogout = async () => {
    try {
      console.log('🚪 Fazendo logout...');
      
      // Usar função de logout do authHelpers
      await performLogout();
      
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
              path="/*" 
              element={
                user.role === 'admin' ? (
                  <AdminDashboard user={user} onLogout={handleLogout} />
                ) : (
                  <ClientDashboard user={user} onLogout={handleLogout} />
                )
              } 
            />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  );
};

export default App;
