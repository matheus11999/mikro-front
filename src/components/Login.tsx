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
  Sparkles,
  Crown,
  Zap,
  ArrowRight,
  WifiOff,
  Globe
} from 'lucide-react';
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
        .select('id, role')
        .eq('email', email.toLowerCase().trim())
        .single();

      let userRole: 'admin' | 'user' = 'admin'; // Default admin
      let userId = authData.user.id;

      if (userData && !userError) {
        userRole = userData.role || 'user';
        userId = userData.id;
        
        // TODO: Verificar se o usuário está ativo quando a coluna for criada
        // if (userData.ativo === false) {
        //   await supabase.auth.signOut();
        //   setError('Conta desativada. Entre em contato com o administrador.');
        //   return;
        // }
      } else {
        // Se não encontrou na tabela clientes, pode ser um admin direto do auth
        console.log('Usuário não encontrado na tabela clientes, considerando como admin');
      }

      // Login bem-sucedido
      setSuccess('Login realizado com sucesso!');
      
      setTimeout(() => {
        onLogin(userId, userRole);
      }, 800);

    } catch (error) {
      console.error('Erro no login:', error);
      setError('Erro interno do servidor. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-r from-blue-400/30 to-cyan-400/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-gradient-to-r from-purple-400/30 to-pink-400/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-indigo-300/20 to-purple-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
        
        {/* Floating particles */}
        <div className="absolute top-20 left-20 w-2 h-2 bg-blue-400 rounded-full animate-bounce opacity-60" style={{ animationDelay: '0s' }}></div>
        <div className="absolute top-32 right-32 w-1 h-1 bg-purple-400 rounded-full animate-bounce opacity-40" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-32 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce opacity-50" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-32 right-20 w-1 h-1 bg-pink-400 rounded-full animate-bounce opacity-30" style={{ animationDelay: '3s' }}></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Login Card */}
        <div className="relative bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl p-8 transform hover:scale-105 transition-all duration-500">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-xl opacity-50"></div>
          
          {/* Content */}
          <div className="relative z-10">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="relative inline-block mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-2xl mx-auto transform transition-all duration-300 hover:rotate-6 hover:scale-110">
                  <div className="absolute inset-0 bg-white/20 rounded-3xl"></div>
                  <Shield className="w-10 h-10 text-white relative z-10 drop-shadow-lg" />
                </div>
                {/* Crown for admin */}
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                  <Crown className="w-4 h-4 text-white" />
                </div>
                {/* Sparkles */}
                <Sparkles className="absolute -top-1 -left-1 w-4 h-4 text-yellow-300 animate-pulse" />
                <Sparkles className="absolute -bottom-1 -right-1 w-3 h-3 text-blue-300 animate-pulse" style={{ animationDelay: '1s' }} />
              </div>
              
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent mb-3">
                PIX Mikro
              </h1>
              <p className="text-slate-300 text-lg font-medium mb-2">
                Sistema de Gerenciamento
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span>Powered by EasyPanel</span>
                <Globe className="w-4 h-4 text-blue-400" />
              </div>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-2xl backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                    <AlertCircle className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-red-100 font-medium">{error}</p>
                    {error.includes('servidor') && (
                      <p className="text-red-200 text-sm mt-1 flex items-center gap-1">
                        <WifiOff className="w-3 h-3" />
                        Verifique as variáveis no EasyPanel
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-2xl backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-green-100 font-medium">{success}</p>
                </div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-200 font-semibold flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </Label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="relative bg-white/10 border-white/20 text-white placeholder-slate-400 h-12 rounded-xl backdrop-blur-sm focus:bg-white/20 focus:border-blue-400/50 transition-all duration-300"
                    placeholder="seu@email.com"
                    disabled={isLoading}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-200 font-semibold flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Senha
                </Label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="relative bg-white/10 border-white/20 text-white placeholder-slate-400 h-12 rounded-xl backdrop-blur-sm focus:bg-white/20 focus:border-purple-400/50 transition-all duration-300 pr-12"
                    placeholder="••••••••••"
                    disabled={isLoading}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full h-14 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white font-bold text-lg rounded-xl shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-3xl relative overflow-hidden group"
                  disabled={isLoading || !email || !password}
                >
                  {/* Button glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                  
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-3">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span>Entrando...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3 relative z-10">
                      <Shield className="w-6 h-6" />
                      <span>Entrar no Sistema</span>
                      <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  )}
                </Button>
              </div>
            </form>

            {/* Footer */}
            <div className="mt-8 text-center space-y-3">
              <div className="flex items-center justify-center gap-4 text-sm text-slate-400">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Sistema Online</span>
                </div>
                <div className="w-px h-4 bg-slate-600"></div>
                <div className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-yellow-400" />
                  <span>v2.1.0</span>
                </div>
              </div>
              
              <p className="text-xs text-slate-500">
                Desenvolvido com 💜 para gestão profissional
              </p>
            </div>
          </div>
        </div>

        {/* Additional floating elements */}
        <div className="absolute -top-10 -left-10 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
    </div>
  );
};

export default Login;
