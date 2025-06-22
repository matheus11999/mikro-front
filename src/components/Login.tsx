import React, { useState } from 'react';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Mail, 
  Shield, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  Building2,
  TrendingUp,
  Users,
  BarChart3
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLogger } from '@/lib/logger';

interface LoginProps {
  onLogin: (userId: string, userRole: 'admin' | 'user') => void;
}

const Login = ({ onLogin }: LoginProps) => {
  const log = useLogger('Login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const timerId = log.startTimer('login-process');
    log.info('Login attempt started', { email });
    
    // Validações simples
    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      log.warn('Login validation failed - empty fields');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      log.info('Attempting authentication');
      
      // Primeiro, tentar autenticar
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });

      if (authError) {
        log.error('Authentication failed', authError);
        setError('Email ou senha incorretos.');
        return;
      }

      if (!authData.user) {
        log.error('Authentication succeeded but no user returned');
        setError('Falha na autenticação. Tente novamente.');
        return;
      }

      log.info('Authentication successful, fetching user profile');

      // Verificar dados do usuário na tabela clientes (se não encontrar, considerar como admin)
      const { data: userData, error: userError } = await supabase
        .from('clientes')
        .select('id, role')
        .eq('email', email.toLowerCase().trim())
        .single();

      let userRole: 'admin' | 'user' = 'admin'; // Default admin
      let userId = authData.user.id;

      if (userData && !userError) {
        userRole = userData.role || 'user';
        userId = userData.id;
        log.info('User profile found in clientes table', { role: userRole, userId });
      } else {
        log.info('User not found in clientes table, treating as admin');
      }

      // Login bem-sucedido
      setSuccess('Login realizado com sucesso!');
      log.info('Login completed successfully', { userId, userRole });
      
      setTimeout(() => {
        onLogin(userId, userRole);
        log.endTimer(timerId, 'login-process');
      }, 800);

    } catch (error) {
      log.error('Login exception caught', error);
      setError('Erro interno do servidor. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex">
      {/* Left Panel - Branding/Info */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full"></div>
          <div className="absolute top-40 right-32 w-24 h-24 bg-white rounded-full"></div>
          <div className="absolute bottom-40 left-32 w-20 h-20 bg-white rounded-full"></div>
          <div className="absolute bottom-20 right-20 w-28 h-28 bg-white rounded-full"></div>
        </div>

        <div className="relative z-10 flex flex-col justify-center p-12 text-white">
          {/* Logo & Title */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">PIX Mikro</h1>
                <p className="text-blue-100 text-sm">Customer Relationship Management</p>
              </div>
            </div>
            <h2 className="text-4xl font-bold leading-tight mb-4">
              Gerencie seu negócio
              <br />
              <span className="text-blue-200">de forma inteligente</span>
            </h2>
            <p className="text-blue-100 text-lg leading-relaxed">
              Plataforma completa para gestão de clientes, relatórios avançados 
              e controle financeiro em tempo real.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">Gestão de Clientes</h3>
                <p className="text-blue-100 text-sm">Controle completo da base de clientes</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">Relatórios Avançados</h3>
                <p className="text-blue-100 text-sm">Analytics e insights em tempo real</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">Crescimento Sustentável</h3>
                <p className="text-blue-100 text-sm">Ferramentas para escalar seu negócio</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">PIX Mikro</h1>
              <p className="text-gray-500 text-sm">CRM</p>
            </div>
          </div>

          {/* Form Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Bem-vindo de volta
            </h2>
            <p className="text-gray-600">
              Entre com suas credenciais para acessar o sistema
            </p>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {success}
              </AlertDescription>
            </Alert>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email corporativo
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="usuario@empresa.com"
                  disabled={isLoading}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Senha
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-12 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="••••••••••"
                  disabled={isLoading}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
              disabled={isLoading || !email || !password}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Entrando...</span>
                </div>
              ) : (
                'Entrar no Sistema'
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              © 2024 PIX Mikro. Todos os direitos reservados.
            </p>
            <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Sistema Online
              </span>
              <span>v2.1.0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
