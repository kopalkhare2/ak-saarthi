'use client';

import { useApp } from '@/contexts/app-context';
import { formatCurrency, getFullName, policyTypeLabels } from '@/lib/utils';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts';

const COLORS = ['#facc15', '#3b82f6', '#22c55e', '#ef4444', '#a855f7', '#f97316', '#06b6d4'];

const tooltipStyle = { background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' };

export default function AnalyticsPage() {
  const { clients, policies, commissions, investments } = useApp();

  // Client Growth (last 6 months)
  const clientGrowth = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const cutoff = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    const count = clients.filter((c) => new Date(c.createdAt) <= cutoff).length;
    return { month: d.toLocaleDateString('en-IN', { month: 'short' }), clients: count };
  });

  // Revenue Trend
  const revenueTrend = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return { month: d.toLocaleDateString('en-IN', { month: 'short' }), revenue: commissions.filter((c) => c.month === m).reduce((s, c) => s + c.amount, 0) };
  });

  // Premium Collection
  const premiumData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const m = d.getMonth();
    const total = policies.filter((p) => new Date(p.startDate).getMonth() <= m && p.status === 'active').reduce((s, p) => s + p.premium, 0);
    return { month: d.toLocaleDateString('en-IN', { month: 'short' }), premium: total };
  });

  // Policy Distribution by type
  const policyDist = policies.reduce((acc, p) => {
    const label = policyTypeLabels[p.type] || p.type;
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const pieData = Object.entries(policyDist).map(([name, value]) => ({ name, value }));

  // Company Performance
  const companyPerf = policies.reduce((acc, p) => {
    acc[p.company] = (acc[p.company] || 0) + p.premium;
    return acc;
  }, {} as Record<string, number>);
  const companyData = Object.entries(companyPerf).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, premium]) => ({ name, premium }));

  // Top clients
  const clientPremiums = clients.map((c) => ({
    name: getFullName(c.firstName, c.lastName),
    premium: policies.filter((p) => p.clientId === c.id).reduce((s, p) => s + p.premium, 0),
    investments: investments.filter((i) => i.clientId === c.id).reduce((s, i) => s + i.currentValue, 0),
  })).sort((a, b) => (b.premium + b.investments) - (a.premium + a.investments)).slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-slate-400 mt-1">Business performance insights</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Client Growth */}
        <div className="card p-5 animate-fade-in">
          <h3 className="font-semibold mb-4">Client Growth</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={clientGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="clients" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Trend */}
        <div className="card p-5 animate-fade-in">
          <h3 className="font-semibold mb-4">Revenue Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']} />
                <Line type="monotone" dataKey="revenue" stroke="#facc15" strokeWidth={2.5} dot={{ fill: '#facc15', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Premium Collection */}
        <div className="card p-5 animate-fade-in">
          <h3 className="font-semibold mb-4">Premium Collection</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={premiumData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown) => [formatCurrency(Number(v)), 'Premium']} />
                <Area type="monotone" dataKey="premium" stroke="#22c55e" fill="#22c55e" fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Policy Distribution */}
        <div className="card p-5 animate-fade-in">
          <h3 className="font-semibold mb-4">Policy Distribution</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Company Performance */}
        <div className="card p-5 animate-fade-in">
          <h3 className="font-semibold mb-4">Company Performance</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={companyData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke="#64748b" fontSize={12} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={11} width={100} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown) => [formatCurrency(Number(v)), 'Premium']} />
                <Bar dataKey="premium" fill="#a855f7" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Clients */}
        <div className="card p-5 animate-fade-in">
          <h3 className="font-semibold mb-4">Top Clients</h3>
          <div className="space-y-3">
            {clientPremiums.map((c, i) => (
              <div key={c.name} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
                <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center text-xs font-bold text-yellow-400">
                  #{i + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-slate-500">Premium: {formatCurrency(c.premium)} · Portfolio: {formatCurrency(c.investments)}</p>
                </div>
                <span className="text-sm font-semibold text-yellow-400">{formatCurrency(c.premium + c.investments)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
