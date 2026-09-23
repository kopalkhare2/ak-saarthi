'use client';

import { useState } from 'react';
import Sidebar from '@/components/ui/sidebar';
import Topbar from '@/components/ui/topbar';
import LoadingScreen from '@/components/ui/loading-screen';
import { AppProvider, useApp } from '@/contexts/app-context';

function AdvisorShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const { isLoading } = useApp();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar collapsed={collapsed} onToggleCollapsed={() => setCollapsed((c) => !c)} />
      <div
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
          collapsed ? 'ml-[68px]' : 'ml-[240px]'
        }`}
      >
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6 gradient-surface">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AdvisorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppProvider>
      <AdvisorShell>{children}</AdvisorShell>
    </AppProvider>
  );
}
