'use client';

import { useState } from 'react';
import { useApp } from '@/contexts/app-context';
import Badge from '@/components/ui/badge';
import Modal from '@/components/ui/modal';
import StatCard from '@/components/ui/stat-card';
import { formatCurrency, getFullName, investmentTypeLabels, generateId } from '@/lib/utils';
import type { InvestmentType } from '@/lib/types';
import { TrendingUp, Wallet, Plus, Search, BarChart } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

const PIE_COLORS = ['#facc15', '#3b82f6', '#22c55e', '#ef4444', '#a855f7', '#f97316', '#06b6d4', '#ec4899', '#84cc16'];

export default function InvestmentsPage() {
  const { clients, investments, addInvestment } = useApp();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    clientId: '', type: 'mutual_fund' as InvestmentType, schemeName: '', fundHouse: '',
    investedAmount: 0, currentValue: 0, returns: 0, sipAmount: 0, sipDate: 0,
    startDate: '',
  });
  const set = (f: string, v: string | number) => setForm((p) => ({ ...p, [f]: v }));

  const totalAUM = investments.reduce((s, i) => s + i.currentValue, 0);
  const totalInvested = investments.reduce((s, i) => s + i.investedAmount, 0);
  const overallReturns = totalInvested > 0 ? ((totalAUM - totalInvested) / totalInvested) * 100 : 0;

  // Asset allocation
  const allocation = investments.reduce((acc, inv) => {
    const label = investmentTypeLabels[inv.type] || inv.type;
    acc[label] = (acc[label] || 0) + inv.currentValue;
    return acc;
  }, {} as Record<string, number>);
  const pieData = Object.entries(allocation).map(([name, value]) => ({ name, value }));

  let filtered = investments;
  if (search) {
    const clientMap = new Map(clients.map((c) => [c.id, getFullName(c.firstName, c.lastName)]));
    filtered = filtered.filter((inv) => {
      const cn = clientMap.get(inv.clientId) || '';
      return `${cn} ${inv.schemeName} ${inv.fundHouse || ''}`.toLowerCase().includes(search.toLowerCase());
    });
  }
  if (filterType !== 'all') filtered = filtered.filter((i) => i.type === filterType);

  const handleAdd = () => {
    if (!form.clientId || !form.schemeName) return;
    addInvestment({
      id: generateId(),
      clientId: form.clientId,
      type: form.type,
      schemeName: form.schemeName,
      fundHouse: form.fundHouse || undefined,
      investedAmount: form.investedAmount,
      currentValue: form.currentValue || form.investedAmount,
      returns: form.returns,
      sipAmount: form.sipAmount || undefined,
      sipDate: form.sipDate || undefined,
      startDate: form.startDate,
      status: 'active',
      createdAt: new Date().toISOString(),
    });
    setShowAdd(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Investments</h1>
          <p className="text-sm text-slate-400 mt-1">{investments.length} investments across {clients.length} clients</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn btn-primary"><Plus size={16} /> Add Investment</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total AUM" value={formatCurrency(totalAUM)} icon={<Wallet size={20} />} accent="bg-purple-500/10 text-purple-400" />
        <StatCard title="Total Invested" value={formatCurrency(totalInvested)} icon={<BarChart size={20} />} accent="bg-blue-500/10 text-blue-400" />
        <StatCard title="Overall Returns" value={`${overallReturns >= 0 ? '+' : ''}${overallReturns.toFixed(1)}%`} icon={<TrendingUp size={20} />} accent="bg-emerald-500/10 text-emerald-400" trend={{ value: overallReturns, label: 'all time' }} />
      </div>

      {/* Chart + Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5">
          <h3 className="font-semibold mb-2">Asset Allocation</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }} formatter={(v: unknown) => formatCurrency(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                {d.name}
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-3">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input className="input pl-10" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select className="input w-auto" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="all">All Types</option>
              {Object.entries(investmentTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>

          <div className="card overflow-hidden animate-fade-in">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left p-3 text-xs font-semibold text-slate-400 uppercase">Client</th>
                    <th className="text-left p-3 text-xs font-semibold text-slate-400 uppercase">Scheme</th>
                    <th className="text-left p-3 text-xs font-semibold text-slate-400 uppercase">Type</th>
                    <th className="text-left p-3 text-xs font-semibold text-slate-400 uppercase">Invested</th>
                    <th className="text-left p-3 text-xs font-semibold text-slate-400 uppercase">Current</th>
                    <th className="text-left p-3 text-xs font-semibold text-slate-400 uppercase">Returns</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((inv) => {
                    const c = clients.find((cl) => cl.id === inv.clientId);
                    return (
                      <tr key={inv.id} className="table-row">
                        <td className="p-3 font-medium">{c ? getFullName(c.firstName, c.lastName) : '—'}</td>
                        <td className="p-3 text-slate-300">{inv.schemeName}</td>
                        <td className="p-3"><Badge label={investmentTypeLabels[inv.type] || inv.type} variant="info" dot={false} /></td>
                        <td className="p-3 text-slate-300">{formatCurrency(inv.investedAmount)}</td>
                        <td className="p-3 text-emerald-400 font-semibold">{formatCurrency(inv.currentValue)}</td>
                        <td className="p-3">
                          <span className={inv.returns >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                            {inv.returns >= 0 ? '+' : ''}{inv.returns.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add New Investment" size="lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Client *</label>
            <select className="input" value={form.clientId} onChange={(e) => set('clientId', e.target.value)}>
              <option value="">Select...</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{getFullName(c.firstName, c.lastName)}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Type</label>
            <select className="input" value={form.type} onChange={(e) => set('type', e.target.value)}>
              {Object.entries(investmentTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="label">Scheme Name *</label>
            <input className="input" value={form.schemeName} onChange={(e) => set('schemeName', e.target.value)} placeholder="SBI Bluechip Fund" />
          </div>
          <div>
            <label className="label">Fund House</label>
            <input className="input" value={form.fundHouse} onChange={(e) => set('fundHouse', e.target.value)} />
          </div>
          <div>
            <label className="label">Invested Amount (₹)</label>
            <input className="input" type="number" value={form.investedAmount || ''} onChange={(e) => set('investedAmount', Number(e.target.value))} />
          </div>
          <div>
            <label className="label">Current Value (₹)</label>
            <input className="input" type="number" value={form.currentValue || ''} onChange={(e) => set('currentValue', Number(e.target.value))} />
          </div>
          <div>
            <label className="label">Start Date</label>
            <input className="input" type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setShowAdd(false)} className="btn btn-secondary">Cancel</button>
          <button onClick={handleAdd} className="btn btn-primary">Add Investment</button>
        </div>
      </Modal>
    </div>
  );
}
