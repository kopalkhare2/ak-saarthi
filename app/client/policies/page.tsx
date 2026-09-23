'use client';

import { useApp } from '@/contexts/app-context';
import Badge, { policyStatusBadge } from '@/components/ui/badge';
import { formatCurrency, formatDate, policyTypeLabels } from '@/lib/utils';
import { Shield } from 'lucide-react';

export default function ClientPoliciesPage() {
  // Already scoped to the signed-in client by the API.
  const { policies } = useApp();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Policies</h1>
        <p className="text-sm text-slate-400 mt-1">{policies.length} policies</p>
      </div>

      <div className="space-y-4 animate-fade-in">
        {policies.map((p) => (
          <div key={p.id} className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400"><Shield size={20} /></div>
                <div>
                  <h3 className="font-semibold">{p.company}</h3>
                  <p className="text-sm text-slate-400">{p.policyNumber}</p>
                </div>
              </div>
              {policyStatusBadge(p.status)}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><span className="text-slate-500 block text-xs">Type</span><Badge label={policyTypeLabels[p.type] || p.type} variant="gold" dot={false} /></div>
              <div><span className="text-slate-500 block text-xs">Premium</span><span className="font-semibold text-yellow-400">{formatCurrency(p.premium)}/yr</span></div>
              <div><span className="text-slate-500 block text-xs">Sum Assured</span><span>{formatCurrency(p.sumAssured)}</span></div>
              <div><span className="text-slate-500 block text-xs">Due Date</span><span>{formatDate(p.dueDate)}</span></div>
              <div><span className="text-slate-500 block text-xs">Start Date</span><span>{formatDate(p.startDate)}</span></div>
              <div><span className="text-slate-500 block text-xs">Nominee</span><span>{p.nominee}</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
