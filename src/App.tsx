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

  // Função para buscar dados do usuário baseado na sessão
  const fetchUserData = useCallback(async (session: any) => {
    if (!session?.user?.email) {
      return null;
    }

    try {
      console.log('🔍 Buscando dados do usuário:', session.user.email);
      
      // Buscar dados do usuário na tabela clientes
      const { data: userData, error: userError } = await supabase
        .from('clientes')
        .select('id, nome, email, role')
        .eq('email', session.user.email)
        .maybeSingle();

      if (userError) {
        console.error('Erro ao buscar usuário:', userError);
        throw userError;
      }

      if (userData) {
        console.log('✅ Usuário encontrado:', userData.email, userData.role);
        return {
          id: userData.id,
          email: userData.email,
          role: userData.role === 'admin' ? 'admin' as const : 'user' as const,
          name: userData.nome
        };
      } else if (session.user.email === 'mateus11martins@gmail.com') {
        // Fallback para admin principal
        console.log('✅ Fallback admin para:', session.user.email);
        return {
          id: session.user.id,
          email: session.user.email,
          role: 'admin' as const,
          name: 'Admin'
        };
      } else {
        console.warn('⚠️ Usuário não encontrado na tabela clientes:', session.user.email);
        return null;
      }
    } catch (err: any) {
      console.error('❌ Erro ao buscar dados do usuário:', err);
      throw err;
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
      setLoading(false);
      setInitialized(true);
      initializingRef.current = false;
    }
  }, [fetchUserData]);

  // Inicializar app na primeira carga
  useEffect(() => {
    if (!initialized) {
      console.log('🎯 Primeira inicialização do app');
      initializeApp();
    }
  }, [initializeApp, initialized]);

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
