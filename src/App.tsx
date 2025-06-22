import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import ClientDashboard from './components/ClientDashboard';
import ErrorBoundary from './components/ErrorBoundary';
import { supabase } from './lib/supabaseClient';
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
        <p className="text-gray-600">Inicializando sistema</p>
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

  const initializeApp = useCallback(async () => {
    if (initialized) return;

    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Buscar dados do usuário na tabela clientes
        const { data: userData, error: userError } = await supabase
          .from('clientes')
          .select('id, nome, email, role')
          .eq('email', session.user.email)
          .maybeSingle();

        if (userData) {
          const user = {
            id: userData.id,
            email: userData.email,
            role: userData.role === 'admin' ? 'admin' as const : 'user' as const,
            name: userData.nome
          };
          setUser(user);
        } else if (session.user.email === 'mateus11martins@gmail.com') {
          // Fallback para admin principal
          const user = {
            id: session.user.id,
            email: session.user.email,
            role: 'admin' as const,
            name: 'Admin'
          };
          setUser(user);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      
      setInitialized(true);
    } catch (err: any) {
      console.error('Erro na inicialização:', err);
      setError(err.message || 'Erro de conexão');
    } finally {
      setLoading(false);
    }
  }, [initialized]);

  useEffect(() => {
    if (!initialized) {
      initializeApp();
    }
  }, [initializeApp, initialized]);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setInitialized(false);
        setLoading(false);
      } else if (event === 'SIGNED_IN' && session?.user) {
        setInitialized(false);
        await initializeApp();
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [initializeApp]);

  const handleLogin = (userData: User) => {
    setUser(userData);
    setLoading(false);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  };

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorScreen error={error} onRetry={initializeApp} />;

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
