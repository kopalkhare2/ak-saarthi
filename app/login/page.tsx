'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, Eye, EyeOff, AlertCircle, ShieldCheck, UserCheck, CheckCircle } from 'lucide-react';
import Modal from '@/components/ui/modal';

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<'advisor' | 'client'>('advisor');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Request Access Modal
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [requestName, setRequestName] = useState('');
  const [requestEmail, setRequestEmail] = useState('');
  const [requestPhone, setRequestPhone] = useState('');
  const [requestSuccess, setRequestSuccess] = useState(false);

  const switchRole = (nextRole: 'advisor' | 'client') => {
    setRole(nextRole);
    setEmail('');
    setPassword('');
    setError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid email or password');
        setLoading(false);
        return;
      }

      // Successful login (server has set the session cookie already)
      if (data.role === 'advisor') {
        router.push('/advisor/dashboard');
      } else {
        router.push('/client/dashboard');
      }
    } catch {
      setError('An error occurred during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestName || !requestEmail || !requestPhone) return;

    try {
      // Post to Advisor Access Requests API
      await fetch('/api/advisor/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: requestName,
          email: requestEmail,
          phone: requestPhone,
        }),
      });
      setRequestSuccess(true);
      setTimeout(() => {
        setShowAccessModal(false);
        setRequestSuccess(false);
        setRequestName('');
        setRequestEmail('');
        setRequestPhone('');
      }, 3000);
    } catch {
      alert('Failed to submit access request. Please try again.');
    }
  };

  return (
    <main className="min-h-screen flex">
      {/* Left — Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero relative items-center justify-center p-12">
        <div className="absolute top-[-200px] left-[-100px] w-[500px] h-[500px] bg-yellow-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[-200px] right-[-100px] w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-3xl" />

        <div className="relative text-center max-w-md">
          <div className="w-20 h-20 rounded-2xl gradient-gold flex items-center justify-center mx-auto mb-8 animate-float">
            <Sparkles size={36} className="text-slate-900" />
          </div>
          <h1 className="text-4xl font-bold mb-4">AK Saarthi AI</h1>
          <p className="text-lg text-slate-400 mb-2">Financial Advisor Operating System</p>
          <p className="text-sm text-slate-500 mx-auto">
            Manage clients, policies, investments, commissions, and document vault with real-time AI assistance.
          </p>

          <div className="grid grid-cols-2 gap-4 mt-12 text-left">
            {[
              '360° Client CRM',
              'Insurance Tracking',
              'Investment Portfolio',
              'AI Assistant',
              'Commission Tracker',
              'Document Vault',
            ].map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm text-slate-400">
                <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-[var(--navy-950)]">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl gradient-gold flex items-center justify-center">
              <Sparkles size={20} className="text-slate-900" />
            </div>
            <h1 className="text-xl font-bold">AK Saarthi AI</h1>
          </div>

          <h2 className="text-2xl font-bold mb-2">Welcome back</h2>
          <p className="text-sm text-slate-400 mb-6">Sign in to your portal to continue</p>

          {/* Role Toggle */}
          <div className="flex gap-1 bg-slate-900 p-1 rounded-xl mb-6">
            <button
              onClick={() => switchRole('advisor')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
                role === 'advisor' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck size={16} />
              Advisor Portal
            </button>
            <button
              onClick={() => switchRole('client')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
                role === 'client' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserCheck size={16} />
              Client Portal
            </button>
          </div>

          {/* Portal Information Hint */}
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-400 mb-6">
            {role === 'advisor' ? (
              <p>
                🔒 <strong className="text-yellow-400">Advisor Access Restricted:</strong> Only authorized advisors can sign in.
                <br />
                Demo Credentials: <span className="text-slate-300 font-mono">advisor@aksaarthi.com</span> (Password: <span className="text-slate-300 font-mono">password</span>)
              </p>
            ) : (
              <p>
                👤 <strong className="text-yellow-400">Client Sign In:</strong> Manage your insurance policies and investment portfolio.
                <br />
                Demo Client: <span className="text-slate-300 font-mono">rajesh.sharma@email.com</span> (Password: <span className="text-slate-300 font-mono">password</span>)
              </p>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-6 leading-relaxed">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="label">Email Address</label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={role === 'advisor' ? 'advisor@aksaarthi.com' : 'rajesh.sharma@email.com'}
                required
              />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  className="input pr-10"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center text-sm">
              <label className="flex items-center gap-2 text-slate-400">
                <input type="checkbox" className="rounded border-slate-600" />
                Remember me
              </label>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary w-full py-3 text-base">
              {loading ? 'Signing in...' : `Sign In as ${role === 'advisor' ? 'Advisor' : 'Client'}`}
            </button>
          </form>

          {/* Footer links */}
          <div className="mt-6 pt-6 border-t border-slate-800 flex flex-col gap-3 text-center text-sm">
            {role === 'client' ? (
              <p className="text-slate-400">
                Don&apos;t have a client account?{' '}
                <Link href="/register" className="text-yellow-400 hover:text-yellow-300 font-medium">Sign Up as Client</Link>
              </p>
            ) : (
              <p className="text-slate-400">
                Need Advisor access?{' '}
                <button
                  type="button"
                  onClick={() => setShowAccessModal(true)}
                  className="text-yellow-400 hover:text-yellow-300 font-medium underline"
                >
                  Request Advisor Access
                </button>
              </p>
            )}

            <Link href="/" className="text-xs text-slate-500 hover:text-slate-400">← Back to Home</Link>
          </div>
        </div>
      </div>

      {/* ─── Request Advisor Access Modal ─── */}
      <Modal isOpen={showAccessModal} onClose={() => setShowAccessModal(false)} title="Request Advisor Access">
        {requestSuccess ? (
          <div className="flex flex-col items-center gap-3 py-6 text-emerald-400 text-center">
            <CheckCircle size={48} />
            <p className="font-semibold text-lg">Request Submitted!</p>
            <p className="text-sm text-slate-400">
              The administrator has received your request and will contact you shortly to set up your advisor credentials.
            </p>
          </div>
        ) : (
          <form onSubmit={handleRequestAccess} className="space-y-4">
            <p className="text-xs text-slate-400">
              Advisor accounts are strictly managed. Please provide your details to request advisor authorization from the administrator.
            </p>
            <div>
              <label className="label">Full Name</label>
              <input className="input" required value={requestName} onChange={(e) => setRequestName(e.target.value)} placeholder="e.g. Rahul Sharma" />
            </div>
            <div>
              <label className="label">Email Address</label>
              <input className="input" type="email" required value={requestEmail} onChange={(e) => setRequestEmail(e.target.value)} placeholder="rahul@financial.com" />
            </div>
            <div>
              <label className="label">Phone Number</label>
              <input className="input" required value={requestPhone} onChange={(e) => setRequestPhone(e.target.value)} placeholder="9876543210" />
            </div>
            <button type="submit" className="btn btn-primary w-full py-3">Submit Access Request</button>
          </form>
        )}
      </Modal>
    </main>
  );
}
