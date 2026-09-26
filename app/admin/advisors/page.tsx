'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Key,
  Copy,
  Check,
  RefreshCw,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  Shield,
  ArrowRight,
} from 'lucide-react';
import Modal from '@/components/ui/modal';

interface AdvisorUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  createdAt: string;
  _count: {
    clients: number;
  };
}

export default function AdminAdvisorsPage() {
  const [advisors, setAdvisors] = useState<AdvisorUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Password reset modal state
  const [selectedAdvisor, setSelectedAdvisor] = useState<AdvisorUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resetSuccess, setResetSuccess] = useState<{
    advisorEmail: string;
    password: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchAdvisors = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/advisors');
      if (res.ok) {
        const data = await res.json();
        setAdvisors(data);
      }
    } catch (e) {
      console.error('Failed to load advisors:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvisors();
  }, []);

  const handleOpenResetModal = (advisor: AdvisorUser) => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let rand = '';
    for (let i = 0; i < 8; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(`Saarthi@${rand}`);
    setSelectedAdvisor(advisor);
  };

  const handleConfirmReset = async () => {
    if (!selectedAdvisor) return;
    setIsProcessing(true);

    try {
      const res = await fetch('/api/admin/advisors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          advisorId: selectedAdvisor.id,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to reset password');
        return;
      }

      setResetSuccess({
        advisorEmail: selectedAdvisor.email,
        password: newPassword,
      });
      setSelectedAdvisor(null);
    } catch (e) {
      console.error(e);
      alert('Network error while resetting password.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyCredentials = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const filteredAdvisors = advisors.filter((a) => {
    const query = search.toLowerCase();
    const fullName = `${a.firstName || ''} ${a.lastName || ''}`.toLowerCase();
    return fullName.includes(query) || a.email.toLowerCase().includes(query) || (a.phone && a.phone.includes(query));
  });

  const totalClients = advisors.reduce((sum, a) => sum + (a._count?.clients || 0), 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="text-amber-400" size={24} /> Registered Financial Advisors
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage multi-tenant advisor accounts, view client rosters, and manage platform credentials.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/requests"
            className="btn btn-secondary text-xs flex items-center gap-1.5"
          >
            Review Pending Requests <ArrowRight size={14} />
          </Link>
          <button
            onClick={fetchAdvisors}
            className="btn btn-secondary text-xs flex items-center gap-1.5"
            title="Refresh advisor list"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-3 bg-gradient-to-br from-slate-900 to-slate-900/60 border-slate-800">
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400">
            <Users size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-400">Total Advisors</p>
            <p className="text-xl font-bold text-white">{advisors.length}</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3 bg-gradient-to-br from-slate-900 to-slate-900/60 border-slate-800">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Briefcase size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-400">Total Managed Clients</p>
            <p className="text-xl font-bold text-white">{totalClients}</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3 bg-gradient-to-br from-slate-900 to-slate-900/60 border-slate-800">
          <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400">
            <Shield size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-400">Data Isolation</p>
            <p className="text-sm font-semibold text-emerald-400">Strict Multi-Tenant Active</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card p-4">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search advisors by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10 text-sm w-full bg-slate-900/60 border-slate-800"
          />
        </div>
      </div>

      {/* Advisors Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="animate-spin text-amber-400" size={24} />
            <p className="text-sm">Loading registered advisors...</p>
          </div>
        ) : filteredAdvisors.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <Users size={32} className="mx-auto mb-2 text-slate-600" />
            <p className="text-base font-semibold text-slate-300">No advisors found</p>
            <p className="text-xs mt-1 text-slate-500">
              {search ? 'Try adjusting your search query.' : 'Approved advisor accounts will appear here.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-xs text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Advisor Details</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">Managed Clients</th>
                  <th className="py-3 px-4">Joined Date</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredAdvisors.map((adv) => {
                  const displayName =
                    adv.firstName || adv.lastName
                      ? `${adv.firstName || ''} ${adv.lastName || ''}`.trim()
                      : adv.email.split('@')[0];

                  const initials = displayName
                    .split(' ')
                    .map((n) => n[0])
                    .filter(Boolean)
                    .slice(0, 2)
                    .join('')
                    .toUpperCase() || 'AD';

                  const joinedDate = new Date(adv.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });

                  return (
                    <tr key={adv.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-900 font-bold flex items-center justify-center text-xs shadow-sm">
                            {initials}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-200">{displayName}</p>
                            <p className="text-xs text-slate-400">{adv.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <Mail size={13} className="text-slate-500" />
                            <span>{adv.email}</span>
                          </div>
                          {adv.phone && (
                            <div className="flex items-center gap-1.5 text-slate-400">
                              <Phone size={13} className="text-slate-500" />
                              <span>{adv.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <Briefcase size={12} />
                          {adv._count?.clients ?? 0} clients
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-slate-500" />
                          <span>{joinedDate}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          Active Advisor
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpenResetModal(adv)}
                          className="btn btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 ml-auto text-amber-400 border-amber-500/30 hover:border-amber-400 hover:bg-amber-500/10"
                        >
                          <Key size={13} /> Reset Password
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Password Reset Modal */}
      {selectedAdvisor && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedAdvisor(null)}
          title={`Reset Password for ${selectedAdvisor.email}`}
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-300">
              Provide a new temporary or permanent password for this advisor. Once saved, you can share these credentials with the advisor.
            </p>

            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block">New Password</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input font-mono text-xs w-full bg-slate-900 border-slate-700"
                />
                <button
                  type="button"
                  onClick={() => {
                    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
                    let rand = '';
                    for (let i = 0; i < 8; i++) {
                      rand += chars.charAt(Math.floor(Math.random() * chars.length));
                    }
                    setNewPassword(`Saarthi@${rand}`);
                  }}
                  className="btn btn-secondary text-xs px-3 whitespace-nowrap"
                  title="Generate Random"
                >
                  Regenerate
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedAdvisor(null)}
                className="btn btn-secondary text-xs"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="btn btn-primary text-xs flex items-center gap-1.5"
                disabled={isProcessing || newPassword.length < 6}
              >
                <Key size={14} />
                {isProcessing ? 'Updating...' : 'Set New Password'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Success Modal */}
      {resetSuccess && (
        <Modal
          isOpen={true}
          onClose={() => setResetSuccess(null)}
          title="Password Reset Successful"
        >
          <div className="space-y-4">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs">
              Password has been updated in the database for <strong>{resetSuccess.advisorEmail}</strong>.
            </div>

            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Email:</span>
                <span className="text-white font-semibold">{resetSuccess.advisorEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">New Password:</span>
                <span className="text-amber-400 font-bold">{resetSuccess.password}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() =>
                  handleCopyCredentials(
                    `Ak-Saarthi Advisor Credentials:\nEmail: ${resetSuccess.advisorEmail}\nPassword: ${resetSuccess.password}\nLogin URL: https://ak-saarthi.vercel.app/login`
                  )
                }
                className="btn btn-secondary text-xs flex-1 flex items-center justify-center gap-1.5"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                {copied ? 'Copied to Clipboard!' : 'Copy Credentials'}
              </button>

              <a
                href={`mailto:${resetSuccess.advisorEmail}?subject=Your%20Ak-Saarthi%20Advisor%20Credentials&body=Hello,%0A%0AYour%20Ak-Saarthi%20password%20has%20been%20updated:%0A%0AEmail:%20${resetSuccess.advisorEmail}%0APassword:%20${resetSuccess.password}%0A%0ALogin%20at:%20https://ak-saarthi.vercel.app/login`}
                className="btn btn-primary text-xs flex items-center justify-center gap-1.5"
              >
                <Mail size={14} /> Send Email
              </a>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setResetSuccess(null)}
                className="btn btn-secondary text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
