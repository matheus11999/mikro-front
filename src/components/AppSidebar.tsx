import React from 'react';
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
  Shield
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

  // Menu items for admin
  const adminMenuItems = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      url: '/dashboard',
      badge: null,
    },
    {
      title: 'Gestão',
      icon: Settings,
      items: [
        {
          title: 'Usuários',
          icon: Users,
          url: '/users',
          badge: null,
        },
        {
          title: 'Mikrotiks',
          icon: Router,
          url: '/mikrotiks',
          badge: null,
        },
        {
          title: 'Senhas',
          icon: Key,
          url: '/passwords',
          badge: null,
        },
        {
          title: 'MACs Coletados',
          icon: Wifi,
          url: '/macs',
          badge: null,
        },
      ],
    },
    {
      title: 'Financeiro',
      icon: CreditCard,
      items: [
        {
          title: 'Saques',
          icon: CreditCard,
          url: '/withdrawals',
          badge: { text: '3', variant: 'orange' },
        },
        {
          title: 'Relatórios',
          icon: BarChart3,
          url: '/reports',
          badge: null,
        },
      ],
    },
  ];

  // Menu items for client
  const clientMenuItems = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      url: '/user-dashboard',
      badge: null,
    },
    {
      title: 'Relatórios',
      icon: BarChart3,
      url: '/user-reports',
      badge: null,
    },
    {
      title: 'Meus Saques',
      icon: CreditCard,
      url: '/user-withdrawals',
      badge: null,
    },
  ];

  const menuItems = userRole === 'admin' ? adminMenuItems : clientMenuItems;

  const getBadgeVariant = (variant: string) => {
    const variants = {
      orange: 'bg-orange-100 text-orange-800 border-orange-200',
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      green: 'bg-green-100 text-green-800 border-green-200',
    };
    return variants[variant as keyof typeof variants] || variants.blue;
  };

  return (
    <Sidebar className="border-r-0 bg-white shadow-sm">
      <SidebarHeader className="border-b border-gray-100 p-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-xl">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900">PIX Mikro</h1>
            <p className="text-sm text-gray-500">CRM System</p>
          </div>
        </div>
        
        {/* User Info */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
              {userRole === 'admin' ? (
                <Shield className="w-4 h-4 text-blue-600" />
              ) : (
                <Users className="w-4 h-4 text-blue-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {userRole === 'admin' ? 'Administrador' : 'Cliente'}
              </p>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-gray-500">Online</span>
              </div>
            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-4">
        <SidebarMenu>
          {menuItems.map((item, index) => (
            <SidebarMenuItem key={index}>
              {item.items ? (
                // Menu with submenu
                <div className="space-y-1">
                  <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 rounded-lg">
                    <item.icon className="w-4 h-4" />
                    <span className="flex-1">{item.title}</span>
                  </div>
                  <SidebarMenuSub>
                    {item.items.map((subItem, subIndex) => (
                      <SidebarMenuSubItem key={subIndex}>
                        <SidebarMenuSubButton asChild>
                          <NavLink
                            to={subItem.url}
                            className={({ isActive }) =>
                              `flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                                isActive
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                              }`
                            }
                          >
                            <subItem.icon className="w-4 h-4" />
                            <span className="flex-1">{subItem.title}</span>
                            {subItem.badge && (
                              <Badge className={getBadgeVariant(subItem.badge.variant)}>
                                {subItem.badge.text}
                              </Badge>
                            )}
                            <ChevronRight className="w-3 h-3 opacity-50" />
                          </NavLink>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </div>
              ) : (
                // Direct menu item
                <SidebarMenuButton asChild>
                  <NavLink
                    to={item.url}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`
                    }
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="flex-1">{item.title}</span>
                    {item.badge && (
                      <Badge className={getBadgeVariant(item.badge.variant)}>
                        {item.badge.text}
                      </Badge>
                    )}
                    <ChevronRight className="w-3 h-3 opacity-50" />
                  </NavLink>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-gray-100">
        <div className="space-y-2">
          <Separator />
          
          {/* System Status */}
          <div className="px-3 py-2">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
              <span>Status do Sistema</span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Database</span>
                <span className="text-green-600 font-medium">Online</span>
              </div>
              <div className="flex justify-between">
                <span>API</span>
                <span className="text-green-600 font-medium">OK</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Logout Button */}
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start gap-3 text-gray-700 hover:text-red-700 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4" />
            Sair do Sistema
          </Button>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
};

export default AppSidebar;
