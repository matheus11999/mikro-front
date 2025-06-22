import { supabase } from './supabaseClient';

// Interface para dados do usuário
export interface UserData {
  id: string;
  email: string;
  role: 'admin' | 'user';
  name?: string;
}

// Chave do localStorage para dados do usuário
const USER_DATA_KEY = 'pix-mikro-user-data';

// Salvar dados do usuário no localStorage
export function saveUserData(userData: UserData) {
  try {
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
    console.log('💾 Dados do usuário salvos localmente:', userData.email);
  } catch (error) {
    console.error('❌ Erro ao salvar dados do usuário:', error);
  }
}

// Recuperar dados do usuário do localStorage
export function getUserData(): UserData | null {
  try {
    const data = localStorage.getItem(USER_DATA_KEY);
    if (data) {
      const userData = JSON.parse(data);
      console.log('💾 Dados do usuário recuperados:', userData.email);
      return userData;
    }
  } catch (error) {
    console.error('❌ Erro ao recuperar dados do usuário:', error);
  }
  return null;
}

// Limpar dados do usuário
export function clearUserData() {
  try {
    localStorage.removeItem(USER_DATA_KEY);
    console.log('🗑️ Dados do usuário removidos');
  } catch (error) {
    console.error('❌ Erro ao remover dados do usuário:', error);
  }
}

// Verificar se há sessão ativa (sem verificar expiração)
export async function checkActiveSession(): Promise<any> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Erro ao verificar sessão:', error);
      return null;
    }
    
    if (session?.user) {
      console.log('✅ Sessão ativa encontrada:', session.user.email);
      return session;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Erro ao verificar sessão ativa:', error);
    return null;
  }
}

// Buscar dados completos do usuário
export async function fetchCompleteUserData(email: string): Promise<UserData | null> {
  try {
    const { data: userData, error } = await supabase
      .from('clientes')
      .select('id, email, role, nome')
      .eq('email', email)
      .single();

    if (error || !userData) {
      console.error('❌ Erro ao buscar dados do usuário:', error);
      return null;
    }

    const user: UserData = {
      id: userData.id,
      email: userData.email,
      role: userData.role,
      name: userData.nome
    };

    // Salvar no localStorage para recuperação rápida
    saveUserData(user);
    
    return user;
  } catch (error) {
    console.error('❌ Erro ao buscar dados completos:', error);
    return null;
  }
}

// Verificar e restaurar sessão
export async function checkAndRestoreSession(): Promise<UserData | null> {
  try {
    // 1. Verificar se há sessão ativa no Supabase
    const session = await checkActiveSession();
    
    if (session?.user?.email) {
      // 2. Buscar dados completos do usuário
      const userData = await fetchCompleteUserData(session.user.email);
      if (userData) {
        return userData;
      }
    }
    
    // 3. Tentar recuperar dados salvos localmente
    const savedData = getUserData();
    if (savedData) {
      // Verificar se o usuário ainda existe no banco
      const userData = await fetchCompleteUserData(savedData.email);
      if (userData) {
        return userData;
      }
    }
    
    // 4. Sem sessão válida
    clearUserData();
    return null;
    
  } catch (error) {
    console.error('❌ Erro ao verificar/restaurar sessão:', error);
    return null;
  }
}

// Fazer logout completo
export async function performLogout() {
  try {
    // Limpar dados locais
    clearUserData();
    
    // Limpar tokens do Supabase
    localStorage.removeItem('pix-mikro-auth-token');
    localStorage.removeItem('sb-zzfugxcsinasxrhcwvcp-auth-token');
    
    // Fazer signOut no Supabase
    await supabase.auth.signOut();
    
    console.log('✅ Logout completo realizado');
  } catch (error) {
    console.error('❌ Erro durante logout:', error);
  }
} 