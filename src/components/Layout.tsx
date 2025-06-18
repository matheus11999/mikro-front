
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
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full">
        <AppSidebar userRole={userRole} onLogout={onLogout} />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b border-gray-200 px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900">Sistema CRM</h2>
              <p className="text-sm text-gray-600">Painel de controle</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-medium">
                  {userRole === 'admin' ? 'A' : 'U'}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 capitalize">{userRole}</p>
                <p className="text-xs text-green-600">Online</p>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Layout;
