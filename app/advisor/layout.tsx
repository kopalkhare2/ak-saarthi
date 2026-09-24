'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const role = localStorage.getItem('ak_logged_in_role');
    if (role !== 'advisor') {
      router.push('/login');
    } else {
      setLoading(false);
    }
  }, [router]);

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

