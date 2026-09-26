'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  UserCheck,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
  Search,
  Filter,
  Key,
  Copy,
  Check,
  Send,
  ExternalLink,
  Shield,
  RefreshCw,
} from 'lucide-react';
import Modal from '@/components/ui/modal';

interface AccessRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'pending' | 'approved' | 'declined';
  createdAt: string;
}

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'declined'>('all');
  const [search, setSearch] = useState('');

  // Approval modal states
  const [approvingReq, setApprovingReq] = useState<AccessRequest | null>(null);
  const [tempPassword, setTempPassword] = useState('password123');
  const [isProcessing, setIsProcessing] = useState(false);

  // Success / credentials modal
  const [successResult, setSuccessResult] = useState<{
    email: string;
    password: string;
    emailSent: boolean;
    provider?: string;
    welcomeText: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/advisor/requests');
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (e) {
      console.error('Failed to load requests:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleOpenApproveModal = (req: AccessRequest) => {
    // Generate a secure, readable random password
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let rand = '';
    for (let i = 0; i < 8; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setTempPassword(`Saarthi@${rand}`);
    setApprovingReq(req);
  };

  const handleConfirmApproval = async () => {
    if (!approvingReq) return;
    setIsProcessing(true);

    try {
      const res = await fetch('/api/advisor/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: approvingReq.email,
          password: tempPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to approve request');
        setIsProcessing(false);
        return;
      }

      // Format clean copyable text
      const welcomeText = `Hello ${approvingReq.name},

Your Advisor account on AK Saarthi AI has been APPROVED!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Portal Login: https://ak-saarthi.vercel.app/login
Username: ${approvingReq.email}
Temporary Password: ${tempPassword}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You can also sign in directly using "Continue with Google" on the login page.
Please change your password in Settings after signing in.

Welcome to AK Saarthi AI!`;

      setSuccessResult({
        email: approvingReq.email,
        password: tempPassword,
        emailSent: data.emailStatus?.sent ?? false,
        provider: data.emailStatus?.provider,
        welcomeText,
      });

      setApprovingReq(null);
      fetchRequests();
    } catch {
      alert('Error approving advisor request');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = async (reqId: string) => {
    if (!confirm('Are you sure you want to decline this advisor request?')) return;
    try {
      await fetch('/api/advisor/requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: reqId, status: 'declined' }),
      });
      fetchRequests();
    } catch {
      alert('Failed to decline request');
    }
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const filteredRequests = requests.filter((r) => {
    const matchesFilter = filter === 'all' || r.status === filter;
    const matchesSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase()) ||
      r.phone.includes(search);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <UserCheck className="text-amber-400" size={24} />
            Advisor Access Requests
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Review onboarding submissions, auto-provision advisor credentials, and dispatch welcome emails.
          </p>
        </div>
        <button
          onClick={fetchRequests}
          className="btn bg-slate-900 border border-slate-800 text-slate-300 hover:text-white px-3 py-2 text-xs flex items-center gap-2 self-start rounded-lg"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            className="input pl-9 text-xs w-full py-2 bg-slate-950 border-slate-800"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto overflow-x-auto">
          {(['all', 'pending', 'approved', 'declined'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                filter === tab
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Requests Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0f172a]/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Applicant</th>
                <th className="py-3.5 px-4">Contact Details</th>
                <th className="py-3.5 px-4">Submission Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    Loading requests...
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    No requests match your filter.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{req.name}</div>
                      <div className="text-[11px] text-slate-500">Financial Advisor Candidate</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Mail size={12} className="text-slate-500 shrink-0" />
                        <span>{req.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mt-0.5">
                        <Phone size={12} className="text-slate-500 shrink-0" />
                        <span>{req.phone}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(req.createdAt).toLocaleDateString()} {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          req.status === 'approved'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : req.status === 'declined'
                            ? 'bg-red-500/10 text-red-400 border-red-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
                        }`}
                      >
                        {req.status === 'approved' && <CheckCircle size={10} />}
                        {req.status === 'declined' && <XCircle size={10} />}
                        {req.status === 'pending' && <Clock size={10} />}
                        {req.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {req.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenApproveModal(req)}
                            className="btn bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 shadow-sm"
                          >
                            <CheckCircle size={13} />
                            <span>Approve & Provision</span>
                          </button>
                          <button
                            onClick={() => handleDecline(req.id)}
                            className="btn bg-slate-900 hover:bg-red-500/10 text-red-400 border border-slate-800 hover:border-red-500/30 px-3 py-1.5 rounded-lg text-xs"
                          >
                            Decline
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500 italic">No action needed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Modal 1: Approve & Set Password ─── */}
      <Modal isOpen={!!approvingReq} onClose={() => setApprovingReq(null)} title="Approve Advisor Request">
        <div className="space-y-4 py-2 text-xs">
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <p className="text-slate-400">
              Approving access for: <strong className="text-white">{approvingReq?.name}</strong>
            </p>
            <p className="text-slate-400 mt-1">
              Registered Email: <span className="font-mono text-amber-400">{approvingReq?.email}</span>
            </p>
          </div>

          <div>
            <label className="label text-[11px]">Temporary Password for New Advisor</label>
            <div className="flex gap-2">
              <input
                type="text"
                className="input text-xs font-mono font-semibold"
                value={tempPassword}
                onChange={(e) => setTempPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => {
                  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
                  let rand = '';
                  for (let i = 0; i < 8; i++) rand += chars.charAt(Math.floor(Math.random() * chars.length));
                  setTempPassword(`Saarthi@${rand}`);
                }}
                className="btn btn-secondary px-3 text-xs shrink-0"
              >
                Regenerate
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              The advisor can sign in with this password OR use &quot;Continue with Google&quot; with their email.
            </p>
          </div>

          <div className="flex gap-2 justify-end pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setApprovingReq(null)}
              className="btn btn-secondary py-2 text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isProcessing || !tempPassword}
              onClick={handleConfirmApproval}
              className="btn bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2 text-xs flex items-center gap-1.5"
            >
              {isProcessing ? 'Processing & Notifying...' : 'Confirm Approval & Create Account'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ─── Modal 2: Success & Credentials Dispatch ─── */}
      <Modal isOpen={!!successResult} onClose={() => setSuccessResult(null)} title="✅ Advisor Account Provisioned!">
        <div className="space-y-4 py-2 text-xs">
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
            {successResult?.emailSent ? (
              <p>
                ✓ Welcome email and login credentials were <strong>successfully dispatched</strong> via{' '}
                <span className="uppercase font-bold">{successResult?.provider}</span> to{' '}
                <strong>{successResult?.email}</strong>.
              </p>
            ) : (
              <p>
                ✓ Account created successfully! Use the copyable template below to send the login details directly to the advisor via email or WhatsApp.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
              <span>Account Credentials & Welcome Message:</span>
              <button
                type="button"
                onClick={() => successResult && handleCopyText(successResult.welcomeText)}
                className="text-amber-400 hover:text-amber-300 flex items-center gap-1 text-xs"
              >
                {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Message'}</span>
              </button>
            </div>

            <textarea
              readOnly
              className="input font-mono text-[11px] h-44 w-full bg-slate-950 border-slate-800 leading-relaxed text-slate-300"
              value={successResult?.welcomeText}
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <a
              href={`mailto:${successResult?.email}?subject=${encodeURIComponent(
                'Welcome to AK Saarthi AI — Your Advisor Account Is Approved'
              )}&body=${encodeURIComponent(successResult?.welcomeText || '')}`}
              className="btn btn-secondary py-2 text-xs flex items-center gap-1.5"
            >
              <Send size={13} />
              <span>Open in Mail App</span>
            </a>
            <button
              type="button"
              onClick={() => setSuccessResult(null)}
              className="btn btn-primary py-2 px-5 text-xs"
            >
              Done
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
