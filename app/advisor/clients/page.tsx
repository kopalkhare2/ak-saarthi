'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/contexts/app-context';
import Badge, { riskProfileBadge } from '@/components/ui/badge';
import EmptyState from '@/components/ui/empty-state';
import { getFullName, formatCurrency, searchFilter } from '@/lib/utils';
import { Users, Plus, Search, ArrowRight } from 'lucide-react';

export default function ClientsPage() {
  const { clients, policies, investments } = useApp();
  const [search, setSearch] = useState('');
  const [filterRisk, setFilterRisk] = useState<string>('all');

  let filtered = searchFilter(clients, search, ['firstName', 'lastName', 'email', 'phone', 'city']);

  if (filterRisk !== 'all') {
    filtered = filtered.filter((c) => c.riskProfile === filterRisk);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your {clients.length} client{clients.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/advisor/clients/add" className="btn btn-primary">
          <Plus size={16} /> Add Client
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, email, phone, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <select
          value={filterRisk}
          onChange={(e) => setFilterRisk(e.target.value)}
          className="input w-auto"
        >
          <option value="all">All Risk Profiles</option>
          <option value="conservative">Conservative</option>
          <option value="moderate">Moderate</option>
          <option value="aggressive">Aggressive</option>
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users size={28} />}
          title="No clients found"
          description={search ? 'Try adjusting your search or filters.' : 'Add your first client to get started.'}
          action={
            !search ? (
              <Link href="/advisor/clients/add" className="btn btn-primary">
                <Plus size={16} /> Add Client
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="card overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left p-4 font-semibold text-slate-400 text-xs uppercase tracking-wider">Client</th>
                  <th className="text-left p-4 font-semibold text-slate-400 text-xs uppercase tracking-wider">Phone</th>
                  <th className="text-left p-4 font-semibold text-slate-400 text-xs uppercase tracking-wider">City</th>
                  <th className="text-left p-4 font-semibold text-slate-400 text-xs uppercase tracking-wider">Policies</th>
                  <th className="text-left p-4 font-semibold text-slate-400 text-xs uppercase tracking-wider">Investments</th>
                  <th className="text-left p-4 font-semibold text-slate-400 text-xs uppercase tracking-wider">Risk</th>
                  <th className="text-left p-4 font-semibold text-slate-400 text-xs uppercase tracking-wider">Status</th>
                  <th className="text-right p-4"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const clientPolicies = policies.filter((p) => p.clientId === c.id);
                  const clientInvestments = investments.filter((i) => i.clientId === c.id);
                  const totalInvested = clientInvestments.reduce((s, i) => s + i.currentValue, 0);

                  return (
                    <tr key={c.id} className="table-row">
                      <td className="p-4">
                        <Link href={`/advisor/clients/${c.id}`} className="flex items-center gap-3 group">
                          <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-yellow-400 group-hover:bg-yellow-500/20 transition-colors">
                            {c.firstName[0]}{c.lastName[0]}
                          </div>
                          <div>
                            <p className="font-medium group-hover:text-yellow-400 transition-colors">
                              {getFullName(c.firstName, c.lastName)}
                            </p>
                            <p className="text-xs text-slate-500">{c.email}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="p-4 text-slate-300">{c.phone}</td>
                      <td className="p-4 text-slate-300">{c.city}</td>
                      <td className="p-4">
                        <span className="text-slate-300">{clientPolicies.length}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-slate-300">{totalInvested > 0 ? formatCurrency(totalInvested) : '—'}</span>
                      </td>
                      <td className="p-4">{riskProfileBadge(c.riskProfile)}</td>
                      <td className="p-4">
                        <Badge
                          label={c.status}
                          variant={c.status === 'active' ? 'success' : 'neutral'}
                        />
                      </td>
                      <td className="p-4 text-right">
                        <Link href={`/advisor/clients/${c.id}`} className="text-slate-500 hover:text-yellow-400 transition-colors">
                          <ArrowRight size={16} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
