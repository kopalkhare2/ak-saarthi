'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/contexts/app-context';
import { getFullName, daysFromNow } from '@/lib/utils';
import { Search, Bell, Plus, User, LogOut, ChevronDown, Calendar, ShieldAlert } from 'lucide-react';

interface NotificationItem {
  id: string;
  title: string;
  desc: string;
  type: 'due' | 'lapsed' | 'appt';
  link: string;
}

interface AdvisorIdentity {
  name: string;
  email: string;
}

export default function Topbar() {
  const router = useRouter();
  const { clients, policies, appointments } = useApp();
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [identity, setIdentity] = useState<AdvisorIdentity>({ name: 'Advisor', email: '' });

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const [meRes, profileRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/advisor/profile'),
        ]);
        const me = meRes.ok ? await meRes.json() : null;
        const profile = profileRes.ok ? await profileRes.json() : null;
        if (!active) return;
        setIdentity({
          name: profile?.name || 'Advisor',
          email: me?.user?.email || profile?.email || '',
        });
      } catch {
        // Keep the fallback identity — this is cosmetic, not a security boundary.
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  // Derived from existing app-context data — no separate fetch/effect needed.
  const notifications: NotificationItem[] = useMemo(() => {
    const list: NotificationItem[] = [];

    // 1. Policies due in next 30 days
    policies.forEach((p) => {
      const days = daysFromNow(p.dueDate);
      const client = clients.find((c) => c.id === p.clientId);
      const clientName = client ? getFullName(client.firstName, client.lastName) : 'Client';

      if (p.status === 'lapsed') {
        list.push({
          id: `notif-lapse-${p.id}`,
          title: 'Lapsed Policy Alert',
          desc: `${clientName}'s ${p.company} policy ${p.policyNumber} has lapsed.`,
          type: 'lapsed',
          link: `/advisor/policies?tab=lapsed`,
        });
      } else if (days >= 0 && days <= 30) {
        list.push({
          id: `notif-due-${p.id}`,
          title: 'Premium Due',
          desc: `${clientName}'s ${p.company} premium is due in ${days} days.`,
          type: 'due',
          link: `/advisor/policies?tab=renewals`,
        });
      }
    });

    // 2. Appointments scheduled for today
    const todayStr = new Date().toISOString().split('T')[0];
    appointments.forEach((a) => {
      if (a.status === 'scheduled' && a.date.startsWith(todayStr)) {
        const client = clients.find((c) => c.id === a.clientId);
        const clientName = client ? getFullName(client.firstName, client.lastName) : 'Client';
        list.push({
          id: `notif-appt-${a.id}`,
          title: 'Appointment Today',
          desc: `Meeting with ${clientName} at ${a.time}.`,
          type: 'appt',
          link: `/advisor/calendar`,
        });
      }
    });

    return list;
  }, [policies, clients, appointments]);

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    setShowQuickAdd(false);
    setShowProfile(false);
  };

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.push('/login');
    }
  };

  const initials = identity.name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'A';

  return (
    <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-[var(--navy-950)]/80 backdrop-blur-sm sticky top-0 z-30 no-print">
      {/* Search */}
      <div className="relative w-full max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder="Search clients, policies, investments..."
          className="input pl-10 bg-slate-900/50 border-slate-800 text-sm"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 ml-4">
        {/* Quick Add */}
        <div className="relative">
          <button
            onClick={() => { setShowQuickAdd(!showQuickAdd); setShowProfile(false); setShowNotifications(false); }}
            className="btn btn-primary text-xs py-2 px-3 animate-pulse-glow"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Quick Add</span>
          </button>
          {showQuickAdd && (
            <div className="absolute right-0 mt-2 w-48 card p-1 animate-fade-in z-50">
              <Link href="/advisor/clients/add" className="sidebar-link text-xs py-2" onClick={() => setShowQuickAdd(false)}>
                <User size={14} /> New Client
              </Link>
              <Link href="/advisor/policies" className="sidebar-link text-xs py-2" onClick={() => setShowQuickAdd(false)}>
                <Plus size={14} /> New Policy
              </Link>
              <Link href="/advisor/investments" className="sidebar-link text-xs py-2" onClick={() => setShowQuickAdd(false)}>
                <Plus size={14} /> New Investment
              </Link>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={toggleNotifications}
            className="relative p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Bell size={20} className={showNotifications ? 'text-yellow-400' : 'text-slate-400'} />
            {notifications.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold flex items-center justify-center text-white">
                {notifications.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 card p-3 animate-fade-in z-50 max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">Notifications</h4>
                {notifications.length > 0 && (
                  <span className="text-[10px] text-slate-500">{notifications.length} pending</span>
                )}
              </div>

              {notifications.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">No new notifications</p>
              ) : (
                <div className="space-y-2">
                  {notifications.map((n) => (
                    <Link
                      key={n.id}
                      href={n.link}
                      onClick={() => setShowNotifications(false)}
                      className="flex items-start gap-2.5 p-2 rounded hover:bg-slate-800/50 transition-colors"
                    >
                      <div className={`p-1.5 rounded mt-0.5 ${
                        n.type === 'lapsed' ? 'bg-red-500/10 text-red-400' :
                        n.type === 'appt' ? 'bg-blue-500/10 text-blue-400' :
                        'bg-yellow-500/10 text-yellow-400'
                      }`}>
                        {n.type === 'lapsed' ? <ShieldAlert size={14} /> :
                         n.type === 'appt' ? <Calendar size={14} /> :
                         <Bell size={14} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-200">{n.title}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed break-words">{n.desc}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => { setShowProfile(!showProfile); setShowQuickAdd(false); setShowNotifications(false); }}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <div className="w-8 h-8 rounded-full gradient-gold flex items-center justify-center text-sm font-bold text-slate-900">
              {initials}
            </div>
            <ChevronDown size={14} className="text-slate-500" />
          </button>
          {showProfile && (
            <div className="absolute right-0 mt-2 w-56 card p-3 animate-fade-in z-50">
              <div className="mb-3 pb-3 border-b border-slate-800">
                <p className="text-sm font-semibold">{identity.name}</p>
                <p className="text-xs text-slate-500">{identity.email}</p>
              </div>
              <Link href="/advisor/settings" className="sidebar-link text-sm py-2" onClick={() => setShowProfile(false)}>
                <User size={16} /> Profile & Settings
              </Link>
              <button onClick={handleSignOut} className="sidebar-link text-sm text-red-400 hover:text-red-300 py-2 w-full text-left">
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Click-away backdrop */}
      {(showQuickAdd || showProfile || showNotifications) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => { setShowQuickAdd(false); setShowProfile(false); setShowNotifications(false); }}
        />
      )}
    </header>
  );
}
