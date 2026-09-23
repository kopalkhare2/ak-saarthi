'use client';

import { useApp } from '@/contexts/app-context';
import StatCard from '@/components/ui/stat-card';
import Badge from '@/components/ui/badge';
import { formatCurrency, daysFromNow, getFullName } from '@/lib/utils';
import Link from 'next/link';
import {
  Users,
  Shield,
  DollarSign,
  Wallet,
  AlertTriangle,
  RefreshCw,
  Calendar,
  CheckSquare,
  TrendingUp,
  ArrowRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const PIE_COLORS = ['#facc15', '#3b82f6', '#22c55e', '#ef4444', '#a855f7', '#f97316', '#06b6d4'];

export default function AdvisorDashboard() {
  const { clients, policies, investments, commissions, appointments, tasks } = useApp();

  // Stats
  const activePolicies = policies.filter((p) => p.status === 'active').length;
  const monthlyRevenue = commissions
    .filter((c) => {
      const now = new Date();
      const m = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      return c.month === m;
    })
    .reduce((sum, c) => sum + c.amount, 0);
  const premiumsDue = policies.filter((p) => {
    const d = daysFromNow(p.dueDate);
    return d >= 0 && d <= 30 && p.status === 'active';
  }).length;
  const upcomingRenewals = policies.filter((p) => p.renewalStatus === 'due').length;
  const todayAppts = appointments.filter((a) => a.date === new Date().toISOString().split('T')[0] && a.status === 'scheduled').length;
  const pendingTasks = tasks.filter((t) => t.status !== 'done').length;

  // Revenue chart data (last 6 months)
  const revenueData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const revenue = commissions.filter((c) => c.month === m).reduce((s, c) => s + c.amount, 0);
    return {
      month: d.toLocaleDateString('en-IN', { month: 'short' }),
      revenue,
    };
  });

  // Policy distribution
  const policyDist = policies.reduce(
    (acc, p) => {
      const label = p.type.charAt(0).toUpperCase() + p.type.slice(1).replace('_', ' ');
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  const pieData = Object.entries(policyDist).map(([name, value]) => ({ name, value }));

  // Recent clients
  const recentClients = [...clients]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Upcoming renewals
  const renewalPolicies = policies
    .filter((p) => p.renewalStatus === 'due' && p.status === 'active')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  // Today's schedule
  const todaySchedule = appointments
    .filter((a) => a.date === new Date().toISOString().split('T')[0] && a.status === 'scheduled')
    .sort((a, b) => a.time.localeCompare(b.time));

  // Total AUM
  const totalAUM = investments.reduce((sum, i) => sum + i.currentValue, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold animate-fade-in">
            Welcome back, Advisor 👋
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Here&apos;s your business overview for today
          </p>
        </div>
        <div className="text-right text-sm text-slate-500">
          {new Date().toLocaleDateString('en-IN', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Clients"
          value={clients.length.toString()}
          icon={<Users size={20} />}
          trend={{ value: 12, label: 'vs last month' }}
          accent="bg-blue-500/10 text-blue-400"
          className="stagger-1"
        />
        <StatCard
          title="Active Policies"
          value={activePolicies.toString()}
          icon={<Shield size={20} />}
          trend={{ value: 8, label: 'vs last month' }}
          accent="bg-emerald-500/10 text-emerald-400"
          className="stagger-2"
        />
        <StatCard
          title="Monthly Revenue"
          value={formatCurrency(monthlyRevenue)}
          icon={<DollarSign size={20} />}
          trend={{ value: 15, label: 'vs last month' }}
          accent="bg-yellow-500/10 text-yellow-400"
          className="stagger-3"
        />
        <StatCard
          title="Total AUM"
          value={formatCurrency(totalAUM)}
          icon={<Wallet size={20} />}
          trend={{ value: 6, label: 'growth' }}
          accent="bg-purple-500/10 text-purple-400"
          className="stagger-4"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Premiums Due"
          value={premiumsDue.toString()}
          icon={<AlertTriangle size={20} />}
          accent="bg-amber-500/10 text-amber-400"
          className="stagger-5"
        />
        <StatCard
          title="Upcoming Renewals"
          value={upcomingRenewals.toString()}
          icon={<RefreshCw size={20} />}
          accent="bg-orange-500/10 text-orange-400"
          className="stagger-6"
        />
        <StatCard
          title="Today&apos;s Appointments"
          value={todayAppts.toString()}
          icon={<Calendar size={20} />}
          accent="bg-cyan-500/10 text-cyan-400"
          className="stagger-7"
        />
        <StatCard
          title="Pending Tasks"
          value={pendingTasks.toString()}
          icon={<CheckSquare size={20} />}
          accent="bg-rose-500/10 text-rose-400"
          className="stagger-8"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 card p-5 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Revenue Trend</h3>
              <p className="text-xs text-slate-500">Commission earnings over last 6 months</p>
            </div>
            <TrendingUp size={18} className="text-yellow-400" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f8fafc',
                  }}
                  formatter={(value: unknown) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#facc15"
                  strokeWidth={2.5}
                  dot={{ fill: '#facc15', r: 4 }}
                  activeDot={{ r: 6, fill: '#facc15' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Policy Distribution */}
        <div className="card p-5 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Policy Distribution</h3>
              <p className="text-xs text-slate-500">By type</p>
            </div>
            <Shield size={18} className="text-blue-400" />
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f8fafc',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs text-slate-400">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                />
                {d.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Clients */}
        <div className="card p-5 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Recent Clients</h3>
            <Link href="/advisor/clients" className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-3">
            {recentClients.map((c) => (
              <Link
                key={c.id}
                href={`/advisor/clients/${c.id}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/50 transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-yellow-400">
                  {c.firstName[0]}{c.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{getFullName(c.firstName, c.lastName)}</p>
                  <p className="text-xs text-slate-500">{c.city}</p>
                </div>
                <Badge
                  label={c.riskProfile}
                  variant={c.riskProfile === 'aggressive' ? 'error' : c.riskProfile === 'moderate' ? 'warning' : 'info'}
                  dot={false}
                />
              </Link>
            ))}
          </div>
        </div>

        {/* Upcoming Renewals */}
        <div className="card p-5 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Upcoming Renewals</h3>
            <Link href="/advisor/policies" className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-3">
            {renewalPolicies.map((p) => {
              const client = clients.find((c) => c.id === p.clientId);
              const days = daysFromNow(p.dueDate);
              return (
                <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/50 transition-colors">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${days <= 7 ? 'bg-red-500/20 text-red-400' : days <= 30 ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'
                    }`}>
                    {days}d
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{client ? getFullName(client.firstName, client.lastName) : 'Unknown'}</p>
                    <p className="text-xs text-slate-500">{p.company} · {p.policyNumber}</p>
                  </div>
                  <p className="text-sm font-semibold text-yellow-400">{formatCurrency(p.premium)}</p>
                </div>
              );
            })}
            {renewalPolicies.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-4">No upcoming renewals</p>
            )}
          </div>
        </div>

        {/* Today's Schedule */}
        <div className="card p-5 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Today&apos;s Schedule</h3>
            <Link href="/advisor/calendar" className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-3">
            {todaySchedule.map((a) => (
              <div key={a.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/50 transition-colors">
                <div className="flex flex-col items-center w-12 shrink-0">
                  <Clock size={14} className="text-slate-500 mb-0.5" />
                  <span className="text-xs font-medium text-slate-300">{a.time}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{a.title}</p>
                  <p className="text-xs text-slate-500">{a.clientName} · {a.duration}min</p>
                </div>
                <Badge
                  label={a.type.replace('_', ' ')}
                  variant={a.type === 'meeting' ? 'info' : a.type === 'call' ? 'success' : 'warning'}
                  dot={false}
                />
              </div>
            ))}
            {todaySchedule.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-4">No appointments today</p>
            )}
          </div>
        </div>
      </div>

      {/* AI Insight Card */}
      <div className="card p-5 animate-fade-in border-yellow-500/20">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-yellow-500/10 animate-pulse-glow">
            <Sparkles size={22} className="text-yellow-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-1 flex items-center gap-2">
              AI Insight
              <Badge label="Beta" variant="gold" dot={false} />
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              {premiumsDue > 0
                ? `You have ${premiumsDue} premium${premiumsDue > 1 ? 's' : ''} due within the next 30 days. Consider sending renewal reminders to avoid policy lapses.`
                : 'All premiums are up to date. Great job keeping your clients\' policies active!'}
              {' '}
              {upcomingRenewals > 0
                ? `${upcomingRenewals} policies are due for renewal — prioritize these to maintain your commission stream.`
                : ''}
            </p>
            <Link href="/advisor/ai" className="inline-flex items-center gap-1 text-xs text-yellow-400 hover:text-yellow-300 mt-3 font-medium">
              Open AI Assistant <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}