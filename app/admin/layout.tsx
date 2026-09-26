'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  ShieldAlert,
  Users,
  UserCheck,
  LayoutDashboard,
  LogOut,
  ExternalLink,
  Sparkles,
  Menu,
  X,
  Bell,
  ArrowRight,
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState('');
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkAdmin() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        const email = (data?.user?.email || session?.user?.email || '').toLowerCase().trim();

        // Admin check: kopalkhare2@gmail.com or role admin
        const isAdminUser = email === 'kopalkhare2@gmail.com' || data?.user?.role === 'admin';

        if (!active) return;
        if (isAdminUser) {
          setAdminEmail(email);
          setLoading(false);
          // Fetch pending requests count
          try {
            const reqRes = await fetch('/api/advisor/requests');
            if (reqRes.ok) {
              const reqs = await reqRes.json();
              if (Array.isArray(reqs)) {
                const pending = reqs.filter((r) => r.status === 'pending').length;
                setPendingCount(pending);
              }
            }
          } catch {}
        } else {
          // Non-admin: redirect to advisor or login
          router.push('/advisor/dashboard');
        }
      } catch {
        if (active) router.push('/login');
      }
    }

    if (status !== 'loading') {
      checkAdmin();
    }

    return () => {
      active = false;
    };
  }, [router, session, status]);

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.push('/login');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--navy-950)] text-white">
        <div className="text-center space-y-3 animate-pulse">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400">
            <ShieldAlert size={28} />
          </div>
          <p className="text-sm font-semibold tracking-wide text-slate-300">Verifying Admin Privileges...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    {
      href: '/admin/dashboard',
      label: 'Admin Overview',
      icon: <LayoutDashboard size={18} />,
    },
    {
      href: '/admin/requests',
      label: 'Advisor Requests',
      icon: <UserCheck size={18} />,
      badge: pendingCount > 0 ? pendingCount : null,
    },
    {
      href: '/admin/advisors',
      label: 'All Registered Advisors',
      icon: <Users size={18} />,
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--navy-950)] text-slate-100">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-slate-800 bg-[#070b14] z-30">
        {/* Brand */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-800/80">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-md">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h1 className="font-bold text-sm text-white tracking-tight flex items-center gap-1.5">
              Admin Console
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400/90 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
              Host / Administrator
            </span>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 py-5 px-3 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Platform Management
          </div>
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-amber-400' : 'text-slate-400'}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge ? (
                  <span className="bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full animate-pulse shadow-sm">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}

          <div className="pt-6 pb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Workspace Views
          </div>
          <Link
            href="/advisor/dashboard"
            className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-amber-300 hover:bg-amber-500/10 transition-all border border-transparent hover:border-amber-500/20"
          >
            <div className="flex items-center gap-3">
              <Sparkles size={18} className="text-amber-400" />
              <span>Advisor Workspace</span>
            </div>
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 space-y-3">
          <div className="flex items-center gap-2.5 text-xs text-slate-400 overflow-hidden">
            <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0">
              A
            </div>
            <span className="truncate font-mono">{adminEmail}</span>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-[#070b14]/90 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden text-slate-400 hover:text-white p-1"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                Admin Mode
              </span>
              <span className="text-xs text-slate-500 hidden sm:inline">• Multi-Advisor Management</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {pendingCount > 0 && (
              <Link
                href="/admin/requests"
                className="flex items-center gap-2 text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg hover:bg-red-500/20 transition-all font-medium"
              >
                <Bell size={14} className="animate-bounce" />
                <span>{pendingCount} Pending Request{pendingCount > 1 ? 's' : ''}</span>
              </Link>
            )}
            <Link
              href="/advisor/dashboard"
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg transition-all"
            >
              <span>Advisor Portal</span>
              <ExternalLink size={12} />
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#0b0f19]">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
