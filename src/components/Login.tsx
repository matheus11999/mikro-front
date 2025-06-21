import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, Shield, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LoginProps {
  onLogin: (userId: string, userRole: 'admin' | 'user') => void;
}

const Login = ({ onLogin }: LoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações simples
    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Primeiro, tentar autenticar
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });

      if (authError) {
        setError('Email ou senha incorretos.');
        return;
      }

      if (!authData.user) {
        setError('Falha na autenticação. Tente novamente.');
        return;
      }

      // Verificar dados do usuário na tabela clientes (se não encontrar, considerar como admin)
      const { data: userData, error: userError } = await supabase
        .from('clientes')
        .select('id, role, ativo')
        .eq('email', email.toLowerCase().trim())
        .single();

      let userRole: 'admin' | 'user' = 'admin'; // Default admin
      let userId = authData.user.id;

      if (userData && !userError) {
        userRole = userData.role || 'user';
        userId = userData.id;
        
        if (userData.ativo === false) {
          await supabase.auth.signOut();
          setError('Conta desativada. Entre em contato com o administrador.');
          return;
        }
      } else {
        // Se não encontrou na tabela clientes, pode ser um admin direto do auth
        console.log('Usuário não encontrado na tabela clientes, considerando como admin');
      }

      // Login bem-sucedido
      setSuccess('Login realizado com sucesso!');
      
      setTimeout(() => {
        onLogin(userId, userRole);
      }, 500);

    } catch (error) {
      console.error('Erro no login:', error);
      setError('Erro interno do servidor. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-blue-300/10 to-purple-300/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="w-full max-w-md relative">
        {/* Login Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 animate-scale-in">
          {/* Header */}
          <div className="text-center mb-8 animate-slide-in">
            <div className="relative inline-block mb-4">
              <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-lg mx-auto">
                <div className="absolute inset-0 bg-white/20 rounded-2xl"></div>
                <Shield className="w-8 h-8 text-white relative z-10" />
              </div>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              PIX Mikro
            </h1>
            <p className="text-gray-600">
              Sistema de Gerenciamento
            </p>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <Alert className="mb-4 border-red-200 bg-red-50 animate-bounce-in">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 border-green-200 bg-green-50 animate-bounce-in">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">{success}</AlertDescription>
            </Alert>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="form-group animate-slide-in" style={{ animationDelay: '0.1s' }}>
              <Label htmlFor="email" className="form-label">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-11"
                  placeholder="seu@email.com"
                  disabled={isLoading}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="form-group animate-slide-in" style={{ animationDelay: '0.2s' }}>
              <Label htmlFor="password" className="form-label">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-11 pr-11"
                  placeholder="••••••••"
                  disabled={isLoading}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              className="w-full btn-primary h-12 text-base font-semibold animate-slide-in"
              style={{ animationDelay: '0.3s' }}
              disabled={isLoading || !email || !password}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Entrando...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  <span>Entrar</span>
                </div>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-xs text-gray-500 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <p>PIX Mikro CRM v2.1.0</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
