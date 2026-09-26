'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Sidebar from '@/components/ui/sidebar';
import Topbar from '@/components/ui/topbar';
import { AppProvider } from '@/contexts/app-context';
import { Sparkles } from 'lucide-react';

export default function AdvisorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return; // still fetching NextAuth session

    const localRole = localStorage.getItem('ak_logged_in_role');

    // Allow if NextAuth Google session has advisor role
    const nextAuthOk = session?.user && (session.user as any).role === 'advisor';
    // Allow if legacy email/password login set the localStorage key
    const legacyOk = localRole === 'advisor';

    if (nextAuthOk || legacyOk) {
      // Keep localStorage in sync so other components that read it work
      if (nextAuthOk && !legacyOk) {
        localStorage.setItem('ak_logged_in_role', 'advisor');
      }
      setLoading(false);
    } else if (session?.user && (session.user as any).role === 'client') {
      router.push('/client/dashboard');
    } else {
      router.push('/login');
    }
  }, [router, session, status]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--navy-950)] text-white">
        <div className="text-center space-y-2 animate-pulse">
          <Sparkles size={32} className="text-blue-500 mx-auto animate-spin" />
          <p className="text-sm text-slate-400">Loading portal...</p>
        </div>
      </div>
    );
  }

  return (
    <AppProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden ml-[240px] transition-all duration-300">
          <Topbar />
          <main className="flex-1 overflow-y-auto p-6 gradient-surface">
            {children}
          </main>
        </div>
      </div>
    </AppProvider>
  );
}
