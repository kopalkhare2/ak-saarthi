'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  UserCheck,
  Shield,
  TrendingUp,
  Clock,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Mail,
  Phone,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/metrics');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error('Failed to load admin metrics:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const stats = data?.stats || {};
  const recentRequests = data?.recentRequests || [];
  const advisors = data?.advisorsList || [];

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-800 rounded w-1/4"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-900 rounded-xl border border-slate-800"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Administrator Console
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Platform-wide governance, financial advisor onboarding, and tenant isolation overview.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/requests"
            className="btn bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm transition-all"
          >
            <UserCheck size={16} />
            <span>Manage Access Requests</span>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-2xl bg-[#0f172a]/70 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Registered Advisors</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">{stats.totalAdvisors ?? 0}</div>
          <p className="text-xs text-slate-500 mt-1">Independent advisors on platform</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0f172a]/70 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Requests</span>
            <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-red-400">{stats.pendingRequests ?? 0}</div>
          <Link href="/admin/requests" className="text-xs text-amber-400 hover:underline mt-1 inline-flex items-center gap-1">
            Review onboarding requests →
          </Link>
        </div>

        <div className="p-5 rounded-2xl bg-[#0f172a]/70 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Platform Clients</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">{stats.totalClients ?? 0}</div>
          <p className="text-xs text-slate-500 mt-1">Across all advisor workspaces</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0f172a]/70 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Policies</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Shield size={16} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">{stats.totalPolicies ?? 0}</div>
          <p className="text-xs text-slate-500 mt-1">Tracked across all insurers</p>
        </div>
      </div>

      {/* Two Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Access Requests */}
        <div className="p-6 rounded-2xl bg-[#0f172a]/60 border border-slate-800 flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <UserCheck size={18} className="text-amber-400" />
              Recent Advisor Requests
            </h2>
            <Link href="/admin/requests" className="text-xs text-amber-400 hover:text-amber-300 font-semibold">
              View All ({recentRequests.length})
            </Link>
          </div>

          <div className="space-y-3 flex-1">
            {recentRequests.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">No access requests submitted yet.</div>
            ) : (
              recentRequests.slice(0, 4).map((req: any) => (
                <div
                  key={req.id}
                  className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-200">{req.name}</p>
                    <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                      <span className="flex items-center gap-1"><Mail size={12} /> {req.email}</span>
                      <span className="flex items-center gap-1"><Phone size={12} /> {req.phone}</span>
                    </div>
                  </div>
                  <div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        req.status === 'approved'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : req.status === 'declined'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Advisors Overview */}
        <div className="p-6 rounded-2xl bg-[#0f172a]/60 border border-slate-800 flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Users size={18} className="text-blue-400" />
              Active Platform Advisors
            </h2>
            <Link href="/admin/advisors" className="text-xs text-blue-400 hover:text-blue-300 font-semibold">
              Manage All
            </Link>
          </div>

          <div className="space-y-3 flex-1">
            {advisors.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">No advisors registered yet.</div>
            ) : (
              advisors.slice(0, 4).map((adv: any) => (
                <div
                  key={adv.id}
                  className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-200">{adv.email}</p>
                    <p className="text-[11px] text-slate-500">
                      Joined: {new Date(adv.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-amber-400">{adv._count?.clients ?? 0}</span>
                    <span className="text-[10px] text-slate-400 ml-1">clients</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
