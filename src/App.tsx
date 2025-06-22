import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import ClientDashboard from './components/ClientDashboard';
import ErrorBoundary from './components/ErrorBoundary';
import { supabase, checkPersistedSession } from './lib/supabaseClient';
import { Wifi, AlertCircle, Loader2 } from 'lucide-react';
import './App.css';

interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  name?: string;
}

function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center z-50">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl mb-6 shadow-lg">
          <Wifi className="w-8 h-8 text-white" />
        </div>
        <div className="flex items-center justify-center gap-3 mb-4">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          <h2 className="text-xl font-semibold text-gray-900">Carregando...</h2>
        </div>
        <p className="text-gray-600">Verificando autenticação</p>
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
          <p className="text-gray-600 mb-6">{error}</p>
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

  // Função melhorada para verificar sessão persistida
  const checkPersistedSession = useCallback(async () => {
    try {
      console.log('🔍 Verificando sessão persistida...');
      
      // Timeout para evitar travamento
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout na verificação de sessão')), 5000)
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

  // Função para buscar dados do usuário baseado na sessão
  const fetchUserData = useCallback(async (session: any): Promise<User | null> => {
    try {
      console.log('🔍 Buscando dados do usuário:', session.user.email);
      
             // Timeout para evitar travamento
       const userPromise = supabase
         .from('clientes')
         .select('id, email, role, nome')
         .eq('email', session.user.email)
         .single();
        
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout na busca do usuário')), 5000)
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

      console.log('✅ Usuário encontrado:', userData.email, userData.role);
      
      // Validar sessão
      const now = new Date().getTime();
      const sessionTime = new Date(session.expires_at).getTime();
      
      if (sessionTime <= now) {
        console.log('⚠️ Sessão expirada');
        return null;
      }

      console.log('✅ Sessão válida confirmada:', userData.email);
      
      return {
        id: userData.id,
        email: userData.email,
        role: userData.role,
        name: userData.nome
      };
    } catch (err: any) {
      console.error('❌ Erro ao buscar dados do usuário:', err);
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

      console.log('🚀 Inicializando aplicação...');

      // Usar a nova função de verificação de sessão
      const session = await checkPersistedSession();

      if (session?.user) {
        const userData = await fetchUserData(session);
        if (userData) {
          console.log('✅ Usuário autenticado:', userData.email, userData.role);
          setUser(userData);
        } else {
          console.log('⚠️ Sessão inválida, fazendo logout...');
          await supabase.auth.signOut();
          setUser(null);
        }
      } else {
        console.log('📝 Nenhuma sessão ativa');
        setUser(null);
      }
      
    } catch (err: any) {
      console.error('❌ Erro na inicialização:', err);
      setError(err.message || 'Erro de conexão');
    } finally {
      // Garantir que loading seja sempre false no final
      setTimeout(() => {
        setLoading(false);
        setInitialized(true);
        initializingRef.current = false;
      }, 100);
    }
  }, [fetchUserData]);

  // Inicialização da aplicação
  useEffect(() => {
    if (!initialized && !initializingRef.current) {
      console.log('🎯 Primeira inicialização do app');
      
      // Timeout de segurança para evitar loading infinito
      const initTimeout = setTimeout(() => {
        if (initializingRef.current) {
          console.log('⚠️ Timeout de inicialização - forçando parada');
          setLoading(false);
          setInitialized(true);
          initializingRef.current = false;
          setError('Timeout na inicialização. Tente recarregar a página.');
        }
      }, 10000); // 10 segundos

      initializeApp().finally(() => {
        clearTimeout(initTimeout);
      });

      return () => {
        clearTimeout(initTimeout);
      };
    }
  }, [initialized, initializeApp]);

  // Listener para mudanças de autenticação
  useEffect(() => {
    console.log('👂 Configurando listener de autenticação...');
    
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Mudança de auth:', event, session ? 'Sessão ativa' : 'Sem sessão');
      
      // Evitar processar eventos durante inicialização
      if (initializingRef.current) {
        console.log('⏳ Ignorando evento durante inicialização');
        return;
      }

      try {
        if (event === 'SIGNED_OUT') {
          console.log('👋 Usuário deslogado');
          setUser(null);
          setLoading(false);
        } else if (event === 'SIGNED_IN' && session?.user) {
          console.log('👤 Usuário logado:', session.user.email);
          setLoading(true);
          const userData = await fetchUserData(session);
          if (userData) {
            setUser(userData);
          } else {
            console.log('⚠️ Login inválido, fazendo logout...');
            await supabase.auth.signOut();
            setUser(null);
          }
          setLoading(false);
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('🔄 Token renovado');
          // Não fazer nada, apenas log
        } else if (event === 'INITIAL_SESSION') {
          console.log('🎯 Sessão inicial detectada');
          // Já tratado na inicialização
        }
      } catch (err: any) {
        console.error('❌ Erro no listener de auth:', err);
        setError(err.message || 'Erro de autenticação');
        setLoading(false);
      }
    });

    return () => {
      console.log('🧹 Removendo listener de autenticação');
      authListener.subscription.unsubscribe();
    };
  }, [fetchUserData]);

  // Listener para quando o usuário volta para a aba (evita loading infinito)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && initialized && !initializingRef.current) {
        console.log('👁️ Usuário voltou para a aba');
        // Se estiver em loading há muito tempo, forçar parada
        if (loading) {
          console.log('⚠️ Loading infinito detectado, forçando parada');
          setLoading(false);
        }
      }
    };

    const handleFocus = () => {
      if (initialized && !initializingRef.current && loading) {
        console.log('🔍 Foco na janela - verificando loading infinito');
        setTimeout(() => {
          if (loading && !initializingRef.current) {
            console.log('⚠️ Loading infinito detectado no foco, forçando parada');
            setLoading(false);
          }
        }, 1000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [initialized, loading]);

  const handleLogin = (userData: User) => {
    console.log('✅ Login manual realizado:', userData.email);
    setUser(userData);
    setLoading(false);
  };

  const handleLogout = async () => {
    try {
      console.log('👋 Iniciando logout...');
      setLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      console.log('✅ Logout realizado com sucesso');
    } catch (error) {
      console.error('❌ Erro no logout:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    console.log('🔄 Tentando novamente...');
    setError(null);
    setInitialized(false);
    initializeApp();
  };

  // Mostrar loading apenas se não inicializou ainda ou está carregando
  if (!initialized || loading) {
    return <LoadingScreen />;
  }
  
  if (error) {
    return <ErrorScreen error={error} onRetry={handleRetry} />;
  }

  console.log('🎨 Renderizando app. Usuário:', user ? `${user.email} (${user.role})` : 'Não logado');

  return (
    <Router>
      <ErrorBoundary>
        <Routes>
          <Route 
            path="/login" 
            element={
              user ? 
                <Navigate to={user.role === 'admin' ? '/admin' : '/client'} replace /> : 
                <Login onLogin={handleLogin} />
            } 
          />
          <Route 
            path="/admin/*" 
            element={
              user?.role === 'admin' ? 
                <AdminDashboard user={user} onLogout={handleLogout} /> : 
                <Navigate to="/login" replace />
            } 
          />
          <Route 
            path="/client/*" 
            element={
              user?.role === 'user' ? 
                <ClientDashboard user={user} onLogout={handleLogout} /> : 
                <Navigate to="/login" replace />
            } 
          />
          <Route 
            path="/" 
            element={
              <Navigate to={
                user ? 
                  (user.role === 'admin' ? '/admin' : '/client') : 
                  '/login'
              } replace />
            } 
          />
        </Routes>
      </ErrorBoundary>
    </Router>
  );
};

export default App;
