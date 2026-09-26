'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Shield,
  TrendingUp,
  DollarSign,
  BarChart3,
  FileText,
  Bot,
  Calendar,
  CheckSquare,
  FolderOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Calculator,
  ShieldAlert,
  UserCheck,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number | null;
}

const mainNav: NavItem[] = [
  { href: '/advisor/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { href: '/advisor/clients', label: 'Clients', icon: <Users size={20} /> },
  { href: '/advisor/policies', label: 'Policies', icon: <Shield size={20} /> },
  { href: '/advisor/investments', label: 'Investments', icon: <TrendingUp size={20} /> },
];

const businessNav: NavItem[] = [
  { href: '/advisor/commissions', label: 'Commissions', icon: <DollarSign size={20} /> },
  { href: '/advisor/analytics', label: 'Analytics', icon: <BarChart3 size={20} /> },
  { href: '/advisor/reports', label: 'Reports', icon: <FileText size={20} /> },
];

const toolsNav: NavItem[] = [
  { href: '/advisor/ai', label: 'AI Assistant', icon: <Bot size={20} /> },
  { href: '/advisor/presentations', label: 'Plan Presenter', icon: <Calculator size={20} /> },
  { href: '/advisor/greetings', label: 'Greetings & Posts', icon: <Sparkles size={20} /> },
  { href: '/advisor/calendar', label: 'Calendar', icon: <Calendar size={20} /> },
  { href: '/advisor/tasks', label: 'Tasks', icon: <CheckSquare size={20} /> },
  { href: '/advisor/documents', label: 'Documents', icon: <FolderOpen size={20} /> },
];

const bottomNav: NavItem[] = [
  { href: '/advisor/settings', label: 'Settings', icon: <Settings size={20} /> },
];

function NavSection({
  title,
  items,
  collapsed,
  pathname,
}: {
  title: string;
  items: NavItem[];
  collapsed: boolean;
  pathname: string;
}) {
  return (
    <div className="mb-6">
      {!collapsed && (
        <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
          {title}
        </p>
      )}
      <nav className="flex flex-col gap-0.5">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link ${isActive ? 'active' : ''} flex items-center justify-between`}
              title={collapsed ? item.label : undefined}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="sidebar-icon shrink-0">{item.icon}</span>
                {!collapsed && <span className="truncate">{item.label}</span>}
              </div>
              {!collapsed && item.badge && item.badge > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500 text-slate-950">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}

export default function Sidebar({
  collapsed = false,
  onToggleCollapsed = () => {},
}: SidebarProps) {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingRequests, setPendingRequests] = useState(0);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) return;
        const data = await res.json();
        const email = (data?.user?.email || '').toLowerCase().trim();
        if (email === 'kopalkhare2@gmail.com' || data?.user?.role === 'admin') {
          if (!active) return;
          setIsAdmin(true);

          try {
            const reqRes = await fetch('/api/advisor/requests');
            if (reqRes.ok) {
              const reqs = await reqRes.json();
              if (Array.isArray(reqs) && active) {
                setPendingRequests(reqs.filter((r) => r.status === 'pending').length);
              }
            }
          } catch {}
        }
      } catch {}
    })();
    return () => {
      active = false;
    };
  }, []);

  const adminNav: NavItem[] = [
    { href: '/admin/dashboard', label: 'Admin Dashboard', icon: <ShieldAlert size={20} className="text-amber-400" /> },
    {
      href: '/admin/requests',
      label: 'Advisor Requests',
      icon: <UserCheck size={20} className="text-amber-400" />,
      badge: pendingRequests > 0 ? pendingRequests : null,
    },
    { href: '/admin/advisors', label: 'Registered Advisors', icon: <Users size={20} className="text-amber-400" /> },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 h-screen flex flex-col border-r border-slate-800 bg-[var(--navy-950)] z-40 transition-all duration-300 ${
        collapsed ? 'w-[68px]' : 'w-[240px]'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-800 shrink-0">
        <div className="w-8 h-8 rounded-lg gradient-gold flex items-center justify-center shrink-0">
          <Sparkles size={18} className="text-slate-900" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-sm font-bold text-white truncate">AK Saarthi AI</h1>
            <p className="text-[10px] text-slate-500 truncate">Financial Advisor OS</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-2">
        {isAdmin && (
          <NavSection
            title="Administration"
            items={adminNav}
            collapsed={collapsed}
            pathname={pathname}
          />
        )}
        <NavSection title="Main" items={mainNav} collapsed={collapsed} pathname={pathname} />
        <NavSection title="Business" items={businessNav} collapsed={collapsed} pathname={pathname} />
        <NavSection title="Tools" items={toolsNav} collapsed={collapsed} pathname={pathname} />
      </div>

      {/* Bottom */}
      <div className="border-t border-slate-800 py-3 px-2">
        <NavSection title="" items={bottomNav} collapsed={collapsed} pathname={pathname} />
        <button
          onClick={onToggleCollapsed}
          className="sidebar-link w-full"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <span className="sidebar-icon shrink-0">
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </span>
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
