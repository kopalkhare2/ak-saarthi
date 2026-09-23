'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/contexts/app-context';
import Tabs, { useTabs } from '@/components/ui/tabs';
import Modal from '@/components/ui/modal';
import Badge, { policyStatusBadge, riskProfileBadge } from '@/components/ui/badge';
import { formatCurrency, formatDate, getFullName, getInitials, generateId } from '@/lib/utils';
import { policyTypeLabels, investmentTypeLabels } from '@/lib/utils';
import type { Policy, PolicyType, PolicyStatus } from '@/lib/types';
import {
  ArrowLeft, Edit, User, CreditCard, Users as UsersIcon,
  Banknote, Shield, TrendingUp, FolderOpen, StickyNote,
  Phone, Mail, MapPin, Plus, Trash2,
} from 'lucide-react';

function InfoRow({ label, value }: { label: string; value?: string | number }) {
  return (
    <div className="flex justify-between py-2.5 border-b border-slate-800/50">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-200">{value || '—'}</span>
    </div>
  );
}

const tabDefs = [
  { id: 'overview', label: 'Overview', icon: <User size={14} /> },
  { id: 'personal', label: 'Personal', icon: <CreditCard size={14} /> },
  { id: 'family', label: 'Family', icon: <UsersIcon size={14} /> },
  { id: 'financial', label: 'Financial', icon: <Banknote size={14} /> },
  { id: 'policies', label: 'Policies', icon: <Shield size={14} /> },
  { id: 'investments', label: 'Investments', icon: <TrendingUp size={14} /> },
  { id: 'documents', label: 'Documents', icon: <FolderOpen size={14} /> },
  { id: 'notes', label: 'Notes', icon: <StickyNote size={14} /> },
];

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { clients, policies, investments, documents, updateClient, deleteClient, updatePolicy, deletePolicy, addPolicy } = useApp();
  const { activeTab, setActiveTab, tabs } = useTabs(tabDefs, 'overview');
  const [newNote, setNewNote] = useState('');

  // Policy Add/Edit states
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [addingPolicy, setAddingPolicy] = useState(false);
  const [editingForm, setEditingForm] = useState({
    company: '', policyNumber: '', type: 'life' as PolicyType,
    premium: 0, premiumFrequency: 'yearly' as Policy['premiumFrequency'],
    dueDate: '', startDate: '', sumAssured: 0, nominee: '', status: 'active' as PolicyStatus
  });
  const [newPolicyForm, setNewPolicyForm] = useState({
    company: '', policyNumber: '', type: 'life' as PolicyType,
    premium: 0, premiumFrequency: 'yearly' as Policy['premiumFrequency'],
    dueDate: '', startDate: '', sumAssured: 0, nominee: '', status: 'active' as PolicyStatus
  });

  const client = clients.find((c) => c.id === id);

  const handleDeleteClient = () => {
    if (confirm(`Are you sure you want to delete client "${client ? getFullName(client.firstName, client.lastName) : ''}"? This action cannot be undone.`)) {
      if (client) {
        deleteClient(client.id);
        router.push('/advisor/clients');
      }
    }
  };

  const handleOpenAddPolicy = () => {
    setNewPolicyForm({
      company: '', policyNumber: '', type: 'life', premium: 0, premiumFrequency: 'yearly',
      dueDate: '', startDate: '', sumAssured: 0, nominee: '', status: 'active'
    });
    setAddingPolicy(true);
  };

  const handleCreatePolicy = () => {
    if (!newPolicyForm.company.trim()) {
      alert('Please enter a Company name.');
      return;
    }
    if (!newPolicyForm.policyNumber.trim()) {
      alert('Please enter a Policy Number.');
      return;
    }
    if (client) {
      addPolicy({
        id: generateId(),
        clientId: client.id,
        company: newPolicyForm.company.trim(),
        policyNumber: newPolicyForm.policyNumber.trim(),
        type: newPolicyForm.type,
        premium: newPolicyForm.premium,
        premiumFrequency: newPolicyForm.premiumFrequency,
        dueDate: newPolicyForm.dueDate,
        startDate: newPolicyForm.startDate,
        sumAssured: newPolicyForm.sumAssured,
        nominee: newPolicyForm.nominee,
        status: newPolicyForm.status,
        renewalStatus: 'not_due',
        createdAt: new Date().toISOString(),
      });
      setAddingPolicy(false);
    }
  };

  const handleEditPolicyClick = (p: Policy) => {
    setEditingPolicy(p);
    setEditingForm({
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

  const handleSavePolicyEdit = () => {
    if (!editingPolicy) return;
    updatePolicy({
      ...editingPolicy,
      company: editingForm.company,
      policyNumber: editingForm.policyNumber,
      type: editingForm.type,
      premium: editingForm.premium,
      premiumFrequency: editingForm.premiumFrequency,
      dueDate: editingForm.dueDate,
      startDate: editingForm.startDate,
      sumAssured: editingForm.sumAssured,
      nominee: editingForm.nominee,
      status: editingForm.status,
    });
    setEditingPolicy(null);
  };

  const handleDeletePolicyClick = (policyId: string) => {
    if (confirm('Are you sure you want to delete this policy from the client\'s portfolio? This action cannot be undone.')) {
      deletePolicy(policyId);
    }
  };

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

  const clientPolicies = policies.filter((p) => p.clientId === id);
  const clientInvestments = investments.filter((i) => i.clientId === id);
  const clientDocs = documents.filter((d) => d.clientId === id);
  const totalPremium = clientPolicies.reduce((s, p) => s + p.premium, 0);
  const totalInvested = clientInvestments.reduce((s, i) => s + i.investedAmount, 0);
  const totalCurrentValue = clientInvestments.reduce((s, i) => s + i.currentValue, 0);

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    const updated = {
      ...client,
      notes: [...client.notes, { id: generateId(), content: newNote, createdAt: new Date().toISOString() }],
      updatedAt: new Date().toISOString(),
    };
    updateClient(updated);
    setNewNote('');
  };

  const handleDeleteNote = (noteId: string) => {
    const updated = {
      ...client,
      notes: client.notes.filter((n) => n.id !== noteId),
      updatedAt: new Date().toISOString(),
    };
    updateClient(updated);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/advisor/clients" className="p-2 rounded-lg hover:bg-slate-800 transition-colors">
            <ArrowLeft size={20} className="text-slate-400" />
          </Link>
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 flex items-center justify-center text-lg font-bold text-yellow-400 border border-yellow-500/20">
            {getInitials(client.firstName, client.lastName)}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{getFullName(client.firstName, client.lastName)}</h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-slate-400">
              <span className="flex items-center gap-1"><Phone size={12} /> {client.phone}</span>
              <span className="flex items-center gap-1"><Mail size={12} /> {client.email}</span>
              <span className="flex items-center gap-1"><MapPin size={12} /> {client.city}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/advisor/clients/${id}/edit`} className="btn btn-secondary">
            <Edit size={16} /> Edit
          </Link>
          <button onClick={handleDeleteClient} className="btn btn-danger">
            <Trash2 size={16} /> Delete Client
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="overflow-x-auto">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* Content */}
      <div className="animate-fade-in">
        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="card p-5 space-y-3">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Summary</h3>
              <InfoRow label="Occupation" value={client.occupation} />
              <InfoRow label="Employer" value={client.employer} />
              <InfoRow label="Marital Status" value={client.maritalStatus.charAt(0).toUpperCase() + client.maritalStatus.slice(1)} />
              <InfoRow label="DOB" value={client.dob ? formatDate(client.dob) : undefined} />
              <InfoRow label="Income" value={client.annualIncome ? formatCurrency(client.annualIncome) : undefined} />
              <div className="flex justify-between py-2.5">
                <span className="text-sm text-slate-500">Risk Profile</span>
                {riskProfileBadge(client.riskProfile)}
              </div>
            </div>
            <div className="card p-5 space-y-3">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Insurance</h3>
              <div className="text-3xl font-bold text-yellow-400">{clientPolicies.length}</div>
              <p className="text-sm text-slate-500">Active policies</p>
              <InfoRow label="Total Premium" value={formatCurrency(totalPremium)} />
              {clientPolicies.slice(0, 3).map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">{p.company}</span>
                  {policyStatusBadge(p.status)}
                </div>
              ))}
            </div>
            <div className="card p-5 space-y-3">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Investments</h3>
              <div className="text-3xl font-bold text-emerald-400">{formatCurrency(totalCurrentValue)}</div>
              <p className="text-sm text-slate-500">Current portfolio value</p>
              <InfoRow label="Invested" value={formatCurrency(totalInvested)} />
              <InfoRow label="Returns" value={totalInvested > 0 ? `${(((totalCurrentValue - totalInvested) / totalInvested) * 100).toFixed(1)}%` : '—'} />
            </div>
          </div>
        )}

        {/* Personal */}
        {activeTab === 'personal' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Contact</h3>
              <InfoRow label="Phone" value={client.phone} />
              <InfoRow label="Alternate Phone" value={client.alternatePhone} />
              <InfoRow label="Email" value={client.email} />
              <InfoRow label="Address" value={client.address} />
              <InfoRow label="City" value={client.city} />
              <InfoRow label="State" value={client.state} />
              <InfoRow label="Pincode" value={client.pincode} />
            </div>
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Identity</h3>
              <InfoRow label="PAN" value={client.pan} />
              <InfoRow label="Aadhaar" value={client.aadhaar} />
              <InfoRow label="Passport" value={client.passport} />
              <InfoRow label="Driving License" value={client.drivingLicense} />
            </div>
          </div>
        )}

        {/* Family */}
        {activeTab === 'family' && (
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Family Members</h3>
            {client.family.length === 0 ? (
              <p className="text-sm text-slate-500 py-8 text-center">No family members added</p>
            ) : (
              <div className="space-y-3">
                {client.family.map((m, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-slate-800/50">
                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-300">
                      {m.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{m.name}</p>
                      <p className="text-xs text-slate-500">{m.relation.charAt(0).toUpperCase() + m.relation.slice(1)}</p>
                    </div>
                    {m.dob && <span className="text-sm text-slate-400">{formatDate(m.dob)}</span>}
                    {m.phone && <span className="text-sm text-slate-400">{m.phone}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Financial */}
        {activeTab === 'financial' && (
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Financial Details</h3>
            <InfoRow label="Annual Income" value={client.annualIncome ? formatCurrency(client.annualIncome) : undefined} />
            <InfoRow label="Risk Profile" value={client.riskProfile.charAt(0).toUpperCase() + client.riskProfile.slice(1)} />
            <InfoRow label="Existing Insurance" value={client.existingInsurance} />
            <InfoRow label="Existing Investments" value={client.existingInvestments} />
            <InfoRow label="Loans" value={client.loans} />
            <InfoRow label="Financial Goals" value={client.financialGoals} />
          </div>
        )}

        {/* Policies */}
        {activeTab === 'policies' && (
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Policies Portfolio</h3>
              <button 
                onClick={handleOpenAddPolicy} 
                className="btn btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
              >
                <Plus size={14} /> Add Policy
              </button>
            </div>
            
            {clientPolicies.length === 0 ? (
              <p className="text-sm text-slate-500 py-12 text-center">No policies linked to this client</p>
            ) : (
              <div className="overflow-x-auto border border-slate-800 rounded-xl">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/40">
                      <th className="text-left p-4 text-xs font-semibold text-slate-400 uppercase">Company</th>
                      <th className="text-left p-4 text-xs font-semibold text-slate-400 uppercase">Policy #</th>
                      <th className="text-left p-4 text-xs font-semibold text-slate-400 uppercase">Type</th>
                      <th className="text-left p-4 text-xs font-semibold text-slate-400 uppercase">Premium</th>
                      <th className="text-left p-4 text-xs font-semibold text-slate-400 uppercase">Sum Assured</th>
                      <th className="text-left p-4 text-xs font-semibold text-slate-400 uppercase">Due Date</th>
                      <th className="text-left p-4 text-xs font-semibold text-slate-400 uppercase">Status</th>
                      <th className="text-right p-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientPolicies.map((p) => (
                      <tr key={p.id} className="table-row border-b border-slate-800/50">
                        <td className="p-4 font-medium">{p.company}</td>
                        <td className="p-4 text-slate-400">{p.policyNumber}</td>
                        <td className="p-4"><Badge label={policyTypeLabels[p.type] || p.type} variant="gold" dot={false} /></td>
                        <td className="p-4 text-yellow-400 font-semibold">{formatCurrency(p.premium)}</td>
                        <td className="p-4 text-slate-300">{formatCurrency(p.sumAssured)}</td>
                        <td className="p-4 text-slate-300">{formatDate(p.dueDate)}</td>
                        <td className="p-4">{policyStatusBadge(p.status)}</td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleEditPolicyClick(p)} 
                              className="text-xs font-semibold text-yellow-400 hover:text-yellow-300 transition-colors"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDeletePolicyClick(p.id)} 
                              className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors"
                            >
                              Delete
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

        {/* Investments */}
        {activeTab === 'investments' && (
          <div className="card overflow-hidden">
            {clientInvestments.length === 0 ? (
              <p className="text-sm text-slate-500 py-12 text-center">No investments linked to this client</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left p-4 text-xs font-semibold text-slate-400 uppercase">Scheme</th>
                    <th className="text-left p-4 text-xs font-semibold text-slate-400 uppercase">Type</th>
                    <th className="text-left p-4 text-xs font-semibold text-slate-400 uppercase">Invested</th>
                    <th className="text-left p-4 text-xs font-semibold text-slate-400 uppercase">Current Value</th>
                    <th className="text-left p-4 text-xs font-semibold text-slate-400 uppercase">Returns</th>
                    <th className="text-left p-4 text-xs font-semibold text-slate-400 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {clientInvestments.map((inv) => (
                    <tr key={inv.id} className="table-row">
                      <td className="p-4 font-medium">{inv.schemeName}</td>
                      <td className="p-4"><Badge label={investmentTypeLabels[inv.type] || inv.type} variant="info" dot={false} /></td>
                      <td className="p-4 text-slate-300">{formatCurrency(inv.investedAmount)}</td>
                      <td className="p-4 text-emerald-400 font-semibold">{formatCurrency(inv.currentValue)}</td>
                      <td className="p-4">
                        <span className={inv.returns >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                          {inv.returns >= 0 ? '+' : ''}{inv.returns.toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-4"><Badge label={inv.status} variant={inv.status === 'active' ? 'success' : 'neutral'} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Documents */}
        {activeTab === 'documents' && (
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Uploaded Documents</h3>
            {clientDocs.length === 0 ? (
              <p className="text-sm text-slate-500 py-8 text-center">No documents uploaded</p>
            ) : (
              <div className="space-y-2">
                {clientDocs.map((d) => (
                  <div key={d.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
                    <FolderOpen size={18} className="text-slate-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{d.name}</p>
                      <p className="text-xs text-slate-500">{d.fileName} · {d.size ? `${(d.size / 1024).toFixed(0)} KB` : ''}</p>
                    </div>
                    <Badge label={d.type.toUpperCase()} variant="gold" dot={false} />
                    <span className="text-xs text-slate-500">{formatDate(d.uploadedAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        {activeTab === 'notes' && (
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Advisor Notes</h3>
            <div className="flex gap-3 mb-4">
              <input
                className="input flex-1"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note..."
                onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
              />
              <button onClick={handleAddNote} className="btn btn-primary">
                <Plus size={16} /> Add
              </button>
            </div>
            <div className="space-y-2">
              {client.notes.length === 0 ? (
                <p className="text-sm text-slate-500 py-8 text-center">No notes yet</p>
              ) : (
                [...client.notes].reverse().map((n) => (
                  <div key={n.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50">
                    <StickyNote size={16} className="text-yellow-400 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-slate-200">{n.content}</p>
                      <p className="text-xs text-slate-500 mt-1">{formatDate(n.createdAt)}</p>
                    </div>
                    <button onClick={() => handleDeleteNote(n.id)} className="text-slate-600 hover:text-red-400 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Edit Policy Modal */}
      {editingPolicy && (
        <Modal 
          isOpen={true} 
          onClose={() => setEditingPolicy(null)} 
          title="Edit Policy Details" 
          size="lg"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Company *</label>
              <input 
                className="input" 
                value={editingForm.company} 
                onChange={(e) => setEditingForm({ ...editingForm, company: e.target.value })} 
                placeholder="LIC" 
              />
            </div>
            <div>
              <label className="label">Policy Number *</label>
              <input 
                className="input" 
                value={editingForm.policyNumber} 
                onChange={(e) => setEditingForm({ ...editingForm, policyNumber: e.target.value })} 
                placeholder="Policy Number" 
              />
            </div>
            <div>
              <label className="label">Type</label>
              <select 
                className="input" 
                value={editingForm.type} 
                onChange={(e) => setEditingForm({ ...editingForm, type: e.target.value as PolicyType })}
              >
                {Object.entries(policyTypeLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Premium (₹)</label>
              <input 
                className="input" 
                type="number" 
                value={editingForm.premium || ''} 
                onChange={(e) => setEditingForm({ ...editingForm, premium: Number(e.target.value) })} 
              />
            </div>
            <div>
              <label className="label">Frequency</label>
              <select 
                className="input" 
                value={editingForm.premiumFrequency} 
                onChange={(e) => setEditingForm({ ...editingForm, premiumFrequency: e.target.value as Policy['premiumFrequency'] })}
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="half_yearly">Half Yearly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div>
              <label className="label">Sum Assured (₹)</label>
              <input 
                className="input" 
                type="number" 
                value={editingForm.sumAssured || ''} 
                onChange={(e) => setEditingForm({ ...editingForm, sumAssured: Number(e.target.value) })} 
              />
            </div>
            <div>
              <label className="label">Nominee</label>
              <input 
                className="input" 
                value={editingForm.nominee} 
                onChange={(e) => setEditingForm({ ...editingForm, nominee: e.target.value })} 
              />
            </div>
            <div>
              <label className="label">Start Date</label>
              <input 
                className="input" 
                type="date" 
                value={editingForm.startDate} 
                onChange={(e) => setEditingForm({ ...editingForm, startDate: e.target.value })} 
              />
            </div>
            <div>
              <label className="label">Due Date</label>
              <input 
                className="input" 
                type="date" 
                value={editingForm.dueDate} 
                onChange={(e) => setEditingForm({ ...editingForm, dueDate: e.target.value })} 
              />
            </div>
            <div>
              <label className="label">Status</label>
              <select 
                className="input" 
                value={editingForm.status} 
                onChange={(e) => setEditingForm({ ...editingForm, status: e.target.value as PolicyStatus })}
              >
                <option value="active">Active</option>
                <option value="lapsed">Lapsed</option>
                <option value="pending">Pending</option>
                <option value="claim">Claim</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setEditingPolicy(null)} className="btn btn-secondary">Cancel</button>
            <button onClick={handleSavePolicyEdit} className="btn btn-primary">Save Changes</button>
          </div>
        </Modal>
      )}

      {/* Add Policy Modal */}
      {addingPolicy && (
        <Modal 
          isOpen={true} 
          onClose={() => setAddingPolicy(false)} 
          title="Link New Policy" 
          size="lg"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Company *</label>
              <input 
                className="input" 
                value={newPolicyForm.company} 
                onChange={(e) => setNewPolicyForm({ ...newPolicyForm, company: e.target.value })} 
                placeholder="LIC" 
              />
            </div>
            <div>
              <label className="label">Policy Number *</label>
              <input 
                className="input" 
                value={newPolicyForm.policyNumber} 
                onChange={(e) => setNewPolicyForm({ ...newPolicyForm, policyNumber: e.target.value })} 
                placeholder="Policy Number" 
              />
            </div>
            <div>
              <label className="label">Type</label>
              <select 
                className="input" 
                value={newPolicyForm.type} 
                onChange={(e) => setNewPolicyForm({ ...newPolicyForm, type: e.target.value as PolicyType })}
              >
                {Object.entries(policyTypeLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Premium (₹)</label>
              <input 
                className="input" 
                type="number" 
                value={newPolicyForm.premium || ''} 
                onChange={(e) => setNewPolicyForm({ ...newPolicyForm, premium: Number(e.target.value) })} 
              />
            </div>
            <div>
              <label className="label">Frequency</label>
              <select 
                className="input" 
                value={newPolicyForm.premiumFrequency} 
                onChange={(e) => setNewPolicyForm({ ...newPolicyForm, premiumFrequency: e.target.value as Policy['premiumFrequency'] })}
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="half_yearly">Half Yearly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div>
              <label className="label">Sum Assured (₹)</label>
              <input 
                className="input" 
                type="number" 
                value={newPolicyForm.sumAssured || ''} 
                onChange={(e) => setNewPolicyForm({ ...newPolicyForm, sumAssured: Number(e.target.value) })} 
              />
            </div>
            <div>
              <label className="label">Nominee</label>
              <input 
                className="input" 
                value={newPolicyForm.nominee} 
                onChange={(e) => setNewPolicyForm({ ...newPolicyForm, nominee: e.target.value })} 
              />
            </div>
            <div>
              <label className="label">Start Date</label>
              <input 
                className="input" 
                type="date" 
                value={newPolicyForm.startDate} 
                onChange={(e) => setNewPolicyForm({ ...newPolicyForm, startDate: e.target.value })} 
              />
            </div>
            <div>
              <label className="label">Due Date</label>
              <input 
                className="input" 
                type="date" 
                value={newPolicyForm.dueDate} 
                onChange={(e) => setNewPolicyForm({ ...newPolicyForm, dueDate: e.target.value })} 
              />
            </div>
            <div>
              <label className="label">Status</label>
              <select 
                className="input" 
                value={newPolicyForm.status} 
                onChange={(e) => setNewPolicyForm({ ...newPolicyForm, status: e.target.value as PolicyStatus })}
              >
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
    </div>
  );
}
