import React from 'react';
import AppSidebar from './AppSidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';

interface LayoutProps {
  children: React.ReactNode;
  userRole: 'admin' | 'user';
  onLogout: () => void;
}

const Layout = ({ children, userRole, onLogout }: LayoutProps) => {
  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full bg-gray-50">
        <AppSidebar userRole={userRole} onLogout={onLogout} />
        <SidebarInset className="flex-1 flex flex-col min-w-0">
          <header className="flex h-14 md:h-16 shrink-0 items-center gap-2 border-b border-gray-200 px-3 md:px-4 bg-white">
            <SidebarTrigger className="-ml-1 p-1.5 md:p-2" />
            <div className="flex-1 min-w-0">
              <h2 className="text-base md:text-lg font-semibold text-gray-900 truncate">Sistema CRM</h2>
              <p className="text-xs md:text-sm text-gray-600 hidden sm:block">Painel de controle</p>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <div className="w-7 h-7 md:w-8 md:h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-medium">
                  {userRole === 'admin' ? 'A' : 'U'}
                </span>
              </div>
              <div className="hidden sm:block">
                <p className="text-xs md:text-sm font-medium text-gray-900 capitalize">{userRole}</p>
                <p className="text-xs text-green-600">Online</p>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Layout;
