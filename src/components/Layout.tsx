import React from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from './AppSidebar';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { Menu, Bell, Search, User, Settings, HelpCircle, Zap } from 'lucide-react';
import { useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  userRole: 'admin' | 'user';
  onLogout: () => void;
}

const Layout = ({ children, userRole, onLogout }: LayoutProps) => {
  const location = useLocation();

  // Generate breadcrumb based on current path
  const generateBreadcrumb = () => {
    const path = location.pathname;
    const segments = path.split('/').filter(Boolean);
    
    const breadcrumbMap: Record<string, string> = {
      'dashboard': 'Dashboard',
      'users': 'Usuários',
      'mikrotiks': 'Mikrotiks',
      'passwords': 'Senhas',
      'macs': 'MACs Coletados',
      'withdrawals': 'Saques',
      'reports': 'Relatórios',
      'TestePix': 'Teste PIX',
      'user-dashboard': 'Dashboard',
      'user-reports': 'Relatórios',
      'user-withdrawals': 'Saques',
    };

    if (segments.length === 0 || segments[0] === '') {
      return [{ name: 'Dashboard', path: '/dashboard' }];
    }

    return segments.map((segment, index) => ({
      name: breadcrumbMap[segment] || segment,
      path: '/' + segments.slice(0, index + 1).join('/'),
      isLast: index === segments.length - 1
    }));
  };

  const breadcrumbs = generateBreadcrumb();

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-gray-50/50">
        <AppSidebar userRole={userRole} onLogout={onLogout} />
        
        <SidebarInset className="flex-1 flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200/60 shadow-sm">
            <div className="flex h-16 items-center justify-between px-4 lg:px-6">
              {/* Left side - Trigger and Breadcrumb */}
              <div className="flex items-center gap-4">
                <SidebarTrigger className="lg:hidden -ml-1">
                  <Menu className="h-5 w-5" />
                </SidebarTrigger>
                
                {/* Breadcrumb - Desktop */}
                <div className="hidden md:block">
                  <Breadcrumb>
                    <BreadcrumbList>
                      {breadcrumbs.map((breadcrumb, index) => (
                        <React.Fragment key={breadcrumb.path}>
                          <BreadcrumbItem>
                            {breadcrumb.isLast ? (
                              <BreadcrumbPage className="font-semibold text-gray-900 flex items-center gap-2">
                                <Zap className="w-4 h-4 text-blue-600" />
                                {breadcrumb.name}
                              </BreadcrumbPage>
                            ) : (
                              <BreadcrumbLink 
                                href={breadcrumb.path}
                                className="text-gray-600 hover:text-blue-600 transition-colors font-medium"
                              >
                                {breadcrumb.name}
                              </BreadcrumbLink>
                            )}
                          </BreadcrumbItem>
                          {!breadcrumb.isLast && <BreadcrumbSeparator className="text-gray-400" />}
                        </React.Fragment>
                      ))}
                    </BreadcrumbList>
                  </Breadcrumb>
                </div>

                {/* Mobile title */}
                <div className="md:hidden flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-600" />
                  <h1 className="text-lg font-bold text-gray-900">
                    {breadcrumbs[breadcrumbs.length - 1]?.name || 'Dashboard'}
                  </h1>
                </div>
              </div>

              {/* Right side - Actions */}
              <div className="flex items-center gap-3">
                {/* Search - Desktop only */}
                <div className="hidden lg:flex relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar..."
                      className="pl-10 pr-4 py-2 text-sm bg-gray-100/80 hover:bg-gray-200/80 rounded-lg border-0 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all w-64"
                    />
                  </div>
                </div>

                {/* Quick actions */}
                <div className="flex items-center gap-1">
                  {/* Help */}
                  <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <HelpCircle className="h-5 w-5" />
                  </button>

                  {/* Settings */}
                  <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                    <Settings className="h-5 w-5" />
                  </button>

                  {/* Notifications */}
                  <button className="relative p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Bell className="h-5 w-5" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white">
                      <div className="w-full h-full bg-red-500 rounded-full animate-ping"></div>
                    </div>
                  </button>
                </div>

                {/* User menu */}
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-gray-200/80 bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="hidden sm:block text-sm">
                    <p className="font-semibold text-gray-900">
                      {userRole === 'admin' ? 'Administrador' : 'Cliente'}
                    </p>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-gray-500 text-xs">Online</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Mobile search bar */}
            <div className="lg:hidden px-4 pb-4">
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-100/80 rounded-lg border border-gray-200">
                <Search className="h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-500 outline-none"
                />
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="p-4 lg:p-6">
              <div className="max-w-7xl mx-auto space-y-6">
                {children}
              </div>
            </div>
          </main>

          {/* Footer */}
          <footer className="border-t border-gray-200/60 bg-white/80 backdrop-blur-sm">
            <div className="px-4 lg:px-6 py-4">
              <div className="max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
                  <div className="flex items-center gap-4 text-gray-600">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-gradient-to-br from-blue-600 to-purple-600 rounded flex items-center justify-center">
                        <Zap className="w-3 h-3 text-white" />
                      </div>
                      <span className="font-medium">PIX Mikro CRM</span>
                    </div>
                    <Separator orientation="vertical" className="h-4 hidden sm:block" />
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span>Todos os sistemas operacionais</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="font-medium">v2.1.0</span>
                    <Separator orientation="vertical" className="h-3" />
                    <span>Última atualização hoje</span>
                    <Separator orientation="vertical" className="h-3" />
                    <span>© 2024</span>
                  </div>
                </div>
              </div>
            </div>
          </footer>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Layout;
