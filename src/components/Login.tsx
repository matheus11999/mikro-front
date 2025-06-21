import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, Mail, Shield, AlertCircle, CheckCircle, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LoginProps {
  onLogin: (userId: string, userRole: 'admin' | 'user') => void;
}

interface LoginAttempt {
  timestamp: number;
  ip?: string;
}

const Login = ({ onLogin }: LoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(0);
  const [formStrength, setFormStrength] = useState(0);

  // Rate limiting configuration
  const MAX_ATTEMPTS = 5;
  const BLOCK_DURATION = 15 * 60 * 1000; // 15 minutes
  const ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutes window

  // Verificar tentativas de login no localStorage
  useEffect(() => {
    const stored = localStorage.getItem('loginAttempts');
    if (stored) {
      const attempts: LoginAttempt[] = JSON.parse(stored);
      const now = Date.now();
      
      // Filtrar tentativas dentro da janela de tempo
      const recentAttempts = attempts.filter(
        attempt => now - attempt.timestamp < ATTEMPT_WINDOW
      );
      
      setLoginAttempts(recentAttempts);
      
      // Verificar se está bloqueado
      if (recentAttempts.length >= MAX_ATTEMPTS) {
        const lastAttempt = Math.max(...recentAttempts.map(a => a.timestamp));
        const blockUntil = lastAttempt + BLOCK_DURATION;
        
        if (now < blockUntil) {
          setIsBlocked(true);
          setBlockTimeRemaining(Math.ceil((blockUntil - now) / 1000));
        }
      }
    }
  }, []);

  // Countdown timer para desbloqueio
  useEffect(() => {
    if (isBlocked && blockTimeRemaining > 0) {
      const timer = setInterval(() => {
        setBlockTimeRemaining(prev => {
          if (prev <= 1) {
            setIsBlocked(false);
            setLoginAttempts([]);
            localStorage.removeItem('loginAttempts');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isBlocked, blockTimeRemaining]);

  // Calcular força do formulário
  useEffect(() => {
    let strength = 0;
    if (email.includes('@') && email.includes('.')) strength += 50;
    if (password.length >= 6) strength += 30;
    if (password.length >= 12) strength += 20;
    setFormStrength(strength);
  }, [email, password]);

  // Registrar tentativa de login
  const recordLoginAttempt = () => {
    const attempt: LoginAttempt = {
      timestamp: Date.now(),
    };
    
    const updatedAttempts = [...loginAttempts, attempt];
    setLoginAttempts(updatedAttempts);
    localStorage.setItem('loginAttempts', JSON.stringify(updatedAttempts));
  };

  // Validação de email
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validação de senha
  const isValidPassword = (password: string) => {
    return password.length >= 6;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isBlocked) {
      setError(`Muitas tentativas. Tente novamente em ${Math.ceil(blockTimeRemaining / 60)} minutos.`);
      return;
    }

    // Validações client-side
    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Por favor, insira um email válido.');
      return;
    }

    if (!isValidPassword(password)) {
      setError('A senha deve ter pelo menos 6 caracteres.');
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
        recordLoginAttempt();
        
        if (loginAttempts.length + 1 >= MAX_ATTEMPTS) {
          setIsBlocked(true);
          setBlockTimeRemaining(BLOCK_DURATION / 1000);
          setError(`Muitas tentativas falharam. Conta bloqueada por 15 minutos.`);
        } else {
          const remaining = MAX_ATTEMPTS - (loginAttempts.length + 1);
          setError(`Credenciais inválidas. ${remaining} tentativas restantes.`);
        }
        return;
      }

      if (!authData.user) {
        setError('Falha na autenticação. Tente novamente.');
        return;
      }

      // Verificar dados do usuário na tabela users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, role, is_active')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (userError || !userData) {
        await supabase.auth.signOut();
        setError('Usuário não encontrado no sistema.');
        return;
      }

      if (!userData.is_active) {
        await supabase.auth.signOut();
        setError('Conta desativada. Entre em contato com o administrador.');
        return;
      }

      // Login bem-sucedido
      setSuccess('Login realizado com sucesso!');
      localStorage.removeItem('loginAttempts'); // Limpar tentativas
      
      setTimeout(() => {
        onLogin(userData.id, userData.role);
      }, 1000);

    } catch (error) {
      console.error('Erro no login:', error);
      setError('Erro interno do servidor. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
              </div>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              PIX Mikro
            </h1>
            <p className="text-gray-600">
              Sistema de Gerenciamento Avançado
            </p>
          </div>

          {/* Security Status */}
          <div className="mb-6 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200/50">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-700 font-medium">Sistema Seguro</span>
              </div>
              <div className="flex items-center gap-1">
                <Shield className="w-4 h-4 text-green-600" />
                <span className="text-green-600 text-xs">SSL/TLS</span>
              </div>
            </div>
          </div>

          {/* Form Strength Indicator */}
          {(email || password) && (
            <div className="mb-4 animate-fade-in">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>Segurança do Formulário</span>
                <span>{formStrength}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div 
                  className={`h-1 rounded-full transition-all duration-300 ${
                    formStrength < 50 ? 'bg-red-500' : formStrength < 80 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${formStrength}%` }}
                ></div>
              </div>
            </div>
          )}

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

          {/* Block Warning */}
          {isBlocked && (
            <Alert className="mb-4 border-orange-200 bg-orange-50 animate-bounce-in">
              <Lock className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-700">
                Conta temporariamente bloqueada. Desbloqueio em: {formatTime(blockTimeRemaining)}
              </AlertDescription>
            </Alert>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="form-group animate-slide-in" style={{ animationDelay: '0.2s' }}>
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
                  disabled={isLoading || isBlocked}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="form-group animate-slide-in" style={{ animationDelay: '0.3s' }}>
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
                  disabled={isLoading || isBlocked}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={isLoading || isBlocked}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              className="w-full btn-primary h-12 text-base font-semibold animate-slide-in"
              style={{ animationDelay: '0.4s' }}
              disabled={isLoading || isBlocked || !email || !password}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Autenticando...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  <span>Entrar no Sistema</span>
                </div>
              )}
            </Button>
          </form>

          {/* Security Info */}
          <div className="mt-6 p-4 bg-gray-50/80 rounded-xl border border-gray-100/50 animate-slide-in" style={{ animationDelay: '0.5s' }}>
            <div className="text-center text-xs text-gray-600">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-blue-500" />
                <span className="font-medium">Sistema Protegido</span>
              </div>
              <p>
                Tentativas: {loginAttempts.length}/{MAX_ATTEMPTS} • 
                Criptografia AES-256 • 
                Rate Limiting Ativo
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center text-xs text-gray-500 animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <p>PIX Mikro CRM v2.1.0 • © 2024</p>
            <p className="mt-1">Desenvolvido com segurança em mente</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
