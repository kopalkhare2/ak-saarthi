'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  User,
  Bell,
  Database,
  Save,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Mail,
  Phone,
  ShieldAlert,
  ExternalLink,
  Key,
  Copy,
  Check,
} from 'lucide-react';
import Modal from '@/components/ui/modal';

interface AdvisorProfile {
  name: string;
  email: string;
  phone: string;
  company: string;
  arnNumber: string;
  licenseNumber: string;
}

interface AccessRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'pending' | 'approved' | 'declined';
  createdAt: string;
}

const DEFAULT_PROFILE: AdvisorProfile = {
  name: '', email: '', phone: '', company: '', arnNumber: '', licenseNumber: '',
};

export default function SettingsPage() {
  const [profile, setProfile] = useState<AdvisorProfile>(DEFAULT_PROFILE);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [notifications, setNotifications] = useState({
    premiumReminders: true,
    renewalAlerts: true,
    birthdayWishes: true,
    sipReminders: true,
    taskDeadlines: true,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState<boolean>(true);

  // Approval modal states
  const [approvingReq, setApprovingReq] = useState<AccessRequest | null>(null);
  const [tempPassword, setTempPassword] = useState('password123');
  const [isProcessingApproval, setIsProcessingApproval] = useState(false);
  const [approvalResult, setApprovalResult] = useState<{
    email: string;
    password: string;
    emailSent: boolean;
    provider?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchAccessRequests = async () => {
    try {
      setLoadingRequests(true);
      const res = await fetch('/api/advisor/requests');
      if (res.ok) {
        const data = await res.json();
        setAccessRequests(data);
      }
    } catch (e) {
      console.error('Failed to fetch requests', e);
    } finally {
      setLoadingRequests(false);
    }
  };

  const fetchProfile = async () => {
    try {
      setLoadingProfile(true);
      const res = await fetch('/api/advisor/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          company: data.company || '',
          arnNumber: data.arnNumber || '',
          licenseNumber: data.licenseNumber || '',
        });
      }
    } catch (e) {
      console.error('Failed to fetch advisor profile', e);
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    const savedNotifications = localStorage.getItem('ak_advisor_notifications');
    if (savedNotifications) {
      try {
        // One-time load of a per-browser preference; localStorage isn't available at render time.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setNotifications(JSON.parse(savedNotifications));
      } catch {
        // ignore malformed local preferences
      }
    }
    fetchProfile();
    fetchAccessRequests();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/advisor/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      localStorage.setItem('ak_advisor_notifications', JSON.stringify(notifications));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error('Failed to save profile', e);
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadBackup = () => {
    const link = document.createElement('a');
    link.href = '/api/backup';
    link.download = `aksaarthi-backup-${new Date().toISOString().split('T')[0]}.db`;
    link.click();
  };

  const handleOpenApproveModal = (req: AccessRequest) => {
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
    setIsProcessingApproval(true);

    try {
      const res = await fetch('/api/advisor/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: approvingReq.email, password: tempPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`Failed to approve: ${data.error || 'Error creating account'}`);
        return;
      }

      // Mark request as approved
      await fetch('/api/advisor/requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: approvingReq.id, status: 'approved' }),
      });

      fetchAccessRequests();
      setApprovalResult({
        email: approvingReq.email,
        password: tempPassword,
        emailSent: !!data.emailStatus?.sent,
        provider: data.emailStatus?.provider,
      });
      setApprovingReq(null);
    } catch {
      alert('Failed to process approval.');
    } finally {
      setIsProcessingApproval(false);
    }
  };

  const handleDeclineRequest = async (reqId: string) => {
    if (!confirm('Are you sure you want to decline this request?')) return;

    try {
      await fetch('/api/advisor/requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: reqId, status: 'declined' }),
      });
      fetchAccessRequests();
    } catch {
      alert('Failed to decline request.');
    }
  };

  const pendingRequests = accessRequests.filter((r) => r.status === 'pending');

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings & Administration</h1>
        <p className="text-sm text-slate-400 mt-1">Manage profile, preferences, backups, and advisor access control</p>
      </div>

      {/* Profile */}
      <div className="card p-6 animate-fade-in">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <User size={18} className="text-yellow-400" /> Administrator Profile
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Full Name</label>
            <input className="input" disabled={loadingProfile} value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" disabled={loadingProfile} value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" disabled={loadingProfile} value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
          </div>
          <div>
            <label className="label">Company</label>
            <input className="input" disabled={loadingProfile} value={profile.company} onChange={(e) => setProfile({ ...profile, company: e.target.value })} />
          </div>
          <div>
            <label className="label">ARN Number</label>
            <input className="input" disabled={loadingProfile} value={profile.arnNumber} onChange={(e) => setProfile({ ...profile, arnNumber: e.target.value })} />
          </div>
          <div>
            <label className="label">License Number</label>
            <input className="input" disabled={loadingProfile} value={profile.licenseNumber} onChange={(e) => setProfile({ ...profile, licenseNumber: e.target.value })} />
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <button onClick={handleSave} disabled={loadingProfile || saving} className="btn btn-primary disabled:opacity-50">
            <Save size={16} /> {saved ? 'Saved ✓' : saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>

      {/* Advisor Access Control & Pending Requests */}
      <div className="card p-6 animate-fade-in border-yellow-500/20">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-2">
          <ShieldCheck size={20} className="text-yellow-400" /> Advisor Access Control & Requests
        </h2>
        <p className="text-sm text-slate-400 mb-6">
          You are the system administrator. Public sign-ups create Client accounts only. All Advisor access requests require your approval here.
        </p>

        {/* Banner pointing to dedicated Admin Console */}
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
              <ShieldAlert size={22} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Dedicated Platform Host Admin Console</p>
              <p className="text-xs text-slate-400">
                Manage advisor access requests, multi-tenant advisors, passwords, and platform metrics with instant email delivery.
              </p>
            </div>
          </div>
          <Link
            href="/admin/requests"
            className="btn btn-primary text-xs py-2 px-3.5 flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 shadow-lg shadow-amber-500/10"
          >
            Open Admin Console <ExternalLink size={13} />
          </Link>
        </div>

        {/* Pending Requests List */}
        <div className="mb-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Clock size={14} className="text-amber-400" />
              Pending Advisor Access Requests ({pendingRequests.length})
            </h3>
            <button onClick={fetchAccessRequests} className="text-xs text-yellow-400 hover:underline">
              Refresh
            </button>
          </div>

          {loadingRequests ? (
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400">
              Loading requests...
            </div>
          ) : pendingRequests.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-slate-500">
              No pending advisor access requests at this time.
            </div>
          ) : (
            <div className="space-y-2">
              {pendingRequests.map((req) => (
                <div key={req.id} className="p-4 rounded-xl bg-slate-900 border border-amber-500/30 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">{req.name}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                      <span className="flex items-center gap-1"><Mail size={12} /> {req.email}</span>
                      <span className="flex items-center gap-1"><Phone size={12} /> {req.phone}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleOpenApproveModal(req)}
                      className="btn btn-primary text-xs py-1.5 px-3"
                    >
                      <CheckCircle2 size={14} /> Approve & Grant
                    </button>
                    <button
                      onClick={() => handleDeclineRequest(req.id)}
                      className="btn btn-danger text-xs py-1.5 px-3"
                    >
                      <XCircle size={14} /> Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Manual Creation Form */}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const formEl = e.currentTarget;
            const emailInput = formEl.elements.namedItem('advisorEmail') as HTMLInputElement;
            const passInput = formEl.elements.namedItem('advisorPassword') as HTMLInputElement;
            const msgEl = formEl.querySelector('#advisorMsg') as HTMLDivElement;

            msgEl.innerText = 'Creating account...';
            msgEl.className = 'text-xs text-yellow-400 mt-2';

            try {
              const res = await fetch('/api/advisor/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: emailInput.value, password: passInput.value }),
              });
              const data = await res.json();
              if (!res.ok) {
                msgEl.innerText = `❌ ${data.error || 'Failed to create advisor account'}`;
                msgEl.className = 'text-xs text-red-400 font-medium mt-2';
              } else {
                msgEl.innerText = `✅ ${data.message || 'Advisor account created!'}`;
                msgEl.className = 'text-xs text-emerald-400 font-medium mt-2';
                emailInput.value = '';
                passInput.value = '';
              }
            } catch {
              msgEl.innerText = '❌ Network request failed';
              msgEl.className = 'text-xs text-red-400 font-medium mt-2';
            }
          }}
          className="space-y-3 max-w-md bg-slate-900/60 p-4 rounded-xl border border-slate-800"
        >
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Manually Create Advisor Account</h3>
          <div>
            <label className="label">Advisor Email</label>
            <input className="input" name="advisorEmail" type="email" placeholder="new.advisor@firm.com" required />
          </div>
          <div>
            <label className="label">Temporary Password</label>
            <input className="input" name="advisorPassword" type="password" placeholder="••••••••" required minLength={6} />
          </div>
          <button type="submit" className="btn btn-primary w-full py-2 text-xs">
            Create Advisor Account
          </button>
          <div id="advisorMsg"></div>
        </form>
      </div>

      {/* Security & Change Password */}
      <div className="card p-6 animate-fade-in border-slate-800">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-2">
          <ShieldCheck size={18} className="text-yellow-400" /> Security & Change Password
        </h2>
        <p className="text-sm text-slate-400 mb-4">
          Logged in with initial credentials? Update your password here to keep your administrator account secure.
        </p>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const formEl = e.currentTarget;
            const curPass = (formEl.elements.namedItem('curPassword') as HTMLInputElement).value;
            const newPass = (formEl.elements.namedItem('newPassword') as HTMLInputElement).value;
            const confPass = (formEl.elements.namedItem('confPassword') as HTMLInputElement).value;
            const msgEl = formEl.querySelector('#pwMsg') as HTMLDivElement;

            if (newPass !== confPass) {
              msgEl.innerText = '❌ New passwords do not match';
              msgEl.className = 'text-xs text-red-400 mt-2';
              return;
            }

            try {
              const res = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword: curPass, newPassword: newPass }),
              });
              const data = await res.json();
              if (!res.ok) {
                msgEl.innerText = `❌ ${data.error || 'Failed to change password'}`;
                msgEl.className = 'text-xs text-red-400 mt-2';
              } else {
                msgEl.innerText = '✅ Password updated successfully!';
                msgEl.className = 'text-xs text-emerald-400 mt-2';
                formEl.reset();
              }
            } catch {
              msgEl.innerText = '❌ Request failed';
              msgEl.className = 'text-xs text-red-400 mt-2';
            }
          }}
          className="space-y-3 max-w-md bg-slate-900/60 p-4 rounded-xl border border-slate-800"
        >
          <div>
            <label className="label">Current Password</label>
            <input className="input" name="curPassword" type="password" placeholder="••••••••" required />
          </div>
          <div>
            <label className="label">New Password</label>
            <input className="input" name="newPassword" type="password" placeholder="••••••••" required minLength={6} />
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input className="input" name="confPassword" type="password" placeholder="••••••••" required minLength={6} />
          </div>
          <button type="submit" className="btn btn-secondary w-full py-2 text-xs">
            Update My Password
          </button>
          <div id="pwMsg"></div>
        </form>
      </div>

      {/* Notifications */}
      <div className="card p-6 animate-fade-in">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Bell size={18} className="text-yellow-400" /> Notifications
        </h2>
        <div className="space-y-4">
          {Object.entries(notifications).map(([key, val]) => {
            const labels: Record<string, string> = {
              premiumReminders: 'Premium Due Reminders',
              renewalAlerts: 'Renewal Alerts',
              birthdayWishes: 'Client Birthday Wishes',
              sipReminders: 'SIP Date Reminders',
              taskDeadlines: 'Task Deadline Alerts',
            };
            return (
              <div key={key} className="flex items-center justify-between py-2">
                <span className="text-sm">{labels[key]}</span>
                <button
                  onClick={() => setNotifications((prev) => ({ ...prev, [key]: !val }))}
                  className={`w-11 h-6 rounded-full transition-colors relative ${val ? 'bg-yellow-500' : 'bg-slate-700'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${val ? 'left-5.5' : 'left-0.5'}`} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Data Management */}
      <div className="card p-6 animate-fade-in">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Database size={18} className="text-yellow-400" /> Data Management & Backups
        </h2>
        <p className="text-sm text-slate-400 mb-4">
          Your data is stored in a secure SQLite database on the server. Download a full backup anytime to keep a safe copy.
          Deleted clients and documents are moved to Trash first — they can be restored unless permanently deleted.
        </p>
        <div className="flex flex-wrap gap-3">
          <button onClick={handleDownloadBackup} className="btn btn-primary">
            <Download size={16} /> Download Database Backup
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-3">
          Backup includes all clients, policies, investments, commissions, appointments, tasks, and document metadata.
        </p>
      </div>

      {/* Approval Modal */}
      {approvingReq && (
        <Modal
          isOpen={true}
          onClose={() => setApprovingReq(null)}
          title={`Approve Advisor Request - ${approvingReq.name}`}
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-300">
              Approving will create an active financial advisor account for <strong>{approvingReq.email}</strong>.
            </p>

            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block">Temporary Password</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
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
                    setTempPassword(`Saarthi@${rand}`);
                  }}
                  className="btn btn-secondary text-xs px-3 whitespace-nowrap"
                  title="Generate Random Password"
                >
                  Regenerate
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                The advisor can change this temporary password at any time in their profile.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setApprovingReq(null)}
                className="btn btn-secondary text-xs"
                disabled={isProcessingApproval}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApproval}
                className="btn btn-primary text-xs flex items-center gap-1.5"
                disabled={isProcessingApproval || tempPassword.length < 6}
              >
                <CheckCircle2 size={14} />
                {isProcessingApproval ? 'Creating Account...' : 'Approve & Provision'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Approval Credentials & Delivery Modal */}
      {approvalResult && (
        <Modal
          isOpen={true}
          onClose={() => setApprovalResult(null)}
          title="Advisor Account Approved & Created"
        >
          <div className="space-y-4">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs flex items-start gap-2">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Account created successfully for {approvalResult.email}!</p>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  The advisor can now sign in at <strong className="text-white">https://ak-saarthi.vercel.app/login</strong>.
                </p>
              </div>
            </div>

            {/* Email delivery status notice */}
            {approvalResult.emailSent ? (
              <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[11px] text-blue-300 flex items-center gap-2">
                <Mail size={14} className="shrink-0" />
                <span>An automated onboarding email was dispatched to the advisor inbox.</span>
              </div>
            ) : (
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[11px] text-amber-300">
                <p className="font-semibold flex items-center gap-1.5 mb-0.5">
                  <ShieldAlert size={13} /> Direct Email Not Sent (Provider Not Configured)
                </p>
                <p className="text-slate-400 text-[10.5px]">
                  No email provider (Resend API key or Gmail App Password) is set in your environment variables. Use the buttons below to copy the credentials or open a pre-filled email draft.
                </p>
              </div>
            )}

            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Portal:</span>
                <span className="text-white">https://ak-saarthi.vercel.app/login</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Email:</span>
                <span className="text-white font-semibold">{approvalResult.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Password:</span>
                <span className="text-amber-400 font-bold">{approvalResult.password}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  const text = `Welcome to AK Saarthi AI!\n\nYour advisor account has been approved.\n\nLogin URL: https://ak-saarthi.vercel.app/login\nEmail: ${approvalResult.email}\nTemporary Password: ${approvalResult.password}\n\nPlease change your password upon your first sign in.`;
                  navigator.clipboard.writeText(text);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2500);
                }}
                className="btn btn-secondary text-xs flex-1 flex items-center justify-center gap-1.5"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                {copied ? 'Copied to Clipboard!' : 'Copy Credentials'}
              </button>

              <a
                href={`mailto:${approvalResult.email}?subject=Your%20AK%20Saarthi%20Advisor%20Account%20Credentials&body=Welcome%20to%20AK%20Saarthi%20AI!%0A%0AYour%20advisor%20account%20has%20been%20approved.%0A%0ALogin%20URL:%20https://ak-saarthi.vercel.app/login%0AEmail:%20${approvalResult.email}%0ATemporary%20Password:%20${approvalResult.password}%0A%0APlease%20change%20your%20password%20upon%20first%20sign%20in.`}
                className="btn btn-primary text-xs flex items-center justify-center gap-1.5"
              >
                <Mail size={14} /> Send Email
              </a>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setApprovalResult(null)}
                className="btn btn-secondary text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
