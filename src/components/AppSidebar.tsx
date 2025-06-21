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
  Banknote
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
      description: 'Visão geral do sistema'
    },
    { 
      path: '/users', 
      icon: Users2, 
      label: 'Usuários',
      description: 'Gerenciar clientes'
    },
    { 
      path: '/mikrotiks', 
      icon: Server, 
      label: 'Mikrotiks',
      description: 'Servidores de rede'
    },
    { 
      path: '/passwords', 
      icon: KeyRound, 
      label: 'Senhas',
      description: 'Credenciais de acesso'
    },
    { 
      path: '/macs', 
      icon: Wifi, 
      label: 'MACs Coletados',
      description: 'Endereços físicos'
    },
    { 
      path: '/withdrawals', 
      icon: Banknote, 
      label: 'Saques',
      description: 'Processamento de pagamentos'
    },
    { 
      path: '/reports', 
      icon: BarChart3, 
      label: 'Relatórios',
      description: 'Analytics e dados'
    },
    { 
      path: '/TestePix', 
      icon: Coins, 
      label: 'Teste PIX',
      description: 'Simulador de pagamentos'
    },
  ];

  const userMenuItems = [
    { 
      path: '/user-dashboard', 
      icon: LayoutDashboard, 
      label: 'Dashboard',
      description: 'Meu painel principal'
    },
    { 
      path: '/user-reports', 
      icon: TrendingUp, 
      label: 'Relatórios',
      description: 'Minhas estatísticas'
    },
    { 
      path: '/user-withdrawals', 
      icon: CreditCard, 
      label: 'Saques',
      description: 'Solicitar pagamentos'
    },
  ];

  const menuItems = userRole === 'admin' ? adminMenuItems : userMenuItems;
  const isActiveRoute = (path: string) => location.pathname === path;

  return (
    <Sidebar className="border-r-0">
      <SidebarHeader className="border-b border-sidebar-border/50 p-4 bg-gradient-to-r from-sidebar-background to-sidebar-accent/30">
        <div className="flex items-center gap-3 animate-slide-in">
          <div className="relative w-10 h-10 bg-gradient-primary rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
            <div className="absolute inset-0 bg-white/20 rounded-2xl"></div>
            <Coins className="w-6 h-6 text-white relative z-10" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <h1 className="text-lg font-bold text-sidebar-foreground truncate bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              PIX Mikro
            </h1>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {userRole === 'admin' ? (
                  <ShieldCheck className="w-3 h-3 text-blue-600" />
                ) : (
                  <Users2 className="w-3 h-3 text-purple-600" />
                )}
                <span className="text-xs text-sidebar-foreground/70 capitalize font-medium">
                  {userRole === 'admin' ? 'Administrador' : 'Cliente'}
                </span>
              </div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-sidebar">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60 font-semibold px-3 py-2">
            {userRole === 'admin' ? 'Administração' : 'Minha Conta'}
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-2">
            <SidebarMenu className="space-y-1">
              {menuItems.map((item, index) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton 
                    asChild
                    isActive={isActiveRoute(item.path)}
                    tooltip={state === 'collapsed' ? item.label : undefined}
                    className="group w-full"
                  >
                    <button
                      onClick={() => navigate(item.path)}
                      className={`
                        w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 
                        animate-fade-in hover:scale-[1.02] active:scale-[0.98]
                        ${isActiveRoute(item.path) 
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform' 
                          : 'text-sidebar-foreground hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-sidebar-foreground'
                        }
                      `}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className={`
                        w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200
                        ${isActiveRoute(item.path) 
                          ? 'bg-white/20 shadow-inner' 
                          : 'bg-sidebar-accent/50 group-hover:bg-gradient-to-r group-hover:from-blue-100 group-hover:to-purple-100'
                        }
                      `}>
                        <item.icon className={`
                          w-4 h-4 transition-all duration-200
                          ${isActiveRoute(item.path) 
                            ? 'text-white' 
                            : 'text-sidebar-foreground/70 group-hover:text-blue-600'
                          }
                        `} />
                      </div>
                      <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                        <span className="font-medium text-sm">{item.label}</span>
                        {!isActiveRoute(item.path) && (
                          <p className="text-xs text-sidebar-foreground/50 truncate mt-0.5">
                            {item.description}
                          </p>
                        )}
                      </div>
                      {isActiveRoute(item.path) && (
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse group-data-[collapsible=icon]:hidden"></div>
                      )}
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/50 p-4 bg-gradient-to-r from-sidebar-background to-sidebar-accent/30">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              asChild
              tooltip={state === 'collapsed' ? 'Sair' : undefined}
            >
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] group"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-100 group-hover:bg-red-200 transition-all duration-200">
                  <LogOut className="w-4 h-4" />
                </div>
                <span className="font-medium text-sm group-data-[collapsible=icon]:hidden">
                  Sair do Sistema
                </span>
                <div className="w-2 h-2 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 animate-pulse transition-opacity duration-200 group-data-[collapsible=icon]:hidden"></div>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Sistema info na versão expandida */}
        <div className="mt-3 px-3 py-2 bg-sidebar-accent/30 rounded-lg group-data-[collapsible=icon]:hidden">
          <div className="flex items-center justify-between text-xs">
            <span className="text-sidebar-foreground/60">v2.1.0</span>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sidebar-foreground/60">Online</span>
            </div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
