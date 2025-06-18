import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Router, 
  Key, 
  Wallet, 
  BarChart3, 
  Wifi,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen
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
  SidebarTrigger,
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
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/users', icon: Users, label: 'Usuários' },
    { path: '/mikrotiks', icon: Router, label: 'Mikrotiks' },
    { path: '/passwords', icon: Key, label: 'Senhas' },
    { path: '/macs', icon: Wifi, label: 'MACs Coletados' },
    { path: '/withdrawals', icon: Wallet, label: 'Saques' },
    { path: '/reports', icon: BarChart3, label: 'Relatórios' },
    { path: '/TestePix', icon: Key, label: 'Teste Pix' },
  ];

  const userMenuItems = [
    { path: '/user-dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/user-reports', icon: BarChart3, label: 'Relatórios' },
    { path: '/user-withdrawals', icon: Wallet, label: 'Saques' },
  ];

  const menuItems = userRole === 'admin' ? adminMenuItems : userMenuItems;
  const isActiveRoute = (path: string) => location.pathname === path;

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-bold">P</span>
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <h1 className="text-lg font-bold text-gray-900 truncate">PIX Mikro</h1>
            <p className="text-xs text-gray-500 capitalize truncate">{userRole}</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton 
                    asChild
                    isActive={isActiveRoute(item.path)}
                    tooltip={state === 'collapsed' ? item.label : undefined}
                  >
                    <button
                      onClick={() => navigate(item.path)}
                      className="w-full flex items-center gap-3"
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-gray-200 p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              asChild
              tooltip={state === 'collapsed' ? 'Sair' : undefined}
            >
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair</span>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
