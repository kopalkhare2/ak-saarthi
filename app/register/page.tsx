'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, Eye, EyeOff, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1 = basic info, 2 = additional details

  // Form state
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    dob: '',
    gender: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    occupation: '',
    maritalStatus: '',
    annualIncome: '',
    riskProfile: 'moderate',
  });

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const validateStep1 = () => {
    if (!form.firstName.trim()) return 'First name is required';
    if (!form.lastName.trim()) return 'Last name is required';
    if (!form.email.trim()) return 'Email is required';
    if (!form.phone.trim()) return 'Phone number is required';
    if (!form.password) return 'Password is required';
    if (form.password.length < 6) return 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) return 'Passwords do not match';
    return null;
  };

  const handleNext = () => {
    const err = validateStep1();
    if (err) {
      setError(err);
      return;
    }
    setStep(2);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          password: form.password,
          phone: form.phone,
          dob: form.dob,
          gender: form.gender,
          address: form.address,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
          occupation: form.occupation,
          maritalStatus: form.maritalStatus,
          annualIncome: form.annualIncome ? Number(form.annualIncome) : 0,
          riskProfile: form.riskProfile,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed');
        setLoading(false);
        return;
      }

      // Auto-login successful (server has set the session cookie already)
      router.push('/client/dashboard');
    } catch {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex">
      {/* Left — Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero relative items-center justify-center p-12">
        <div className="absolute top-[-200px] left-[-100px] w-[500px] h-[500px] bg-yellow-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[-200px] right-[-100px] w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-3xl" />

        <div className="relative text-center">
          <div className="w-20 h-20 rounded-2xl gradient-gold flex items-center justify-center mx-auto mb-8 animate-float">
            <Sparkles size={36} className="text-slate-900" />
          </div>
          <h1 className="text-4xl font-bold mb-4">AK Saarthi AI</h1>
          <p className="text-lg text-slate-400 mb-2">Financial Advisor Operating System</p>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Create your account to access your financial portfolio, track policies, and stay connected with your advisor.
          </p>

          <div className="flex flex-col gap-3 mt-12 text-left max-w-xs mx-auto">
            {[
              'View your policies & investments',
              'Track premium due dates',
              'Access documents securely',
              'Chat with your advisor',
            ].map((f) => (
              <div key={f} className="flex items-center gap-3 text-sm text-slate-400">
                <CheckCircle2 size={16} className="text-yellow-400 shrink-0" />
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
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl gradient-gold flex items-center justify-center">
              <Sparkles size={20} className="text-slate-900" />
            </div>
            <h1 className="text-xl font-bold">AK Saarthi AI</h1>
          </div>

          <h2 className="text-2xl font-bold mb-1">Create Client Account</h2>
          <p className="text-sm text-slate-400 mb-4">
            {step === 1 ? 'Enter your basic details to register as a client' : 'Tell us a bit more about your financial profile (optional)'}
          </p>

          <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-400 mb-6">
            👤 <strong>Client Self-Registration Portal:</strong> Public sign-ups create Client Accounts. Advisor access is invite-only by the administrator.
          </div>

          {/* Step Indicator */}
          <div className="flex items-center gap-2 mb-6">
            <div className={`flex-1 h-1 rounded-full transition-colors ${step >= 1 ? 'bg-yellow-400' : 'bg-slate-700'}`} />
            <div className={`flex-1 h-1 rounded-full transition-colors ${step >= 2 ? 'bg-yellow-400' : 'bg-slate-700'}`} />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {step === 1 ? (
            /* ── Step 1: Basic Info ── */
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">First Name *</label>
                  <input
                    className="input"
                    type="text"
                    value={form.firstName}
                    onChange={(e) => update('firstName', e.target.value)}
                    placeholder="Rajesh"
                  />
                </div>
                <div>
                  <label className="label">Last Name *</label>
                  <input
                    className="input"
                    type="text"
                    value={form.lastName}
                    onChange={(e) => update('lastName', e.target.value)}
                    placeholder="Sharma"
                  />
                </div>
              </div>

              <div>
                <label className="label">Email Address *</label>
                <input
                  className="input"
                  type="email"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="label">Phone Number *</label>
                <input
                  className="input"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  placeholder="9876543210"
                />
              </div>

              <div>
                <label className="label">Password *</label>
                <div className="relative">
                  <input
                    className="input pr-10"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => update('password', e.target.value)}
                    placeholder="Min 6 characters"
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

              <div>
                <label className="label">Confirm Password *</label>
                <input
                  className="input"
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => update('confirmPassword', e.target.value)}
                  placeholder="Re-enter password"
                />
              </div>

              <button
                type="button"
                onClick={handleNext}
                className="btn btn-primary w-full py-3 text-base"
              >
                Continue
              </button>
            </div>
          ) : (
            /* ── Step 2: Additional Details (optional) ── */
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Date of Birth</label>
                  <input
                    className="input"
                    type="date"
                    value={form.dob}
                    onChange={(e) => update('dob', e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Gender</label>
                  <select className="input" value={form.gender} onChange={(e) => update('gender', e.target.value)}>
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Address</label>
                <input
                  className="input"
                  type="text"
                  value={form.address}
                  onChange={(e) => update('address', e.target.value)}
                  placeholder="Street address"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label">City</label>
                  <input className="input" value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="City" />
                </div>
                <div>
                  <label className="label">State</label>
                  <input className="input" value={form.state} onChange={(e) => update('state', e.target.value)} placeholder="State" />
                </div>
                <div>
                  <label className="label">Pincode</label>
                  <input className="input" value={form.pincode} onChange={(e) => update('pincode', e.target.value)} placeholder="400001" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Occupation</label>
                  <input className="input" value={form.occupation} onChange={(e) => update('occupation', e.target.value)} placeholder="e.g. Engineer" />
                </div>
                <div>
                  <label className="label">Marital Status</label>
                  <select className="input" value={form.maritalStatus} onChange={(e) => update('maritalStatus', e.target.value)}>
                    <option value="">Select</option>
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                    <option value="divorced">Divorced</option>
                    <option value="widowed">Widowed</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 px-4 flex items-center gap-2"
                >
                  <ArrowLeft size={16} /> Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary flex-1 py-3 text-base disabled:opacity-50"
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              </div>

              <p className="text-xs text-slate-500 text-center mt-2">
                You can skip optional fields and update them later from your profile.
              </p>
            </form>
          )}

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-yellow-400 hover:text-yellow-300 font-medium">Sign In</Link>
          </p>

          <div className="mt-6 pt-6 border-t border-slate-800 text-center">
            <Link href="/" className="text-xs text-slate-500 hover:text-slate-400">← Back to Home</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
