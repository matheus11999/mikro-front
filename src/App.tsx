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

const queryClient = new QueryClient();

const App = () => {
  const [user, setUser] = useState<{ role: 'admin' | 'user', id: string } | null>(null);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        supabase
          .from('clientes')
          .select('id, role')
          .eq('email', session.user.email)
          .limit(1)
          .then(({ data: clientes }) => {
            if (clientes && clientes.length > 0) {
              setUser({ role: clientes[0].role || 'user', id: clientes[0].id });
            }
          });
      } else {
        setUser(null);
      }
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const handleLogin = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      const { data: clientes } = await supabase.from('clientes').select('id, role').eq('email', authUser.email).limit(1);
      if (clientes && clientes.length > 0) {
        setUser({ role: clientes[0].role || 'user', id: clientes[0].id });
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // Função para deletar usuário do Auth
  async function deleteUserFromAuth(email) {
    // Buscar usuário pelo e-mail
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const user = users.find(u => u.email === email);
    if (user) {
      await supabase.auth.admin.deleteUser(user.id);
    }
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
                    <Route path="/TestePix" element={<TestePix userRole={user.role} />} />
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
