import React from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from './AppSidebar';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { Menu, Bell, Search, User } from 'lucide-react';
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
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar userRole={userRole} onLogout={onLogout} />
        
        <SidebarInset className="flex-1">
          {/* Header */}
          <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200/50 shadow-sm animate-slide-in">
            <div className="flex h-16 items-center justify-between px-4 lg:px-6">
              {/* Left side - Trigger and Breadcrumb */}
              <div className="flex items-center gap-3">
                <SidebarTrigger className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </SidebarTrigger>
                
                <div className="hidden md:block">
                  <Breadcrumb>
                    <BreadcrumbList>
                      {breadcrumbs.map((breadcrumb, index) => (
                        <React.Fragment key={breadcrumb.path}>
                          <BreadcrumbItem>
                            {breadcrumb.isLast ? (
                              <BreadcrumbPage className="font-medium text-gray-900">
                                {breadcrumb.name}
                              </BreadcrumbPage>
                            ) : (
                              <BreadcrumbLink 
                                href={breadcrumb.path}
                                className="text-gray-600 hover:text-gray-900 transition-colors"
                              >
                                {breadcrumb.name}
                              </BreadcrumbLink>
                            )}
                          </BreadcrumbItem>
                          {!breadcrumb.isLast && <BreadcrumbSeparator />}
                        </React.Fragment>
                      ))}
                    </BreadcrumbList>
                  </Breadcrumb>
                </div>

                {/* Mobile title */}
                <div className="md:hidden">
                  <h1 className="text-lg font-semibold text-gray-900">
                    {breadcrumbs[breadcrumbs.length - 1]?.name || 'Dashboard'}
                  </h1>
                </div>
              </div>

              {/* Right side - Actions */}
              <div className="flex items-center gap-2 md:gap-4">
                {/* Search - Desktop only */}
                <button className="hidden lg:flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-gray-100/80 hover:bg-gray-200/80 rounded-lg transition-colors">
                  <Search className="h-4 w-4" />
                  <span className="hidden xl:inline">Buscar...</span>
                </button>

                {/* Notifications */}
                <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                  <Bell className="h-5 w-5" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></div>
                </button>

                {/* User menu */}
                <div className="flex items-center gap-2 px-2 py-1 rounded-lg border border-gray-200 bg-gray-50/50">
                  <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="hidden sm:block text-xs">
                    <p className="font-medium text-gray-900 capitalize">
                      {userRole === 'admin' ? 'Admin' : 'Cliente'}
                    </p>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-500">Online</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Mobile search bar */}
            <div className="lg:hidden px-4 pb-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-100/80 rounded-lg">
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
          <main className="flex-1 p-4 lg:p-6 space-y-6 animate-fade-in">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>

          {/* Footer */}
          <footer className="border-t border-gray-200/50 bg-white/80 backdrop-blur-sm px-4 lg:px-6 py-4 animate-slide-in">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-4">
                  <p>© 2024 PIX Mikro CRM</p>
                  <Separator orientation="vertical" className="h-4 hidden sm:block" />
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Todos os sistemas operacionais</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-xs">
                  <span>v2.1.0</span>
                  <Separator orientation="vertical" className="h-4" />
                  <span>Última atualização: hoje</span>
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
