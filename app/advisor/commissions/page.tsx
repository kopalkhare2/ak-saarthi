'use client';

import { useApp } from '@/contexts/app-context';
import StatCard from '@/components/ui/stat-card';
import Badge from '@/components/ui/badge';
import { formatCurrency, getFullName } from '@/lib/utils';
import { DollarSign, Wallet, Clock, CheckCircle } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function CommissionsPage() {
  const { clients, commissions } = useApp();

  const totalEarned = commissions.filter((c) => c.status === 'paid').reduce((s, c) => s + c.amount, 0);
  const totalPending = commissions.filter((c) => c.status === 'pending').reduce((s, c) => s + c.amount, 0);
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthlyTotal = commissions.filter((c) => c.month === thisMonth).reduce((s, c) => s + c.amount, 0);

  // Revenue by month (last 6)
  const chartData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const total = commissions.filter((c) => c.month === m).reduce((s, c) => s + c.amount, 0);
    return { month: d.toLocaleDateString('en-IN', { month: 'short' }), total };
  });

  // Company-wise
  const byCompany = commissions.reduce((acc, c) => {
    acc[c.company] = (acc[c.company] || 0) + c.amount;
    return acc;
  }, {} as Record<string, number>);
  const companyData = Object.entries(byCompany).sort((a, b) => b[1] - a[1]);

  // Pending list
  const pendingList = commissions.filter((c) => c.status === 'pending');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Commissions</h1>
        <p className="text-sm text-slate-400 mt-1">Track your earnings and pending payments</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="This Month" value={formatCurrency(monthlyTotal)} icon={<DollarSign size={20} />} accent="bg-yellow-500/10 text-yellow-400" />
        <StatCard title="Total Earned" value={formatCurrency(totalEarned)} icon={<Wallet size={20} />} accent="bg-emerald-500/10 text-emerald-400" />
        <StatCard title="Pending" value={formatCurrency(totalPending)} icon={<Clock size={20} />} accent="bg-amber-500/10 text-amber-400" />
        <StatCard title="Paid" value={commissions.filter((c) => c.status === 'paid').length.toString()} icon={<CheckCircle size={20} />} accent="bg-blue-500/10 text-blue-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart */}
        <div className="lg:col-span-2 card p-5 animate-fade-in">
          <h3 className="font-semibold mb-4">Revenue Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }} formatter={(v: unknown) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Commission']} />
                <Line type="monotone" dataKey="total" stroke="#facc15" strokeWidth={2.5} dot={{ fill: '#facc15', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Company-wise */}
        <div className="card p-5 animate-fade-in">
          <h3 className="font-semibold mb-4">Company-wise Breakdown</h3>
          <div className="space-y-3">
            {companyData.map(([company, amount]) => {
              const pct = totalEarned + totalPending > 0 ? (amount / (totalEarned + totalPending)) * 100 : 0;
              return (
                <div key={company}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">{company}</span>
                    <span className="text-yellow-400 font-medium">{formatCurrency(amount)}</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pending Payments */}
      <div className="card overflow-hidden animate-fade-in">
        <div className="p-4 border-b border-slate-800">
          <h3 className="font-semibold">Pending Payments</h3>
        </div>
        {pendingList.length === 0 ? (
          <p className="text-sm text-slate-500 py-8 text-center">No pending payments</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left p-4 text-xs font-semibold text-slate-400 uppercase">Client</th>
                <th className="text-left p-4 text-xs font-semibold text-slate-400 uppercase">Company</th>
                <th className="text-left p-4 text-xs font-semibold text-slate-400 uppercase">Type</th>
                <th className="text-left p-4 text-xs font-semibold text-slate-400 uppercase">Amount</th>
                <th className="text-left p-4 text-xs font-semibold text-slate-400 uppercase">Month</th>
                <th className="text-left p-4 text-xs font-semibold text-slate-400 uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {pendingList.map((c) => {
                const client = clients.find((cl) => cl.id === c.clientId);
                return (
                  <tr key={c.id} className="table-row">
                    <td className="p-4 font-medium">{client ? getFullName(client.firstName, client.lastName) : '—'}</td>
                    <td className="p-4 text-slate-300">{c.company}</td>
                    <td className="p-4"><Badge label={c.type.replace('_', ' ')} variant="gold" dot={false} /></td>
                    <td className="p-4 text-yellow-400 font-semibold">{formatCurrency(c.amount)}</td>
                    <td className="p-4 text-slate-400">{c.month}</td>
                    <td className="p-4"><Badge label="Pending" variant="warning" /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
