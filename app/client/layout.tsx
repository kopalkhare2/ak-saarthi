'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AppProvider, useApp } from '@/contexts/app-context';
import LoadingScreen from '@/components/ui/loading-screen';
import { getFullName, getInitials } from '@/lib/utils';
import {
  LayoutDashboard, Shield, TrendingUp,
  User, Sparkles, LogOut,
} from 'lucide-react';

const navItems = [
  { href: '/client/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { href: '/client/policies', label: 'My Policies', icon: <Shield size={20} /> },
  { href: '/client/investments', label: 'My Investments', icon: <TrendingUp size={20} /> },
  { href: '/client/profile', label: 'My Profile', icon: <User size={20} /> },
];

function ClientPortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  // proxy.ts already redirects unauthenticated/wrong-role requests to /login
  // before this ever renders; `clients[0]` is the signed-in client's own record.
  const { clients, isLoading } = useApp();
  const activeClient = clients[0];

  const clientName = activeClient ? getFullName(activeClient.firstName, activeClient.lastName) : 'Client';
  const initials = activeClient ? getInitials(activeClient.firstName, activeClient.lastName) : 'C';

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.push('/login');
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 h-screen w-[240px] flex flex-col border-r border-slate-800 bg-[var(--navy-950)] z-40">
        <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-800 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">Client Portal</h1>
            <p className="text-[10px] text-slate-500">AK Saarthi AI</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-2">
          <nav className="flex flex-col gap-0.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-link ${isActive ? 'active' : ''}`}
                >
                  <span className="sidebar-icon shrink-0">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-slate-800 py-3 px-2">
          <button onClick={handleSignOut} className="sidebar-link w-full text-left text-red-400 hover:text-red-300">
            <LogOut size={20} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden ml-[240px]">
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-[var(--navy-950)]/80 backdrop-blur-sm">
          <h2 className="font-semibold text-sm text-slate-400">Welcome, {clientName}</h2>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-sm font-bold text-blue-400">
              {initials}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 gradient-surface">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <ClientPortalShell>{children}</ClientPortalShell>
    </AppProvider>
  );
}
