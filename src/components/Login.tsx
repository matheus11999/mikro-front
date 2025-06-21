import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const Login = ({ onLogin }: { onLogin: () => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [name, setName] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    if (isSignUp) {
      const { error: signUpError, data } = await supabase.auth.signUp({ email, password });
      if (signUpError) setError(signUpError.message);
      else {
        // Cria registro na tabela clientes
        await supabase.from('clientes').insert([{ nome: name, email, saldo: 0, role }]);
        setIsSignUp(false);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else onLogin();
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-3 md:p-4">
      <div className="w-full max-w-sm md:max-w-md">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl md:rounded-2xl shadow-xl border border-gray-100 p-4 md:p-6 lg:p-8">
          <div className="text-center mb-6 md:mb-8">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-3 md:mb-4 shadow-lg">
              <svg className="w-6 h-6 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
              PIX Mikro CRM
            </h1>
            <p className="text-gray-600 text-sm md:text-base">Sistema de Gerenciamento</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            <div className="form-group">
              <label className="form-label text-sm md:text-base">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field text-sm md:text-base"
                placeholder="Digite seu email"
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label text-sm md:text-base">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field text-sm md:text-base"
                placeholder="Digite sua senha"
                required
              />
            </div>

            {isSignUp && (
              <div className="form-group">
                <label className="form-label text-sm md:text-base">Nome</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="input-field text-sm md:text-base"
                  placeholder="Digite seu nome"
                  required
                />
              </div>
            )}

            {isSignUp && (
              <div className="form-group">
                <label className="form-label text-sm md:text-base">Tipo de Conta</label>
                <select 
                  value={role} 
                  onChange={e => setRole(e.target.value as 'admin' | 'user')} 
                  className="input-field text-sm md:text-base"
                >
                  <option value="user">Usuário</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            )}

            {error && (
              <div className="text-red-600 text-xs md:text-sm mb-2 p-2 bg-red-50 rounded-lg border border-red-200">
                {error}
              </div>
            )}
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary h-10 md:h-11 text-sm md:text-base font-semibold"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 md:h-5 md:w-5 border-b-2 border-white mr-2"></div>
                  {isSignUp ? 'Criando conta...' : 'Entrando...'}
                </div>
              ) : (
                isSignUp ? 'Criar Conta' : 'Entrar no Sistema'
              )}
            </button>
            
            <button
              type="button"
              className="w-full mt-2 btn-secondary h-10 md:h-11 text-sm md:text-base font-semibold"
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp ? 'Já tem conta? Entrar' : 'Não tem conta? Criar conta'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
