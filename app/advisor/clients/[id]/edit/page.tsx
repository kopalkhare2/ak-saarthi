'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/contexts/app-context';
import Tabs, { useTabs } from '@/components/ui/tabs';
import Modal from '@/components/ui/modal';
import Badge, { policyStatusBadge } from '@/components/ui/badge';
import type { Client, Gender, MaritalStatus, RiskProfile, FamilyMember, Policy, PolicyType, PolicyStatus } from '@/lib/types';
import { formatCurrency, formatDate, generateId, policyTypeLabels } from '@/lib/utils';
import { User, CreditCard, Users as UsersIcon, Banknote, Save, ArrowLeft, Shield, Plus, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';

const tabDefs = [
  { id: 'personal', label: 'Personal', icon: <User size={14} /> },
  { id: 'identity', label: 'Identity', icon: <CreditCard size={14} /> },
  { id: 'family', label: 'Family', icon: <UsersIcon size={14} /> },
  { id: 'financial', label: 'Financial', icon: <Banknote size={14} /> },
  { id: 'policies', label: 'Policies', icon: <Shield size={14} /> },
];

export default function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { clients, policies, updateClient, addPolicy, updatePolicy, deletePolicy } = useApp();
  const { activeTab, setActiveTab, tabs } = useTabs(tabDefs, 'personal');

  const client = clients.find((c) => c.id === id);
  const clientPolicies = policies.filter((p) => p.clientId === id);

  const [form, setForm] = useState({
    firstName: '', lastName: '', dob: '', gender: 'male' as Gender,
    phone: '', alternatePhone: '', email: '', address: '', city: '', state: '',
    pincode: '', occupation: '', employer: '', maritalStatus: 'single' as MaritalStatus,
    pan: '', aadhaar: '', passport: '', drivingLicense: '',
    annualIncome: 0, riskProfile: 'moderate' as RiskProfile,
  });
  const [family, setFamily] = useState<FamilyMember[]>([]);
  const [saving, setSaving] = useState(false);

  // Policy modal states
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [addingPolicy, setAddingPolicy] = useState(false);
  const [policyForm, setPolicyForm] = useState({
    company: '', policyNumber: '', type: 'life' as PolicyType,
    premium: 0, premiumFrequency: 'yearly' as Policy['premiumFrequency'],
    dueDate: '', startDate: '', sumAssured: 0, nominee: '', status: 'active' as PolicyStatus
  });

  // Initialize form state once the client loads from the (async) app context;
  // there's no render-time value to compute this from before `client` arrives.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (client) {
      setForm({
        firstName: client.firstName || '',
        lastName: client.lastName || '',
        dob: client.dob || '',
        gender: client.gender || 'male',
        phone: client.phone || '',
        alternatePhone: client.alternatePhone || '',
        email: client.email || '',
        address: client.address || '',
        city: client.city || '',
        state: client.state || '',
        pincode: client.pincode || '',
        occupation: client.occupation || '',
        employer: client.employer || '',
        maritalStatus: client.maritalStatus || 'single',
        pan: client.pan || '',
        aadhaar: client.aadhaar || '',
        passport: client.passport || '',
        drivingLicense: client.drivingLicense || '',
        annualIncome: client.annualIncome || 0,
        riskProfile: client.riskProfile || 'moderate',
      });
      setFamily(client.family || []);
    }
  }, [client]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!client) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-lg font-semibold text-slate-400">Client not found</p>
          <Link href="/advisor/clients" className="btn btn-primary mt-4">Back to Clients</Link>
        </div>
      </div>
    );
  }

  const set = (field: string, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const addFamilyMember = () =>
    setFamily((prev) => [...prev, { name: '', relation: 'spouse' as const, dob: '', phone: '' }]);

  const updateFamily = (idx: number, field: keyof FamilyMember, value: string) =>
    setFamily((prev) => prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m)));

  const removeFamily = (idx: number) =>
    setFamily((prev) => prev.filter((_, i) => i !== idx));

  // Policy Handlers
  const handleOpenAddPolicy = () => {
    setPolicyForm({
      company: '', policyNumber: '', type: 'life', premium: 0, premiumFrequency: 'yearly',
      dueDate: '', startDate: '', sumAssured: 0, nominee: '', status: 'active'
    });
    setAddingPolicy(true);
  };

  const handleCreatePolicy = () => {
    if (!policyForm.company || !policyForm.policyNumber) {
      alert('Please fill in Company and Policy Number.');
      return;
    }
    addPolicy({
      id: generateId(),
      clientId: client.id,
      company: policyForm.company,
      policyNumber: policyForm.policyNumber,
      type: policyForm.type,
      premium: policyForm.premium,
      premiumFrequency: policyForm.premiumFrequency,
      dueDate: policyForm.dueDate,
      startDate: policyForm.startDate,
      sumAssured: policyForm.sumAssured,
      nominee: policyForm.nominee,
      status: policyForm.status,
      renewalStatus: 'not_due',
      createdAt: new Date().toISOString(),
    });
    setAddingPolicy(false);
  };

  const handleOpenEditPolicy = (p: Policy) => {
    setEditingPolicy(p);
    setPolicyForm({
      company: p.company,
      policyNumber: p.policyNumber,
      type: p.type,
      premium: p.premium,
      premiumFrequency: p.premiumFrequency,
      dueDate: p.dueDate,
      startDate: p.startDate,
      sumAssured: p.sumAssured,
      nominee: p.nominee || '',
      status: p.status,
    });
  };

  const handleSavePolicy = () => {
    if (!editingPolicy) return;
    updatePolicy({
      ...editingPolicy,
      company: policyForm.company,
      policyNumber: policyForm.policyNumber,
      type: policyForm.type,
      premium: policyForm.premium,
      premiumFrequency: policyForm.premiumFrequency,
      dueDate: policyForm.dueDate,
      startDate: policyForm.startDate,
      sumAssured: policyForm.sumAssured,
      nominee: policyForm.nominee,
      status: policyForm.status,
    });
    setEditingPolicy(null);
  };

  const handleDeletePolicy = (policyId: string) => {
    if (confirm('Are you sure you want to delete this policy? This action cannot be undone.')) {
      deletePolicy(policyId);
    }
  };

  const handleSubmit = () => {
    if (!form.firstName || !form.lastName || !form.phone) {
      alert('Please fill in First Name, Last Name, and Phone number.');
      return;
    }
    setSaving(true);

    const updatedClient: Client = {
      ...client,
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
      riskProfile: form.riskProfile,
      updatedAt: new Date().toISOString(),
    };

    updateClient(updatedClient);
    router.push(`/advisor/clients/${id}`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/advisor/clients/${id}`} className="p-2 rounded-lg hover:bg-slate-800 transition-colors">
          <ArrowLeft size={20} className="text-slate-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Client Profile</h1>
          <p className="text-sm text-slate-400 mt-1">Update details for {client.firstName} {client.lastName}</p>
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
              <input className="input" value={form.firstName} onChange={(e) => set('firstName', e.target.value)} placeholder="First Name" />
            </div>
            <div>
              <label className="label">Last Name *</label>
              <input className="input" value={form.lastName} onChange={(e) => set('lastName', e.target.value)} placeholder="Last Name" />
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
              <input className="input" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="Phone" />
            </div>
            <div>
              <label className="label">Alternate Phone</label>
              <input className="input" value={form.alternatePhone} onChange={(e) => set('alternatePhone', e.target.value)} />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="Email" />
            </div>
            <div>
              <label className="label">Occupation</label>
              <input className="input" value={form.occupation} onChange={(e) => set('occupation', e.target.value)} placeholder="Occupation" />
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
              <input className="input" value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Address" />
            </div>
            <div>
              <label className="label">City</label>
              <input className="input" value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="City" />
            </div>
            <div>
              <label className="label">State</label>
              <input className="input" value={form.state} onChange={(e) => set('state', e.target.value)} placeholder="State" />
            </div>
            <div>
              <label className="label">Pincode</label>
              <input className="input" value={form.pincode} onChange={(e) => set('pincode', e.target.value)} placeholder="Pincode" />
            </div>
          </div>
        )}

        {/* Identity */}
        {activeTab === 'identity' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="label">PAN Number</label>
              <input className="input" value={form.pan} onChange={(e) => set('pan', e.target.value.toUpperCase())} placeholder="PAN" maxLength={10} />
            </div>
            <div>
              <label className="label">Aadhaar Number</label>
              <input className="input" value={form.aadhaar} onChange={(e) => set('aadhaar', e.target.value)} placeholder="Aadhaar" />
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

        {/* Financial - Removed loans, financial goals and other unnecessary details as requested */}
        {activeTab === 'financial' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="label">Annual Income (₹)</label>
              <input className="input" type="number" value={form.annualIncome || ''} onChange={(e) => set('annualIncome', Number(e.target.value))} />
            </div>
            <div>
              <label className="label">Risk Profile</label>
              <select className="input" value={form.riskProfile} onChange={(e) => set('riskProfile', e.target.value)}>
                <option value="conservative">Conservative</option>
                <option value="moderate">Moderate</option>
                <option value="aggressive">Aggressive</option>
              </select>
            </div>
          </div>
        )}

        {/* Policies tab inside edit layout */}
        {activeTab === 'policies' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Linked Policies</h3>
              <button onClick={handleOpenAddPolicy} className="btn btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5">
                <Plus size={14} /> Add Policy
              </button>
            </div>

            {clientPolicies.length === 0 ? (
              <p className="text-sm text-slate-500 py-12 text-center">No policies linked to this client.</p>
            ) : (
              <div className="overflow-x-auto border border-slate-800 rounded-xl">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/40">
                      <th className="text-left p-4 text-xs font-semibold text-slate-400 uppercase">Company</th>
                      <th className="text-left p-4 text-xs font-semibold text-slate-400 uppercase">Policy #</th>
                      <th className="text-left p-4 text-xs font-semibold text-slate-400 uppercase">Type</th>
                      <th className="text-left p-4 text-xs font-semibold text-slate-400 uppercase">Premium</th>
                      <th className="text-left p-4 text-xs font-semibold text-slate-400 uppercase">Due Date</th>
                      <th className="text-left p-4 text-xs font-semibold text-slate-400 uppercase">Status</th>
                      <th className="text-right p-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientPolicies.map((p) => (
                      <tr key={p.id} className="table-row border-b border-slate-800/50">
                        <td className="p-4 font-medium text-slate-200">{p.company}</td>
                        <td className="p-4 text-slate-400 font-mono text-xs">{p.policyNumber}</td>
                        <td className="p-4"><Badge label={policyTypeLabels[p.type] || p.type} variant="gold" dot={false} /></td>
                        <td className="p-4 text-yellow-400 font-semibold">{formatCurrency(p.premium)}</td>
                        <td className="p-4 text-slate-300">{formatDate(p.dueDate)}</td>
                        <td className="p-4">{policyStatusBadge(p.status)}</td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => handleOpenEditPolicy(p)} className="p-1 rounded hover:bg-slate-800 text-yellow-400 hover:text-yellow-300 transition-colors">
                              <Edit size={14} />
                            </button>
                            <button onClick={() => handleDeletePolicy(p.id)} className="p-1 rounded hover:bg-slate-800 text-red-400 hover:text-red-300 transition-colors">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Link href={`/advisor/clients/${id}`} className="btn btn-ghost">Cancel</Link>
        <button onClick={handleSubmit} disabled={saving} className="btn btn-primary">
          <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Add Policy Modal */}
      {addingPolicy && (
        <Modal isOpen={true} onClose={() => setAddingPolicy(false)} title="Link New Policy" size="lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Company *</label>
              <input className="input" value={policyForm.company} onChange={(e) => setPolicyForm({ ...policyForm, company: e.target.value })} placeholder="LIC" />
            </div>
            <div>
              <label className="label">Policy Number *</label>
              <input className="input" value={policyForm.policyNumber} onChange={(e) => setPolicyForm({ ...policyForm, policyNumber: e.target.value })} placeholder="LIC-12345" />
            </div>
            <div>
              <label className="label">Type</label>
              <select className="input" value={policyForm.type} onChange={(e) => setPolicyForm({ ...policyForm, type: e.target.value as PolicyType })}>
                {Object.entries(policyTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Premium (₹)</label>
              <input className="input" type="number" value={policyForm.premium || ''} onChange={(e) => setPolicyForm({ ...policyForm, premium: Number(e.target.value) })} />
            </div>
            <div>
              <label className="label">Frequency</label>
              <select className="input" value={policyForm.premiumFrequency} onChange={(e) => setPolicyForm({ ...policyForm, premiumFrequency: e.target.value as Policy['premiumFrequency'] })}>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="half_yearly">Half Yearly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div>
              <label className="label">Sum Assured (₹)</label>
              <input className="input" type="number" value={policyForm.sumAssured || ''} onChange={(e) => setPolicyForm({ ...policyForm, sumAssured: Number(e.target.value) })} />
            </div>
            <div>
              <label className="label">Nominee</label>
              <input className="input" value={policyForm.nominee} onChange={(e) => setPolicyForm({ ...policyForm, nominee: e.target.value })} />
            </div>
            <div>
              <label className="label">Start Date</label>
              <input className="input" type="date" value={policyForm.startDate} onChange={(e) => setPolicyForm({ ...policyForm, startDate: e.target.value })} />
            </div>
            <div>
              <label className="label">Due Date</label>
              <input className="input" type="date" value={policyForm.dueDate} onChange={(e) => setPolicyForm({ ...policyForm, dueDate: e.target.value })} />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={policyForm.status} onChange={(e) => setPolicyForm({ ...policyForm, status: e.target.value as PolicyStatus })}>
                <option value="active">Active</option>
                <option value="lapsed">Lapsed</option>
                <option value="pending">Pending</option>
                <option value="claim">Claim</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setAddingPolicy(false)} className="btn btn-secondary">Cancel</button>
            <button onClick={handleCreatePolicy} className="btn btn-primary">Create Policy</button>
          </div>
        </Modal>
      )}

      {/* Edit Policy Modal */}
      {editingPolicy && (
        <Modal isOpen={true} onClose={() => setEditingPolicy(null)} title="Edit Policy Details" size="lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Company *</label>
              <input className="input" value={policyForm.company} onChange={(e) => setPolicyForm({ ...policyForm, company: e.target.value })} placeholder="LIC" />
            </div>
            <div>
              <label className="label">Policy Number *</label>
              <input className="input" value={policyForm.policyNumber} onChange={(e) => setPolicyForm({ ...policyForm, policyNumber: e.target.value })} placeholder="Policy Number" />
            </div>
            <div>
              <label className="label">Type</label>
              <select className="input" value={policyForm.type} onChange={(e) => setPolicyForm({ ...policyForm, type: e.target.value as PolicyType })}>
                {Object.entries(policyTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Premium (₹)</label>
              <input className="input" type="number" value={policyForm.premium || ''} onChange={(e) => setPolicyForm({ ...policyForm, premium: Number(e.target.value) })} />
            </div>
            <div>
              <label className="label">Frequency</label>
              <select className="input" value={policyForm.premiumFrequency} onChange={(e) => setPolicyForm({ ...policyForm, premiumFrequency: e.target.value as Policy['premiumFrequency'] })}>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="half_yearly">Half Yearly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div>
              <label className="label">Sum Assured (₹)</label>
              <input className="input" type="number" value={policyForm.sumAssured || ''} onChange={(e) => setPolicyForm({ ...policyForm, sumAssured: Number(e.target.value) })} />
            </div>
            <div>
              <label className="label">Nominee</label>
              <input className="input" value={policyForm.nominee} onChange={(e) => setPolicyForm({ ...policyForm, nominee: e.target.value })} />
            </div>
            <div>
              <label className="label">Start Date</label>
              <input className="input" type="date" value={policyForm.startDate} onChange={(e) => setPolicyForm({ ...policyForm, startDate: e.target.value })} />
            </div>
            <div>
              <label className="label">Due Date</label>
              <input className="input" type="date" value={policyForm.dueDate} onChange={(e) => setPolicyForm({ ...policyForm, dueDate: e.target.value })} />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={policyForm.status} onChange={(e) => setPolicyForm({ ...policyForm, status: e.target.value as PolicyStatus })}>
                <option value="active">Active</option>
                <option value="lapsed">Lapsed</option>
                <option value="pending">Pending</option>
                <option value="claim">Claim</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setEditingPolicy(null)} className="btn btn-secondary">Cancel</button>
            <button onClick={handleSavePolicy} className="btn btn-primary">Save Changes</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
