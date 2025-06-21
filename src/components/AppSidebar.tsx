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
  Dot
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
      color: 'blue'
    },
    { 
      path: '/users', 
      icon: Users2, 
      label: 'Usuários',
      badge: null,
      color: 'purple'
    },
    { 
      path: '/mikrotiks', 
      icon: Server, 
      label: 'Mikrotiks',
      badge: null,
      color: 'green'
    },
    { 
      path: '/passwords', 
      icon: KeyRound, 
      label: 'Senhas',
      badge: null,
      color: 'orange'
    },
    { 
      path: '/macs', 
      icon: Wifi, 
      label: 'MACs',
      badge: null,
      color: 'cyan'
    },
    { 
      path: '/withdrawals', 
      icon: Banknote, 
      label: 'Saques',
      badge: '!',
      color: 'yellow'
    },
    { 
      path: '/reports', 
      icon: BarChart3, 
      label: 'Relatórios',
      badge: null,
      color: 'indigo'
    },
    { 
      path: '/TestePix', 
      icon: Coins, 
      label: 'Teste PIX',
      badge: null,
      color: 'pink'
    },
  ];

  const userMenuItems = [
    { 
      path: '/user-dashboard', 
      icon: LayoutDashboard, 
      label: 'Dashboard',
      badge: null,
      color: 'blue'
    },
    { 
      path: '/user-reports', 
      icon: TrendingUp, 
      label: 'Relatórios',
      badge: null,
      color: 'indigo'
    },
    { 
      path: '/user-withdrawals', 
      icon: CreditCard, 
      label: 'Saques',
      badge: null,
      color: 'green'
    },
  ];

  const menuItems = userRole === 'admin' ? adminMenuItems : userMenuItems;
  const isActiveRoute = (path: string) => location.pathname === path;

  const getColorClasses = (color: string, isActive: boolean) => {
    const colors = {
      blue: isActive ? 'bg-blue-600 text-white' : 'text-blue-600 bg-blue-50 hover:bg-blue-100',
      purple: isActive ? 'bg-purple-600 text-white' : 'text-purple-600 bg-purple-50 hover:bg-purple-100',
      green: isActive ? 'bg-green-600 text-white' : 'text-green-600 bg-green-50 hover:bg-green-100',
      orange: isActive ? 'bg-orange-600 text-white' : 'text-orange-600 bg-orange-50 hover:bg-orange-100',
      cyan: isActive ? 'bg-cyan-600 text-white' : 'text-cyan-600 bg-cyan-50 hover:bg-cyan-100',
      yellow: isActive ? 'bg-yellow-600 text-white' : 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100',
      indigo: isActive ? 'bg-indigo-600 text-white' : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100',
      pink: isActive ? 'bg-pink-600 text-white' : 'text-pink-600 bg-pink-50 hover:bg-pink-100',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <Sidebar collapsible="icon" className="border-none">
      {/* Header */}
      <SidebarHeader className="border-b border-gray-100 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Coins className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
              <Dot className="w-2 h-2 text-white" />
            </div>
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <h1 className="text-lg font-bold text-gray-900">PIX Mikro</h1>
            <div className="flex items-center gap-2 text-sm">
              {userRole === 'admin' ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span className="text-gray-600 font-medium">Admin Panel</span>
                </>
              ) : (
                <>
                  <Users2 className="w-4 h-4 text-purple-600" />
                  <span className="text-gray-600 font-medium">Cliente</span>
                </>
              )}
            </div>
          </div>
        </div>
      </SidebarHeader>

      {/* Content */}
      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {userRole === 'admin' ? 'Administração' : 'Menu Principal'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
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
                          w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 
                          ${isActive 
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-[1.02]' 
                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                          }
                        `}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className={`
                            w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 shrink-0
                            ${isActive 
                              ? 'bg-white/20' 
                              : getColorClasses(item.color, false)
                            }
                          `}>
                            <item.icon className={`
                              w-4 h-4 transition-all duration-200
                              ${isActive ? 'text-white' : ''}
                            `} />
                          </div>
                          <span className="font-medium text-sm group-data-[collapsible=icon]:hidden truncate">
                            {item.label}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
                          {item.badge && (
                            <div className={`
                              w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold
                              ${isActive ? 'bg-white/20 text-white' : 'bg-red-500 text-white'}
                            `}>
                              {item.badge}
                            </div>
                          )}
                          {isActive && (
                            <ChevronRight className="w-4 h-4 text-white/80" />
                          )}
                        </div>
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
            <SidebarGroupLabel className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider group-data-[collapsible=icon]:hidden">
              Ações Rápidas
            </SidebarGroupLabel>
            <SidebarGroupContent className="group-data-[collapsible=icon]:hidden">
              <div className="grid grid-cols-2 gap-2 px-3">
                <button className="flex flex-col items-center gap-1 p-2 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                  <Users2 className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-medium text-green-700">Novo User</span>
                </button>
                <button className="flex flex-col items-center gap-1 p-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                  <Server className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-medium text-blue-700">Add Router</span>
                </button>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-gray-100 p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              asChild
              tooltip={state === 'collapsed' ? 'Sair' : undefined}
              className="group/logout h-auto p-0"
            >
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 p-3 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200 group"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-100 group-hover:bg-red-200 transition-colors shrink-0">
                  <LogOut className="w-4 h-4" />
                </div>
                <span className="font-medium text-sm group-data-[collapsible=icon]:hidden">
                  Sair
                </span>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Status */}
        <div className="mt-3 p-3 bg-gray-50 rounded-lg group-data-[collapsible=icon]:hidden">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600 font-medium">Sistema</span>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-600 font-medium">Online</span>
            </div>
          </div>
          <div className="mt-1 text-xs text-gray-500">
            v2.1.0 • Atualizado hoje
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
