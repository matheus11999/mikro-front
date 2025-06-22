import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Router,
  Key,
  Wifi,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  ChevronRight,
  Building2,
  Shield,
  Crown,
  Sparkles,
  Zap,
  Activity,
  TrendingUp,
  Database,
  Globe,
  Bell,
  Star,
  ChevronDown,
  Search,
  Home
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarFooter,
  SidebarRail,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/lib/supabaseClient';
import { useLogger } from '@/lib/logger';

interface AppSidebarProps {
  userRole: 'admin' | 'user';
  onLogout: () => void;
}

const AppSidebar: React.FC<AppSidebarProps> = ({ userRole, onLogout }) => {
  const log = useLogger('AppSidebar');
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set(['gestao', 'financeiro']));

  const handleLogout = async () => {
    try {
      log.info('User logout initiated');
      const { error } = await supabase.auth.signOut();
      if (error) {
        log.error('Logout error', error);
      } else {
        log.info('Logout successful');
      }
      onLogout();
    } catch (err) {
      log.error('Logout exception', err);
    }
  };

  const toggleMenu = (menuKey: string) => {
    const newExpanded = new Set(expandedMenus);
    if (newExpanded.has(menuKey)) {
      newExpanded.delete(menuKey);
    } else {
      newExpanded.add(menuKey);
    }
    setExpandedMenus(newExpanded);
  };

  // Enhanced menu items for admin with gradients and modern icons
  const adminMenuItems = [
    {
      key: 'dashboard',
      title: 'Dashboard',
      icon: Home,
      url: '/dashboard',
      badge: null,
      gradient: 'from-blue-500 to-blue-600',
      iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600',
      description: 'Visão geral do sistema'
    },
    {
      key: 'gestao',
      title: 'Gestão Central',
      icon: Settings,
      gradient: 'from-purple-500 to-indigo-600',
      iconBg: 'bg-gradient-to-br from-purple-500 to-indigo-600',
      description: 'Administração do sistema',
      items: [
        {
          title: 'Usuários',
          icon: Users,
          url: '/users',
          badge: null,
          gradient: 'from-green-400 to-emerald-500',
          description: 'Gerenciar clientes'
        },
        {
          title: 'Mikrotiks',
          icon: Router,
          url: '/mikrotiks',
          badge: null,
          gradient: 'from-blue-400 to-cyan-500',
          description: 'Equipamentos de rede'
        },
        {
          title: 'Senhas',
          icon: Key,
          url: '/passwords',
          badge: null,
          gradient: 'from-orange-400 to-red-500',
          description: 'Credenciais de acesso'
        },
        {
          title: 'MACs Coletados',
          icon: Wifi,
          url: '/macs',
          badge: null,
          gradient: 'from-indigo-400 to-purple-500',
          description: 'Dispositivos registrados'
        },
      ],
    },
    {
      key: 'financeiro',
      title: 'Centro Financeiro',
      icon: CreditCard,
      gradient: 'from-emerald-500 to-teal-600',
      iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-600',
      description: 'Gestão financeira avançada',
      items: [
        {
          title: 'Saques',
          icon: CreditCard,
          url: '/withdrawals',
          badge: { text: '3', variant: 'premium' },
          gradient: 'from-yellow-400 to-orange-500',
          description: 'Solicitações pendentes'
        },
        {
          title: 'Relatórios',
          icon: BarChart3,
          url: '/reports',
          badge: null,
          gradient: 'from-pink-400 to-rose-500',
          description: 'Analytics & insights'
        },
      ],
    },
  ];

  // Enhanced menu items for clients
  const clientMenuItems = [
    {
      key: 'dashboard',
      title: 'Meu Dashboard',
      icon: LayoutDashboard,
      url: '/user-dashboard',
      badge: null,
      gradient: 'from-blue-500 to-blue-600',
      iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600',
      description: 'Seu painel pessoal'
    },
    {
      key: 'reports',
      title: 'Meus Relatórios',
      icon: BarChart3,
      url: '/user-reports',
      badge: null,
      gradient: 'from-purple-500 to-indigo-600',
      iconBg: 'bg-gradient-to-br from-purple-500 to-indigo-600',
      description: 'Análises personalizadas'
    },
    {
      key: 'withdrawals',
      title: 'Meus Saques',
      icon: CreditCard,
      url: '/user-withdrawals',
      badge: null,
      gradient: 'from-emerald-500 to-teal-600',
      iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-600',
      description: 'Histórico de retiradas'
    },
  ];

  const menuItems = userRole === 'admin' ? adminMenuItems : clientMenuItems;

  const getBadgeStyle = (variant: string) => {
    const variants = {
      premium: 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 shadow-lg animate-pulse',
      orange: 'bg-gradient-to-r from-orange-400 to-red-500 text-white border-0',
      blue: 'bg-gradient-to-r from-blue-400 to-indigo-500 text-white border-0',
      green: 'bg-gradient-to-r from-green-400 to-emerald-500 text-white border-0',
    };
    return variants[variant as keyof typeof variants] || variants.blue;
  };

  return (
    <Sidebar className="border-r-0 bg-gradient-to-b from-slate-900 via-blue-900 to-indigo-900 shadow-2xl">
      {/* Premium Header */}
      <SidebarHeader className="border-b border-white/10 p-6 bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-xl">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl"></div>
          <div className="relative flex items-center gap-4 p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
            <div className="relative">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 rounded-xl shadow-lg">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <Crown className="w-2 h-2 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                PIX Mikro
              </h1>
              <div className="flex items-center gap-2">
                <p className="text-blue-200 text-sm">Enterprise CRM</p>
                <Sparkles className="w-3 h-3 text-yellow-400" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Enhanced User Info */}
        <div className="mt-4 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 rounded-2xl blur-sm"></div>
          <div className="relative p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl shadow-lg">
                  {userRole === 'admin' ? (
                    <Shield className="w-5 h-5 text-white" />
                  ) : (
                    <Users className="w-5 h-5 text-white" />
                  )}
                </div>
                {userRole === 'admin' && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                    <Crown className="w-2 h-2 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate flex items-center gap-2">
                  {userRole === 'admin' ? 'Super Admin' : 'Cliente Premium'}
                  {userRole === 'admin' && <Star className="w-3 h-3 text-yellow-400" />}
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-blue-200">Online • Conectado</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Search */}
        <div className="mt-4 relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar rapidamente..."
            className="w-full pl-10 pr-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
          />
        </div>
      </SidebarHeader>

      <SidebarContent className="p-4 space-y-3">
        <SidebarMenu>
          {menuItems.map((item, index) => (
            <SidebarMenuItem key={item.key}>
              {item.items ? (
                // Enhanced Menu with submenu
                <div className="space-y-2">
                  <button
                    onClick={() => toggleMenu(item.key)}
                    className="w-full group relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-white/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative flex items-center gap-3 px-4 py-3 text-sm font-semibold text-white rounded-xl transition-all duration-300 group-hover:bg-white/10">
                      <div className={`w-8 h-8 ${item.iconBg} rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <item.icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold">{item.title}</div>
                        <div className="text-xs text-blue-200 opacity-80">{item.description}</div>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-blue-200 transition-transform duration-300 ${expandedMenus.has(item.key) ? 'rotate-180' : ''}`} />
                    </div>
                  </button>
                  
                  {expandedMenus.has(item.key) && (
                    <SidebarMenuSub className="ml-4 space-y-1">
                      {item.items.map((subItem, subIndex) => (
                        <SidebarMenuSubItem key={subIndex}>
                          <SidebarMenuSubButton asChild>
                            <NavLink
                              to={subItem.url}
                              className={({ isActive }) =>
                                `group flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-all duration-300 relative overflow-hidden ${
                                  isActive
                                    ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm text-white border border-blue-500/30 shadow-lg'
                                    : 'text-blue-100 hover:bg-white/10 hover:text-white'
                                }`
                              }
                            >
                              {({ isActive }) => (
                                <>
                                  {isActive && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 animate-pulse"></div>
                                  )}
                                  <div className={`relative w-7 h-7 bg-gradient-to-br ${subItem.gradient} rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
                                    <subItem.icon className="w-4 h-4 text-white" />
                                  </div>
                                  <div className="flex-1 relative">
                                    <div className="font-medium">{subItem.title}</div>
                                    <div className="text-xs opacity-75">{subItem.description}</div>
                                  </div>
                                  {subItem.badge && (
                                    <Badge className={getBadgeStyle(subItem.badge.variant)}>
                                      {subItem.badge.text}
                                    </Badge>
                                  )}
                                  {isActive && <Activity className="w-3 h-3 text-blue-400 animate-pulse" />}
                                </>
                              )}
                            </NavLink>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  )}
                </div>
              ) : (
                // Enhanced Direct menu item
                <SidebarMenuButton asChild>
                  <NavLink
                    to={item.url}
                    className={({ isActive }) =>
                      `group flex items-center gap-4 px-4 py-4 text-sm rounded-xl transition-all duration-300 relative overflow-hidden ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm text-white border border-blue-500/30 shadow-xl'
                          : 'text-blue-100 hover:bg-white/10 hover:text-white'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 animate-pulse"></div>
                        )}
                        <div className={`relative w-10 h-10 ${item.iconBg} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                          <item.icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 relative">
                          <div className="font-semibold">{item.title}</div>
                          <div className="text-xs opacity-75">{item.description}</div>
                        </div>
                        {item.badge && (
                          <Badge className={getBadgeStyle(item.badge.variant)}>
                            {item.badge.text}
                          </Badge>
                        )}
                        {isActive && <Zap className="w-4 h-4 text-yellow-400 animate-pulse" />}
                      </>
                    )}
                  </NavLink>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-white/10 bg-gradient-to-r from-white/5 to-white/10">
        <div className="space-y-4">
          {/* Enhanced System Status */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl blur-sm"></div>
            <div className="relative p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
              <div className="flex items-center justify-between text-xs text-blue-200 mb-3">
                <span className="font-semibold">Status do Sistema</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-400 font-medium">Ótimo</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Database className="w-3 h-3 text-green-400" />
                    <span>Database</span>
                  </div>
                  <span className="text-green-400 font-medium">OK</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Globe className="w-3 h-3 text-green-400" />
                    <span>API</span>
                  </div>
                  <span className="text-green-400 font-medium">Fast</span>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Logout Button */}
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start gap-3 p-4 text-blue-100 hover:text-white hover:bg-gradient-to-r hover:from-red-500/20 hover:to-pink-500/20 hover:border-red-500/30 border border-white/20 rounded-xl backdrop-blur-sm transition-all duration-300 group"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <LogOut className="w-4 h-4 text-white" />
            </div>
            <div className="text-left">
              <div className="font-semibold">Sair do Sistema</div>
              <div className="text-xs opacity-75">Logout seguro</div>
            </div>
          </Button>

          {/* Version Info */}
          <div className="text-center text-xs text-blue-300/70 space-y-1">
            <div>PIX Mikro Enterprise v3.0</div>
            <div className="flex items-center justify-center gap-2">
              <span>99.9% Uptime</span>
              <span>•</span>
              <span>24/7 Support</span>
            </div>
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
};

export default AppSidebar;
