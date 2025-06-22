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
  ChevronDown,
  Building2,
  Shield,
  Crown,
  Sparkles,
  Activity,
  Database,
  Globe,
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

  // Simplified menu items for admin
  const adminMenuItems = [
    {
      key: 'dashboard',
      title: 'Dashboard',
      icon: Home,
      url: '/dashboard',
      description: 'Visão geral do sistema'
    },
    {
      key: 'gestao',
      title: 'Gestão Central',
      icon: Settings,
      description: 'Administração do sistema',
      items: [
        {
          title: 'Usuários',
          icon: Users,
          url: '/users',
          description: 'Gerenciar clientes'
        },
        {
          title: 'Mikrotiks',
          icon: Router,
          url: '/mikrotiks',
          description: 'Equipamentos de rede'
        },
        {
          title: 'Senhas',
          icon: Key,
          url: '/passwords',
          description: 'Credenciais de acesso'
        },
        {
          title: 'MACs Coletados',
          icon: Wifi,
          url: '/macs',
          description: 'Dispositivos registrados'
        },
      ],
    },
    {
      key: 'financeiro',
      title: 'Centro Financeiro',
      icon: CreditCard,
      description: 'Gestão financeira avançada',
      items: [
        {
          title: 'Saques',
          icon: CreditCard,
          url: '/withdrawals',
          badge: '3',
          description: 'Solicitações pendentes'
        },
        {
          title: 'Relatórios',
          icon: BarChart3,
          url: '/reports',
          description: 'Analytics & insights'
        },
      ],
    },
  ];

  // Simplified menu items for clients
  const clientMenuItems = [
    {
      key: 'dashboard',
      title: 'Meu Dashboard',
      icon: LayoutDashboard,
      url: '/user-dashboard',
      description: 'Seu painel pessoal'
    },
    {
      key: 'reports',
      title: 'Meus Relatórios',
      icon: BarChart3,
      url: '/user-reports',
      description: 'Análises personalizadas'
    },
    {
      key: 'withdrawals',
      title: 'Meus Saques',
      icon: CreditCard,
      url: '/user-withdrawals',
      description: 'Histórico de retiradas'
    },
  ];

  const menuItems = userRole === 'admin' ? adminMenuItems : clientMenuItems;

  return (
    <Sidebar className="border-r border-slate-200 bg-slate-50 dark:bg-slate-900 dark:border-slate-700">
      {/* Clean Header */}
      <SidebarHeader className="border-b border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              PIX Mikro
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">Enterprise CRM</p>
          </div>
          {userRole === 'admin' && (
            <Crown className="w-5 h-5 text-yellow-500" />
          )}
        </div>
        
        {/* User Info */}
        <div className="mt-4 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-xl">
              {userRole === 'admin' ? (
                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              ) : (
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {userRole === 'admin' ? 'Super Admin' : 'Cliente Premium'}
              </p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-xs text-slate-500 dark:text-slate-400">Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mt-4 relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar rapidamente..."
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>
      </SidebarHeader>

      <SidebarContent className="p-4 space-y-2">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.key}>
              {item.items ? (
                // Menu with submenu
                <div className="space-y-1">
                  <button
                    onClick={() => toggleMenu(item.key)}
                    className="w-full group"
                  >
                    <div className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <item.icon className="w-5 h-5" />
                      <div className="flex-1 text-left">
                        <div className="font-medium">{item.title}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{item.description}</div>
                      </div>
                      <ChevronDown className={`w-4 h-4 transition-transform ${expandedMenus.has(item.key) ? 'rotate-180' : ''}`} />
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
                                `flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                                  isActive
                                    ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                                }`
                              }
                            >
                              <subItem.icon className="w-4 h-4" />
                              <div className="flex-1">
                                <div className="font-medium">{subItem.title}</div>
                                <div className="text-xs opacity-75">{subItem.description}</div>
                              </div>
                              {subItem.badge && (
                                <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-400">
                                  {subItem.badge}
                                </Badge>
                              )}
                            </NavLink>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  )}
                </div>
              ) : (
                // Direct menu item
                <SidebarMenuButton asChild>
                  <NavLink
                    to={item.url}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-3 text-sm rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                      }`
                    }
                  >
                    <item.icon className="w-5 h-5" />
                    <div className="flex-1">
                      <div className="font-medium">{item.title}</div>
                      <div className="text-xs opacity-75">{item.description}</div>
                    </div>
                  </NavLink>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-slate-200 dark:border-slate-700">
        <div className="space-y-4">
          {/* System Status */}
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-medium text-green-800 dark:text-green-400">Status do Sistema</span>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-700 dark:text-green-400">Ótimo</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Database className="w-3 h-3 text-green-600 dark:text-green-400" />
                  <span className="text-green-800 dark:text-green-300">Database</span>
                </div>
                <span className="text-green-700 dark:text-green-400 font-medium">OK</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Globe className="w-3 h-3 text-green-600 dark:text-green-400" />
                  <span className="text-green-800 dark:text-green-300">API</span>
                </div>
                <span className="text-green-700 dark:text-green-400 font-medium">Fast</span>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full justify-start gap-3 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-700 hover:text-red-700 dark:hover:text-red-400"
          >
            <LogOut className="w-4 h-4" />
            <div className="text-left">
              <div className="font-medium">Sair do Sistema</div>
              <div className="text-xs opacity-75">Logout seguro</div>
            </div>
          </Button>

          {/* Version Info */}
          <div className="text-center text-xs text-slate-500 dark:text-slate-400 space-y-1">
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
