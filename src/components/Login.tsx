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
  BarChart3,
  Crown,
  Sparkles,
  Zap,
  Activity
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
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });

      if (authError) {
        log.error('Authentication failed', authError);
        
        if (authError.message.includes('Invalid login credentials')) {
          setError('Email ou senha incorretos.');
        } else if (authError.message.includes('Email not confirmed')) {
          setError('Email não confirmado. Verifique sua caixa de entrada.');
        } else if (authError.message.includes('Too many requests')) {
          setError('Muitas tentativas de login. Tente novamente em alguns minutos.');
        } else if (authError.message.includes('Network')) {
          setError('Erro de conexão. Verifique sua internet e as configurações do Supabase no EasyPanel.');
        } else {
          setError(`Erro de autenticação: ${authError.message}`);
        }
        return;
      }

      if (!authData.user) {
        log.error('Authentication succeeded but no user returned');
        setError('Falha na autenticação. Tente novamente.');
        return;
      }

      log.info('Authentication successful, fetching user profile');

      const { data: userData, error: userError } = await supabase
        .from('clientes')
        .select('id, role, nome')
        .eq('email', email.toLowerCase().trim())
        .single();

      let userRole: 'admin' | 'user' = 'admin';
      let userId = authData.user.id;

      if (userData && !userError) {
        userRole = userData.role === 'admin' ? 'admin' : 'user';
        userId = userData.id.toString();
        log.info('User profile found in clientes table', { 
          role: userRole, 
          userId, 
          userName: userData.nome 
        });
      } else {
        log.info('User not found in clientes table, treating as system admin', {
          email: email.toLowerCase().trim(),
          authUserId: authData.user.id
        });
      }

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-60 right-32 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-40 left-32 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-3000"></div>
        
        {/* Floating particles */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/40 rounded-full animate-bounce delay-500"></div>
        <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-blue-300/40 rounded-full animate-bounce delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-purple-300/40 rounded-full animate-bounce delay-1500"></div>
        <div className="absolute bottom-1/3 right-1/4 w-3 h-3 bg-pink-300/40 rounded-full animate-bounce delay-2000"></div>
      </div>

      <div className="relative z-10 min-h-screen flex">
        {/* Left Panel - Enhanced Branding */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/30 via-purple-600/30 to-indigo-600/30 backdrop-blur-sm"></div>
          
          <div className="relative z-10 flex flex-col justify-center p-12 text-white">
            {/* Premium Logo & Title */}
            <div className="mb-12">
              <div className="flex items-center gap-4 mb-8">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-2xl">
                    <Building2 className="w-9 h-9 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                    <Crown className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                    PIX Mikro
                  </h1>
                  <div className="flex items-center gap-2">
                    <p className="text-blue-200 text-sm">Enterprise CRM Platform</p>
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                  </div>
                </div>
              </div>
              
              <h2 className="text-5xl font-bold leading-tight mb-6">
                <span className="bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">
                  Transforme
                </span>
                <br />
                <span className="bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 bg-clip-text text-transparent">
                  seu negócio
                </span>
              </h2>
              <p className="text-blue-100 text-xl leading-relaxed">
                Plataforma inteligente de gestão empresarial com IA integrada, 
                analytics avançados e automação completa.
              </p>
            </div>

            {/* Premium Features */}
            <div className="space-y-8">
              <div className="group flex items-center gap-6 p-4 rounded-2xl bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-300">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Gestão Inteligente</h3>
                  <p className="text-blue-100">CRM com IA para análise preditiva de clientes</p>
                </div>
              </div>
              
              <div className="group flex items-center gap-6 p-4 rounded-2xl bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-300">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Analytics Avançados</h3>
                  <p className="text-blue-100">Dashboards em tempo real com insights acionáveis</p>
                </div>
              </div>
              
              <div className="group flex items-center gap-6 p-4 rounded-2xl bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-300">
                <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Automação Total</h3>
                  <p className="text-blue-100">Processos automatizados que escalam seu negócio</p>
                </div>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="mt-12 p-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">99.9%</div>
                  <div className="text-blue-200 text-sm">Uptime</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">10K+</div>
                  <div className="text-blue-200 text-sm">Clientes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">24/7</div>
                  <div className="text-blue-200 text-sm">Suporte</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Premium Login Form */}
        <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
          <div className="w-full max-w-md">
            {/* Mobile Premium Logo */}
            <div className="lg:hidden flex items-center justify-center gap-4 mb-8">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                  <Crown className="w-2 h-2 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">PIX Mikro</h1>
                <p className="text-blue-200 text-sm">Enterprise CRM</p>
              </div>
            </div>

            {/* Premium Form Container */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-white/10 rounded-3xl blur-xl"></div>
              <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
                {/* Form Header */}
                <div className="text-center mb-8">
                  <div className="relative mx-auto mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                      <Shield className="w-10 h-10 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-pulse">
                      <Crown className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">
                    Acesso Executivo
                  </h2>
                  <p className="text-gray-600 text-lg">
                    Entre na plataforma empresarial premium
                  </p>
                </div>

                {/* Error/Success Messages with enhanced styling */}
                {error && (
                  <Alert className="mb-6 border-red-200 bg-red-50/80 backdrop-blur-sm">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <AlertDescription className="text-red-800 font-medium">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="mb-6 border-green-200 bg-green-50/80 backdrop-blur-sm">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <AlertDescription className="text-green-800 font-medium">
                      {success}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Premium Login Form */}
                <form onSubmit={handleSubmit} className="space-y-7">
                  {/* Email Field - Enhanced */}
                  <div className="space-y-3">
                    <Label htmlFor="email" className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-blue-600" />
                      Email Corporativo
                    </Label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                      </div>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-12 h-14 border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-xl bg-white/70 backdrop-blur-sm font-medium transition-all duration-200"
                        placeholder="executivo@empresa.com"
                        disabled={isLoading}
                        autoComplete="email"
                        required
                      />
                    </div>
                  </div>

                  {/* Password Field - Enhanced */}
                  <div className="space-y-3">
                    <Label htmlFor="password" className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-blue-600" />
                      Senha Segura
                    </Label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                      </div>
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-12 pr-14 h-14 border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-xl bg-white/70 backdrop-blur-sm font-medium transition-all duration-200"
                        placeholder="••••••••••••"
                        disabled={isLoading}
                        autoComplete="current-password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-blue-600 transition-colors"
                        disabled={isLoading}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Premium Login Button */}
                  <Button
                    type="submit"
                    className="w-full h-14 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 relative overflow-hidden group"
                    disabled={isLoading || !email || !password}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-3">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span>Autenticando...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-3">
                        <Shield className="w-6 h-6" />
                        <span>Acessar Plataforma</span>
                        <Activity className="w-6 h-6" />
                      </div>
                    )}
                  </Button>
                </form>

                {/* Enhanced Footer */}
                <div className="mt-8 text-center space-y-4">
                  <div className="flex items-center justify-center gap-6 text-sm">
                    <div className="flex items-center gap-2 text-green-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="font-medium">Sistema Online</span>
                    </div>
                    <div className="flex items-center gap-2 text-blue-600">
                      <Shield className="w-4 h-4" />
                      <span className="font-medium">SSL Seguro</span>
                    </div>
                  </div>
                  
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                  
                  <p className="text-sm text-gray-500">
                    © 2024 PIX Mikro Enterprise. Plataforma de gestão empresarial.
                  </p>
                  <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
                    <span>Versão 3.0 Pro</span>
                    <span>•</span>
                    <span>Suporte 24/7</span>
                    <span>•</span>
                    <span>99.9% Uptime</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
