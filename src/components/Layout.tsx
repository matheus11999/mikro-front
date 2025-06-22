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
          {/* Modern Header */}
          <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-700/80 shadow-sm">
            <div className="flex h-16 items-center justify-between px-4 lg:px-6">
              {/* Left side - Trigger and Breadcrumb */}
              <div className="flex items-center gap-4">
                <SidebarTrigger className="lg:hidden -ml-1 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  <Menu className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                </SidebarTrigger>
                
                {/* Breadcrumb - Desktop */}
                <div className="hidden md:block">
                  <Breadcrumb>
                    <BreadcrumbList>
                      {breadcrumbs.map((breadcrumb, index) => (
                        <React.Fragment key={breadcrumb.path}>
                          <BreadcrumbItem>
                            {breadcrumb.isLast ? (
                              <BreadcrumbPage className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                <Zap className="w-4 h-4 text-blue-600" />
                                {breadcrumb.name}
                              </BreadcrumbPage>
                            ) : (
                              <BreadcrumbLink 
                                href={breadcrumb.path}
                                className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
                              >
                                {breadcrumb.name}
                              </BreadcrumbLink>
                            )}
                          </BreadcrumbItem>
                          {!breadcrumb.isLast && <BreadcrumbSeparator className="text-slate-400 dark:text-slate-500" />}
                        </React.Fragment>
                      ))}
                    </BreadcrumbList>
                  </Breadcrumb>
                </div>

                {/* Mobile title */}
                <div className="md:hidden flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-600" />
                  <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {breadcrumbs[breadcrumbs.length - 1]?.name || 'Dashboard'}
                  </h1>
                </div>
              </div>

              {/* Right side - Actions */}
              <div className="flex items-center gap-3">
                {/* Search - Desktop only */}
                <div className="hidden lg:flex relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar..."
                      className="pl-10 pr-4 py-2 text-sm bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 transition-all w-64"
                    />
                  </div>
                </div>

                {/* Quick actions */}
                <div className="flex items-center gap-1">
                  {/* Help */}
                  <button className="p-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-lg transition-colors">
                    <HelpCircle className="h-5 w-5" />
                  </button>

                  {/* Settings */}
                  <button className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                    <Settings className="h-5 w-5" />
                  </button>

                  {/* Notifications */}
                  <button className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-lg transition-colors">
                    <Bell className="h-5 w-5" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-900">
                      <div className="w-full h-full bg-red-500 rounded-full animate-ping"></div>
                    </div>
                  </button>
                </div>

                {/* User menu */}
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="hidden sm:block text-sm">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {userRole === 'admin' ? 'Administrador' : 'Cliente'}
                    </p>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-slate-500 dark:text-slate-400 text-xs">Online</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Mobile search bar */}
            <div className="lg:hidden px-4 pb-4">
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-100/80 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700">
                <Search className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  className="flex-1 bg-transparent text-sm text-slate-700 dark:text-slate-300 placeholder-slate-500 dark:placeholder-slate-400 outline-none"
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

          {/* Modern Footer */}
          <footer className="border-t border-slate-200/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <div className="px-4 lg:px-6 py-4">
              <div className="max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
                  <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
                        <Zap className="w-3 h-3 text-white" />
                      </div>
                      <span className="font-medium">PIX Mikro CRM</span>
                    </div>
                    <Separator orientation="vertical" className="h-4 hidden sm:block border-slate-300 dark:border-slate-600" />
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Todos os sistemas operacionais</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-medium">v3.0.0</span>
                    <Separator orientation="vertical" className="h-3 border-slate-300 dark:border-slate-600" />
                    <span>Última atualização hoje</span>
                    <Separator orientation="vertical" className="h-3 border-slate-300 dark:border-slate-600" />
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
