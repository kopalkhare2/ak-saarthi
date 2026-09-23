'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/contexts/app-context';
import Tabs, { useTabs } from '@/components/ui/tabs';
import { generateId } from '@/lib/utils';
import type { Client, Gender, MaritalStatus, RiskProfile, FamilyMember } from '@/lib/types';
import { User, CreditCard, Users as UsersIcon, Banknote, StickyNote, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const tabDefs = [
  { id: 'personal', label: 'Personal', icon: <User size={14} /> },
  { id: 'identity', label: 'Identity', icon: <CreditCard size={14} /> },
  { id: 'family', label: 'Family', icon: <UsersIcon size={14} /> },
  { id: 'financial', label: 'Financial', icon: <Banknote size={14} /> },
  { id: 'notes', label: 'Notes', icon: <StickyNote size={14} /> },
];

const initialForm = {
  firstName: '', lastName: '', dob: '', gender: 'male' as Gender,
  phone: '', alternatePhone: '', email: '', address: '', city: '', state: '',
  pincode: '', occupation: '', employer: '', maritalStatus: 'single' as MaritalStatus,
  pan: '', aadhaar: '', passport: '', drivingLicense: '',
  annualIncome: 0, existingInsurance: '', existingInvestments: '', loans: '',
  riskProfile: 'moderate' as RiskProfile, financialGoals: '',
  noteText: '',
};

export default function AddClientPage() {
  const router = useRouter();
  const { addClient } = useApp();
  const { activeTab, setActiveTab, tabs } = useTabs(tabDefs, 'personal');
  const [form, setForm] = useState(initialForm);
  const [family, setFamily] = useState<FamilyMember[]>([]);
  const [saving, setSaving] = useState(false);

  const set = (field: string, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const addFamilyMember = () =>
    setFamily((prev) => [...prev, { name: '', relation: 'spouse' as const, dob: '', phone: '' }]);

  const updateFamily = (idx: number, field: keyof FamilyMember, value: string) =>
    setFamily((prev) => prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m)));

  const removeFamily = (idx: number) =>
    setFamily((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = () => {
    if (!form.firstName || !form.lastName || !form.phone) {
      alert('Please fill in First Name, Last Name, and Phone number.');
      return;
    }
    setSaving(true);

    const client: Client = {
      id: generateId(),
      firstName: form.firstName,
      lastName: form.lastName,
      dob: form.dob,
      gender: form.gender,
      phone: form.phone,
      alternatePhone: form.alternatePhone || undefined,
      email: form.email,
      address: form.address,
      city: form.city,
      state: form.state,
      pincode: form.pincode,
      occupation: form.occupation,
      employer: form.employer || undefined,
      maritalStatus: form.maritalStatus,
      pan: form.pan || undefined,
      aadhaar: form.aadhaar || undefined,
      passport: form.passport || undefined,
      drivingLicense: form.drivingLicense || undefined,
      family,
      annualIncome: form.annualIncome,
      existingInsurance: form.existingInsurance || undefined,
      existingInvestments: form.existingInvestments || undefined,
      loans: form.loans || undefined,
      riskProfile: form.riskProfile,
      financialGoals: form.financialGoals || undefined,
      notes: form.noteText
        ? [{ id: generateId(), content: form.noteText, createdAt: new Date().toISOString() }]
        : [],
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addClient(client);
    router.push('/advisor/clients');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/advisor/clients" className="p-2 rounded-lg hover:bg-slate-800 transition-colors">
          <ArrowLeft size={20} className="text-slate-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Add New Client</h1>
          <p className="text-sm text-slate-400 mt-1">Fill in the client details below</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Form Sections */}
      <div className="card p-6 animate-fade-in">
        {/* Personal */}
        {activeTab === 'personal' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="label">First Name *</label>
              <input className="input" value={form.firstName} onChange={(e) => set('firstName', e.target.value)} placeholder="Rajesh" />
            </div>
            <div>
              <label className="label">Last Name *</label>
              <input className="input" value={form.lastName} onChange={(e) => set('lastName', e.target.value)} placeholder="Sharma" />
            </div>
            <div>
              <label className="label">Date of Birth</label>
              <input className="input" type="date" value={form.dob} onChange={(e) => set('dob', e.target.value)} />
            </div>
            <div>
              <label className="label">Gender</label>
              <select className="input" value={form.gender} onChange={(e) => set('gender', e.target.value)}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="label">Phone *</label>
              <input className="input" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="9876543210" />
            </div>
            <div>
              <label className="label">Alternate Phone</label>
              <input className="input" value={form.alternatePhone} onChange={(e) => set('alternatePhone', e.target.value)} />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="rajesh@email.com" />
            </div>
            <div>
              <label className="label">Occupation</label>
              <input className="input" value={form.occupation} onChange={(e) => set('occupation', e.target.value)} placeholder="Software Engineer" />
            </div>
            <div>
              <label className="label">Employer</label>
              <input className="input" value={form.employer} onChange={(e) => set('employer', e.target.value)} />
            </div>
            <div>
              <label className="label">Marital Status</label>
              <select className="input" value={form.maritalStatus} onChange={(e) => set('maritalStatus', e.target.value)}>
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="divorced">Divorced</option>
                <option value="widowed">Widowed</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="label">Address</label>
              <input className="input" value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="42, MG Road, Sector 18" />
            </div>
            <div>
              <label className="label">City</label>
              <input className="input" value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Noida" />
            </div>
            <div>
              <label className="label">State</label>
              <input className="input" value={form.state} onChange={(e) => set('state', e.target.value)} placeholder="Uttar Pradesh" />
            </div>
            <div>
              <label className="label">Pincode</label>
              <input className="input" value={form.pincode} onChange={(e) => set('pincode', e.target.value)} placeholder="201301" />
            </div>
          </div>
        )}

        {/* Identity */}
        {activeTab === 'identity' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="label">PAN Number</label>
              <input className="input" value={form.pan} onChange={(e) => set('pan', e.target.value.toUpperCase())} placeholder="ABCDE1234F" maxLength={10} />
            </div>
            <div>
              <label className="label">Aadhaar Number</label>
              <input className="input" value={form.aadhaar} onChange={(e) => set('aadhaar', e.target.value)} placeholder="1234-5678-9012" />
            </div>
            <div>
              <label className="label">Passport Number</label>
              <input className="input" value={form.passport} onChange={(e) => set('passport', e.target.value)} />
            </div>
            <div>
              <label className="label">Driving License</label>
              <input className="input" value={form.drivingLicense} onChange={(e) => set('drivingLicense', e.target.value)} />
            </div>
          </div>
        )}

        {/* Family */}
        {activeTab === 'family' && (
          <div className="space-y-4">
            {family.map((m, idx) => (
              <div key={idx} className="card-elevated p-4 flex flex-wrap gap-3 items-end">
                <div className="flex-1 min-w-[150px]">
                  <label className="label">Name</label>
                  <input className="input" value={m.name} onChange={(e) => updateFamily(idx, 'name', e.target.value)} />
                </div>
                <div className="w-40">
                  <label className="label">Relation</label>
                  <select className="input" value={m.relation} onChange={(e) => updateFamily(idx, 'relation', e.target.value as FamilyMember['relation'])}>
                    <option value="spouse">Spouse</option>
                    <option value="child">Child</option>
                    <option value="parent">Parent</option>
                    <option value="nominee">Nominee</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="w-40">
                  <label className="label">DOB</label>
                  <input className="input" type="date" value={m.dob || ''} onChange={(e) => updateFamily(idx, 'dob', e.target.value)} />
                </div>
                <div className="w-40">
                  <label className="label">Phone</label>
                  <input className="input" value={m.phone || ''} onChange={(e) => updateFamily(idx, 'phone', e.target.value)} />
                </div>
                <button onClick={() => removeFamily(idx)} className="btn btn-danger text-xs py-2">Remove</button>
              </div>
            ))}
            <button onClick={addFamilyMember} className="btn btn-secondary">
              <UsersIcon size={14} /> Add Family Member
            </button>
          </div>
        )}

        {/* Financial */}
        {activeTab === 'financial' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="label">Annual Income (₹)</label>
              <input className="input" type="number" value={form.annualIncome || ''} onChange={(e) => set('annualIncome', Number(e.target.value))} placeholder="2400000" />
            </div>
            <div>
              <label className="label">Risk Profile</label>
              <select className="input" value={form.riskProfile} onChange={(e) => set('riskProfile', e.target.value)}>
                <option value="conservative">Conservative</option>
                <option value="moderate">Moderate</option>
                <option value="aggressive">Aggressive</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="label">Existing Insurance</label>
              <input className="input" value={form.existingInsurance} onChange={(e) => set('existingInsurance', e.target.value)} placeholder="LIC Term Plan, Star Health" />
            </div>
            <div className="md:col-span-2">
              <label className="label">Existing Investments</label>
              <input className="input" value={form.existingInvestments} onChange={(e) => set('existingInvestments', e.target.value)} placeholder="SBI Bluechip SIP, PPF" />
            </div>
            <div className="md:col-span-2">
              <label className="label">Loans</label>
              <input className="input" value={form.loans} onChange={(e) => set('loans', e.target.value)} placeholder="Home Loan - ₹45L remaining" />
            </div>
            <div className="md:col-span-2">
              <label className="label">Financial Goals</label>
              <textarea className="input min-h-[80px]" value={form.financialGoals} onChange={(e) => set('financialGoals', e.target.value)} placeholder="Child education, Retirement by 55" />
            </div>
          </div>
        )}

        {/* Notes */}
        {activeTab === 'notes' && (
          <div>
            <label className="label">Advisor Notes (Private)</label>
            <textarea
              className="input min-h-[160px]"
              value={form.noteText}
              onChange={(e) => set('noteText', e.target.value)}
              placeholder="Add your private notes about this client..."
            />
            <p className="text-xs text-slate-500 mt-2">These notes are only visible to you and will not be shared with the client.</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Link href="/advisor/clients" className="btn btn-ghost">Cancel</Link>
        <button onClick={handleSubmit} disabled={saving} className="btn btn-primary">
          <Save size={16} /> {saving ? 'Saving...' : 'Save Client'}
        </button>
      </div>
    </div>
  );
}