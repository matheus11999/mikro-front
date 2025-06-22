import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users2, 
  Server, 
  KeyRound, 
  CreditCard, 
  TrendingUp, 
  Wifi,
  LogOut,
  ShieldCheck,
  Coins,
  BarChart3,
  Banknote,
  ChevronRight,
  Sparkles,
  Zap,
  Crown,
  Activity,
  Bell,
  Settings
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from '@/components/ui/sidebar';

interface AppSidebarProps {
  userRole: 'admin' | 'user';
  onLogout: () => void;
}

const AppSidebar = ({ userRole, onLogout }: AppSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useSidebar();

  const adminMenuItems = [
    { 
      path: '/dashboard', 
      icon: LayoutDashboard, 
      label: 'Dashboard',
      badge: null,
      gradient: 'from-blue-500 to-cyan-500',
      hoverGradient: 'from-blue-600 to-cyan-600'
    },
    { 
      path: '/users', 
      icon: Users2, 
      label: 'Usuários',
      badge: null,
      gradient: 'from-purple-500 to-pink-500',
      hoverGradient: 'from-purple-600 to-pink-600'
    },
    { 
      path: '/mikrotiks', 
      icon: Server, 
      label: 'Mikrotiks',
      badge: null,
      gradient: 'from-green-500 to-emerald-500',
      hoverGradient: 'from-green-600 to-emerald-600'
    },
    { 
      path: '/passwords', 
      icon: KeyRound, 
      label: 'Senhas',
      badge: null,
      gradient: 'from-orange-500 to-amber-500',
      hoverGradient: 'from-orange-600 to-amber-600'
    },
    { 
      path: '/macs', 
      icon: Wifi, 
      label: 'MACs',
      badge: null,
      gradient: 'from-cyan-500 to-teal-500',
      hoverGradient: 'from-cyan-600 to-teal-600'
    },
    { 
      path: '/withdrawals', 
      icon: Banknote, 
      label: 'Saques',
      badge: '3',
      gradient: 'from-yellow-500 to-orange-500',
      hoverGradient: 'from-yellow-600 to-orange-600'
    },
    { 
      path: '/reports', 
      icon: BarChart3, 
      label: 'Relatórios',
      badge: null,
      gradient: 'from-indigo-500 to-purple-500',
      hoverGradient: 'from-indigo-600 to-purple-600'
    },
    { 
      path: '/TestePix', 
      icon: Coins, 
      label: 'Teste PIX',
      badge: null,
      gradient: 'from-pink-500 to-rose-500',
      hoverGradient: 'from-pink-600 to-rose-600'
    },
  ];

  const userMenuItems = [
    { 
      path: '/user-dashboard', 
      icon: LayoutDashboard, 
      label: 'Dashboard',
      badge: null,
      gradient: 'from-blue-500 to-cyan-500',
      hoverGradient: 'from-blue-600 to-cyan-600'
    },
    { 
      path: '/user-reports', 
      icon: TrendingUp, 
      label: 'Relatórios',
      badge: null,
      gradient: 'from-indigo-500 to-purple-500',
      hoverGradient: 'from-indigo-600 to-purple-600'
    },
    { 
      path: '/user-withdrawals', 
      icon: CreditCard, 
      label: 'Saques',
      badge: null,
      gradient: 'from-green-500 to-emerald-500',
      hoverGradient: 'from-green-600 to-emerald-600'
    },
  ];

  const menuItems = userRole === 'admin' ? adminMenuItems : userMenuItems;
  const isActiveRoute = (path: string) => location.pathname === path;

  return (
    <Sidebar collapsible="icon" className="border-none bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <SidebarHeader className="border-b border-slate-700/50 px-6 py-6 bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="relative group">
            {/* Logo principal com gradiente */}
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-2xl transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
              <Coins className="w-7 h-7 text-white drop-shadow-lg" />
            </div>
            {/* Efeito de brilho */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 via-purple-400/20 to-pink-400/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            {/* Status indicator */}
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-3 border-slate-800 flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            </div>
          </div>
          
          <div className="group-data-[collapsible=icon]:hidden">
            <h1 className="text-xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
              PIX Mikro
            </h1>
            <div className="flex items-center gap-2 text-sm mt-1">
              {userRole === 'admin' ? (
                <>
                  <Crown className="w-4 h-4 text-yellow-400" />
                  <span className="text-slate-300 font-medium">Admin Panel</span>
                  <Sparkles className="w-3 h-3 text-yellow-400 animate-pulse" />
                </>
              ) : (
                <>
                  <Users2 className="w-4 h-4 text-blue-400" />
                  <span className="text-slate-300 font-medium">Cliente</span>
                </>
              )}
            </div>
          </div>
        </div>
      </SidebarHeader>

      {/* Content */}
      <SidebarContent className="px-4 py-6 bg-gradient-to-b from-transparent to-slate-900/20">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 group-data-[collapsible=icon]:hidden">
            <div className="flex items-center gap-2">
              <Zap className="w-3 h-3" />
              {userRole === 'admin' ? 'Administração' : 'Menu Principal'}
            </div>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {menuItems.map((item, index) => {
                const isActive = isActiveRoute(item.path);
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton 
                      asChild
                      isActive={isActive}
                      tooltip={state === 'collapsed' ? item.label : undefined}
                      className="group/item h-auto p-0"
                    >
                      <button
                        onClick={() => navigate(item.path)}
                        className={`
                          w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300 transform hover:scale-105 relative overflow-hidden group
                          ${isActive 
                            ? `bg-gradient-to-r ${item.gradient} text-white shadow-2xl shadow-blue-500/25` 
                            : 'text-slate-300 hover:text-white hover:bg-slate-800/50 backdrop-blur-sm'
                          }
                        `}
                        style={{
                          animationDelay: `${index * 0.05}s`
                        }}
                      >
                        {/* Background glow effect */}
                        {isActive && (
                          <div className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-20 blur-xl -z-10`}></div>
                        )}
                        
                        <div className="flex items-center gap-4 min-w-0 flex-1 relative z-10">
                          <div className={`
                            w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 shrink-0 relative
                            ${isActive 
                              ? 'bg-white/20 backdrop-blur-sm shadow-lg' 
                              : 'bg-slate-700/50 group-hover:bg-slate-600/50'
                            }
                          `}>
                            <item.icon className={`
                              w-5 h-5 transition-all duration-300
                              ${isActive ? 'text-white drop-shadow-sm' : 'text-slate-400 group-hover:text-white'}
                            `} />
                            {/* Icon glow */}
                            {isActive && (
                              <div className="absolute inset-0 bg-white/10 rounded-xl blur-sm"></div>
                            )}
                          </div>
                          <span className="font-semibold text-sm group-data-[collapsible=icon]:hidden truncate transition-all duration-300">
                            {item.label}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 group-data-[collapsible=icon]:hidden relative z-10">
                          {item.badge && (
                            <div className={`
                              w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 relative
                              ${isActive 
                                ? 'bg-white/20 text-white backdrop-blur-sm' 
                                : 'bg-red-500 text-white shadow-lg shadow-red-500/50'
                              }
                            `}>
                              {item.badge}
                              {!isActive && (
                                <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20"></div>
                              )}
                            </div>
                          )}
                          {isActive && (
                            <ChevronRight className="w-4 h-4 text-white/80 animate-pulse" />
                          )}
                        </div>

                        {/* Shimmer effect */}
                        {!isActive && (
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
                        )}
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Quick Actions - Only for Admin */}
        {userRole === 'admin' && (
          <SidebarGroup className="mt-8">
            <SidebarGroupLabel className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 group-data-[collapsible=icon]:hidden">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3 h-3" />
                Ações Rápidas
              </div>
            </SidebarGroupLabel>
            <SidebarGroupContent className="group-data-[collapsible=icon]:hidden">
              <div className="grid grid-cols-2 gap-3 px-3">
                <button className="flex flex-col items-center gap-2 p-3 bg-gradient-to-br from-green-500/10 to-emerald-500/10 hover:from-green-500/20 hover:to-emerald-500/20 rounded-xl transition-all duration-300 hover:scale-105 border border-green-500/20 backdrop-blur-sm group">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center shadow-lg">
                    <Users2 className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-green-400 group-hover:text-green-300 transition-colors">Novo User</span>
                </button>
                <button className="flex flex-col items-center gap-2 p-3 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 hover:from-blue-500/20 hover:to-cyan-500/20 rounded-xl transition-all duration-300 hover:scale-105 border border-blue-500/20 backdrop-blur-sm group">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg">
                    <Server className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-blue-400 group-hover:text-blue-300 transition-colors">Add Router</span>
                </button>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-slate-700/50 p-4 bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              asChild
              tooltip={state === 'collapsed' ? 'Sair' : undefined}
              className="group/logout h-auto p-0"
            >
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 p-4 rounded-xl text-red-400 hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 transition-all duration-300 group transform hover:scale-105 backdrop-blur-sm"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-500/20 group-hover:bg-white/20 transition-all duration-300 shrink-0">
                  <LogOut className="w-5 h-5" />
                </div>
                <span className="font-semibold text-sm group-data-[collapsible=icon]:hidden">
                  Sair
                </span>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Enhanced Status */}
        <div className="mt-4 p-4 bg-gradient-to-br from-slate-800/60 to-slate-700/60 rounded-xl border border-slate-600/30 backdrop-blur-sm group-data-[collapsible=icon]:hidden">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-slate-400 font-semibold">Sistema</span>
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-20"></div>
              </div>
              <span className="text-green-400 font-bold">Online</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">v2.1.0</span>
            <div className="flex items-center gap-1">
              <Activity className="w-3 h-3 text-blue-400" />
              <span className="text-blue-400 font-medium">Atualizado</span>
            </div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
