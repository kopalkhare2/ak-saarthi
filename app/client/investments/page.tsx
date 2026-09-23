'use client';

import { useApp } from '@/contexts/app-context';
import Badge from '@/components/ui/badge';
import { formatCurrency, investmentTypeLabels } from '@/lib/utils';
import { TrendingUp } from 'lucide-react';

export default function ClientInvestmentsPage() {
  // Already scoped to the signed-in client by the API.
  const { investments } = useApp();
  const totalInvested = investments.reduce((s, i) => s + i.investedAmount, 0);
  const totalCurrent = investments.reduce((s, i) => s + i.currentValue, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Investments</h1>
        <p className="text-sm text-slate-400 mt-1">{investments.length} investments</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 text-center">
          <p className="text-sm text-slate-400 mb-1">Total Invested</p>
          <p className="text-2xl font-bold">{formatCurrency(totalInvested)}</p>
        </div>
        <div className="card p-5 text-center">
          <p className="text-sm text-slate-400 mb-1">Current Value</p>
          <p className="text-2xl font-bold text-emerald-400">{formatCurrency(totalCurrent)}</p>
        </div>
        <div className="card p-5 text-center">
          <p className="text-sm text-slate-400 mb-1">Overall Returns</p>
          <p className={`text-2xl font-bold ${totalCurrent >= totalInvested ? 'text-emerald-400' : 'text-red-400'}`}>
            {totalInvested > 0 ? `${(((totalCurrent - totalInvested) / totalInvested) * 100).toFixed(1)}%` : '0%'}
          </p>
        </div>
      </div>

      {/* Investment Cards */}
      <div className="space-y-4 animate-fade-in">
        {investments.map((i) => (
          <div key={i.id} className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400"><TrendingUp size={20} /></div>
                <div>
                  <h3 className="font-semibold">{i.schemeName}</h3>
                  {i.fundHouse && <p className="text-sm text-slate-400">{i.fundHouse}</p>}
                </div>
              </div>
              <Badge label={investmentTypeLabels[i.type] || i.type} variant="info" dot={false} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><span className="text-slate-500 block text-xs">Invested</span><span>{formatCurrency(i.investedAmount)}</span></div>
              <div><span className="text-slate-500 block text-xs">Current Value</span><span className="font-semibold text-emerald-400">{formatCurrency(i.currentValue)}</span></div>
              <div><span className="text-slate-500 block text-xs">Returns</span><span className={i.returns >= 0 ? 'text-emerald-400' : 'text-red-400'}>{i.returns >= 0 ? '+' : ''}{i.returns.toFixed(1)}%</span></div>
              {i.sipAmount && <div><span className="text-slate-500 block text-xs">SIP</span><span>{formatCurrency(i.sipAmount)}/month</span></div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
