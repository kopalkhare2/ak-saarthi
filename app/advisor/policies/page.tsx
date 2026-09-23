'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useApp } from '@/contexts/app-context';
import Badge, { policyStatusBadge } from '@/components/ui/badge';
import EmptyState from '@/components/ui/empty-state';
import Modal from '@/components/ui/modal';
import { formatCurrency, formatDate, getFullName, generateId, policyTypeLabels, daysFromNow, formatPhoneForWhatsapp } from '@/lib/utils';
import type { Policy, PolicyType } from '@/lib/types';
import { Shield, Plus, Search, AlertTriangle, MessageSquare, Send, Check, Copy, ToggleLeft, ToggleRight, CheckCircle, Mail, Clock, Bell } from 'lucide-react';

interface AutoReminderLog {
  id: string;
  clientName: string;
  policyNumber: string;
  company: string;
  type: 'renewal' | 'revival';
  method: 'WhatsApp' | 'Email';
  timestamp: string;
  status: 'Sent' | 'Delivered';
  paymentLink: string;
}

const getPaymentLink = (company: string): string => {
  const cName = company.toLowerCase();
  if (cName.includes('lic')) return 'https://www.licindia.in';
  if (cName.includes('care')) return 'https://www.careinsurance.com/quick-pay.html';
  if (cName.includes('hdfc')) return 'https://www.hdfcergo.com/quick-pay';
  if (cName.includes('star')) return 'https://www.starhealth.in/quick-pay';
  if (cName.includes('niva') || cName.includes('bupa')) return 'https://www.nivabupa.com/quick-renew.html';
  return 'https://www.licindia.in';
};

export default function PoliciesPage() {
  const { clients, policies, addPolicy } = useApp();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'renewals' | 'lapsed'>('all');

  // Automation state
  const [autoRemindersEnabled, setAutoRemindersEnabled] = useState(true);
  const [manualLogs, setManualLogs] = useState<AutoReminderLog[]>([]);
  const [msgLanguage, setMsgLanguage] = useState<'en' | 'hi'>('en');

  // Scheduled dispatch state
  const [scheduledTime, setScheduledTime] = useState<string>('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleFired, setScheduleFired] = useState(false);
  const scheduleIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Reminder Modal state
  const [selectedPolicyForReminder, setSelectedPolicyForReminder] = useState<Policy | null>(null);
  const [copied, setCopied] = useState(false);

  // Form
  const [form, setForm] = useState({
    clientId: '', company: '', policyNumber: '', type: 'life' as PolicyType,
    premium: 0, premiumFrequency: 'yearly' as Policy['premiumFrequency'],
    dueDate: '', startDate: '', sumAssured: 0, nominee: '',
  });
  const set = (f: string, v: string | number) => setForm((p) => ({ ...p, [f]: v }));

  // Derive mock automated-reminder logs from due/lapsed policies (top 5)
  const autoLogs = useMemo<AutoReminderLog[]>(() => {
    if (!autoRemindersEnabled) return [];

    const logs: AutoReminderLog[] = [];
    let delay = 10; // minutes ago

    policies.forEach((p) => {
      const days = daysFromNow(p.dueDate);
      const client = clients.find((c) => c.id === p.clientId);
      if (!client) return;
      const name = getFullName(client.firstName, client.lastName);

      // Deterministic (not Math.random()) so this mock log is stable across
      // re-renders — alternate the channel by policy id instead.
      const mockChannel: 'WhatsApp' | 'Email' = p.id.charCodeAt(p.id.length - 1) % 2 === 0 ? 'WhatsApp' : 'Email';

      if (p.status === 'lapsed') {
        logs.push({
          id: `log-${p.id}`,
          clientName: name,
          policyNumber: p.policyNumber,
          company: p.company,
          type: 'revival',
          method: mockChannel,
          timestamp: `${delay} mins ago`,
          status: 'Delivered',
          paymentLink: getPaymentLink(p.company),
        });
        delay += 45;
      } else if (days >= -30 && days <= 30) {
        logs.push({
          id: `log-${p.id}`,
          clientName: name,
          policyNumber: p.policyNumber,
          company: p.company,
          type: 'renewal',
          method: mockChannel,
          timestamp: `${delay} mins ago`,
          status: 'Sent',
          paymentLink: getPaymentLink(p.company),
        });
        delay += 30;
      }
    });

    return logs.slice(0, 5);
  }, [autoRemindersEnabled, policies, clients]);

  // ── Scheduled Auto-Dispatch Logic ──────────────────
  const fireScheduledDispatch = useCallback(() => {
    // Collect all due & lapsed policies
    const targetPolicies: { policy: Policy; clientName: string; clientPhone: string; clientEmail: string; type: 'renewal' | 'revival' }[] = [];
    policies.forEach((p) => {
      const days = daysFromNow(p.dueDate);
      const client = clients.find((c) => c.id === p.clientId);
      if (!client) return;
      const name = getFullName(client.firstName, client.lastName);
      if (p.status === 'lapsed') {
        targetPolicies.push({ policy: p, clientName: name, clientPhone: client.phone, clientEmail: client.email, type: 'revival' });
      } else if (days >= -30 && days <= 30) {
        targetPolicies.push({ policy: p, clientName: name, clientPhone: client.phone, clientEmail: client.email, type: 'renewal' });
      }
    });

    if (targetPolicies.length === 0) return;

    const nowStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    const newLogs: AutoReminderLog[] = [];

    // Send browser notification
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('AK Saarthi – Scheduled Reminders Dispatched', {
        body: `${targetPolicies.length} reminder(s) sent via WhatsApp at ${nowStr}.\nClients: ${targetPolicies.map(t => t.clientName).join(', ')}`,
        icon: '/favicon.ico',
      });
    }

    // Open WhatsApp links for each target (limited to first 5 to avoid popup blocking)
    targetPolicies.slice(0, 5).forEach((t, idx) => {
      const p = t.policy;
      const premiumFormatted = formatCurrency(p.premium);
      const dateFormatted = formatDate(p.dueDate);
      const payLink = getPaymentLink(p.company);
      const msg = t.type === 'revival'
        ? `Dear ${t.clientName},\n\n⚠️ Your policy ${p.company} (${p.policyNumber}) has LAPSED.\n\nPremium: ${premiumFormatted}\nLapse Date: ${dateFormatted}\n\nRevive now: ${payLink}\n\n– AK Investments & Financial Services`
        : `Dear ${t.clientName},\n\nReminder: Your policy ${p.company} (${p.policyNumber}) premium of ${premiumFormatted} is due on ${dateFormatted}.\n\nPay now: ${payLink}\n\n– AK Investments & Financial Services`;
      const waUrl = `https://api.whatsapp.com/send?phone=${formatPhoneForWhatsapp(t.clientPhone)}&text=${encodeURIComponent(msg)}`;
      
      // Stagger opening to avoid popup blockers
      setTimeout(() => {
        window.open(waUrl, `_wa_${idx}`);
      }, idx * 800);

      newLogs.push({
        id: `sched-${Date.now()}-${idx}`,
        clientName: t.clientName,
        policyNumber: p.policyNumber,
        company: p.company,
        type: t.type,
        method: 'WhatsApp',
        timestamp: `Scheduled @ ${nowStr}`,
        status: 'Delivered',
        paymentLink: payLink,
      });
    });

    setManualLogs((prev) => [...newLogs, ...prev]);
    setScheduleFired(true);
    setIsScheduled(false);
  }, [policies, clients]);

  useEffect(() => {
    if (!isScheduled || !scheduledTime || scheduleFired) {
      if (scheduleIntervalRef.current) {
        clearInterval(scheduleIntervalRef.current);
        scheduleIntervalRef.current = null;
      }
      return;
    }

    // Request notification permission upfront
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Check every 5 seconds if current time matches the scheduled time
    scheduleIntervalRef.current = setInterval(() => {
      const now = new Date();
      const [targetH, targetM] = scheduledTime.split(':').map(Number);
      if (now.getHours() === targetH && now.getMinutes() === targetM) {
        fireScheduledDispatch();
        if (scheduleIntervalRef.current) {
          clearInterval(scheduleIntervalRef.current);
          scheduleIntervalRef.current = null;
        }
      }
    }, 5000);

    return () => {
      if (scheduleIntervalRef.current) {
        clearInterval(scheduleIntervalRef.current);
        scheduleIntervalRef.current = null;
      }
    };
  }, [isScheduled, scheduledTime, scheduleFired, fireScheduledDispatch]);

  let filtered = policies;

  // Filter based on active tab
  if (activeTab === 'renewals') {
    filtered = policies.filter((p) => {
      const days = daysFromNow(p.dueDate);
      return p.status !== 'lapsed' && days >= -30 && days <= 30;
    });
  } else if (activeTab === 'lapsed') {
    filtered = policies.filter((p) => p.status === 'lapsed');
  }

  // General search/filters
  if (search) {
    const clientMap = new Map(clients.map((c) => [c.id, getFullName(c.firstName, c.lastName)]));
    filtered = filtered.filter((p) => {
      const clientName = clientMap.get(p.clientId) || '';
      const haystack = `${clientName} ${p.company} ${p.policyNumber}`.toLowerCase();
      return haystack.includes(search.toLowerCase());
    });
  }
  if (filterType !== 'all') filtered = filtered.filter((p) => p.type === filterType);
  if (filterStatus !== 'all' && activeTab === 'all') filtered = filtered.filter((p) => p.status === filterStatus);

  const handleAdd = () => {
    if (!form.clientId) {
      alert('Please select a Client for this policy.');
      return;
    }
    if (!form.company.trim()) {
      alert('Please enter the Company name (e.g. LIC, Care, etc.).');
      return;
    }
    if (!form.policyNumber.trim()) {
      alert('Please enter the Policy Number.');
      return;
    }
    
    addPolicy({
      id: generateId(),
      clientId: form.clientId,
      company: form.company.trim(),
      policyNumber: form.policyNumber.trim(),
      type: form.type,
      premium: form.premium,
      premiumFrequency: form.premiumFrequency,
      dueDate: form.dueDate,
      startDate: form.startDate,
      sumAssured: form.sumAssured,
      nominee: form.nominee,
      status: 'active',
      renewalStatus: 'not_due',
      createdAt: new Date().toISOString(),
    });
    setShowAdd(false);
    setForm({ clientId: '', company: '', policyNumber: '', type: 'life', premium: 0, premiumFrequency: 'yearly', dueDate: '', startDate: '', sumAssured: 0, nominee: '' });
  };

  const clientForReminder = selectedPolicyForReminder 
    ? clients.find((c) => c.id === selectedPolicyForReminder.clientId)
    : null;
  const clientNameStr = clientForReminder ? getFullName(clientForReminder.firstName, clientForReminder.lastName) : 'Client';

  const formatDobForLic = (dobString?: string): string => {
    if (!dobString) return 'DD/MM/YYYY';
    try {
      const d = new Date(dobString);
      if (isNaN(d.getTime())) return dobString;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dobString;
    }
  };

  const getReminderMessage = (lang: 'en' | 'hi' = 'en') => {
    if (!selectedPolicyForReminder) return '';
    const p = selectedPolicyForReminder;
    const premiumFormatted = formatCurrency(p.premium);
    const dateFormatted = formatDate(p.dueDate);
    const payLink = getPaymentLink(p.company);
    const dobFormatted = clientForReminder ? formatDobForLic(clientForReminder.dob) : 'DD/MM/YYYY';
    const emailStr = clientForReminder?.email || 'Registered Email';
    const phoneStr = clientForReminder?.phone || 'Registered Mobile';

    if (lang === 'hi') {
      if (p.status === 'lapsed') {
        return `प्रिय ${clientNameStr},\n\n` +
          `यह AK Investments & Financial Services की ओर से आपकी पॉलिसी के लिए एक महत्वपूर्ण सूचना है।\n\n` +
          `• *पॉलिसी:* ${p.company} (${p.policyNumber})\n` +
          `• *प्रीमियम राशि:* ${premiumFormatted}\n` +
          `• *व्यपगत तिथि (Lapse Date):* ${dateFormatted}\n\n` +
          `⚠️ *स्थिति:* आपकी यह पॉलिसी वर्तमान में *लैप्स (Lapsed)* हो गई है। सुरक्षा कवर को बहाल करने के लिए रिवाइवल आवश्यक है।\n\n` +
          `कृपया भुगतान करने के लिए आधिकारिक पोर्टल पर इन विवरणों का उपयोग करें:\n` +
          `• पॉलिसी नंबर: *${p.policyNumber}*\n` +
          `• जन्म तिथि: *${dobFormatted}*\n` +
          `• पंजीकृत मोबाइल: *${phoneStr}*\n` +
          `• पंजीकृत ईमेल: *${emailStr}*\n\n` +
          `🔗 *आधिकारिक भुगतान लिंक:* ${payLink}\n` +
          `_(नोट: लिंक खोलें, "Pay Direct" पर क्लिक करें, और ऊपर दिए गए विवरण दर्ज करें)_\n\n` +
          `कृपया ब्याज और रिवाइवल प्रक्रिया की सहायता के लिए तुरंत हमसे संपर्क करें।\n\n` +
          `सादर,\nAK Investments & Financial Services`;
      } else {
        return `प्रिय ${clientNameStr},\n\n` +
          `यह AK Investments & Financial Services की ओर से आपकी पॉलिसी के नवीनीकरण (Renewal) के लिए एक सूचना है।\n\n` +
          `• *पॉलिसी:* ${p.company} (${p.policyNumber})\n` +
          `• *प्रीमियम राशि:* ${premiumFormatted}\n` +
          `• *देय तिथि (Due Date):* ${dateFormatted}\n\n` +
          `कृपया भुगतान करने के लिए आधिकारिक पोर्टल पर इन विवरणों का उपयोग करें:\n` +
          `• पॉलिसी नंबर: *${p.policyNumber}*\n` +
          `• जन्म तिथि: *${dobFormatted}*\n` +
          `• पंजीकृत मोबाइल: *${phoneStr}*\n` +
          `• पंजीकृत ईमेल: *${emailStr}*\n\n` +
          `🔗 *आधिकारिक भुगतान लिंक:* ${payLink}\n` +
          `_(नोट: लिंक खोलें, "Pay Direct" पर क्लिक करें, और ऊपर दिए गए विवरण दर्ज करें)_\n\n` +
          `पॉलिसी को चालू रखने और निरंतर सुरक्षा कवरेज के लिए कृपया समय पर भुगतान करें।\n\n` +
          `सादर,\nAK Investments & Financial Services`;
      }
    }

    if (p.status === 'lapsed') {
      return `Dear ${clientNameStr},\n\n` +
        `This is a priority notice from AK Investments & Financial Services regarding your policy.\n\n` +
        `• *Policy:* ${p.company} (${p.policyNumber})\n` +
        `• *Premium Amount:* ${premiumFormatted}\n` +
        `• *Lapse Date:* ${dateFormatted}\n\n` +
        `⚠️ *Status:* This policy has currently *LAPSED*. To restore your cover protection, revival is required.\n\n` +
        `Please complete the payment on the official portal using these details:\n` +
        `• Policy Number: *${p.policyNumber}*\n` +
        `• Date of Birth: *${dobFormatted}*\n` +
        `• Registered Mobile: *${phoneStr}*\n` +
        `• Registered Email: *${emailStr}*\n\n` +
        `🔗 *Official Payments Portal:* ${payLink}\n` +
        `_(Note: Open link, click "Pay Direct", and enter the above details to pay online)_\n\n` +
        `Please contact us immediately to help calculate pending interest late fees and complete the revival process.\n\n` +
        `Best regards,\nAK Investments & Financial Services`;
    } else {
      return `Dear ${clientNameStr},\n\n` +
        `This is a friendly reminder that your policy premium is due for renewal.\n\n` +
        `• *Policy:* ${p.company} (${p.policyNumber})\n` +
        `• *Premium Amount:* ${premiumFormatted}\n` +
        `• *Due Date:* ${dateFormatted}\n\n` +
        `Please complete the payment on the official portal using these details:\n` +
        `• Policy Number: *${p.policyNumber}*\n` +
        `• Date of Birth: *${dobFormatted}*\n` +
        `• Registered Mobile: *${phoneStr}*\n` +
        `• Registered Email: *${emailStr}*\n\n` +
        `🔗 *Official Payments Portal:* ${payLink}\n` +
        `_(Note: Open link, click "Pay Direct", and enter the above details to pay online)_\n\n` +
        `Please complete the premium payment before the due date to ensure continuous, uninterrupted coverage.\n\n` +
        `Best regards,\nAK Investments & Financial Services`;
    }
  };

  const handleCopyReminder = () => {
    navigator.clipboard.writeText(getReminderMessage(msgLanguage));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Only ever invoked from a button's onClick below, never during render.
  const addManualLog = (method: 'WhatsApp' | 'Email') => {
    if (!selectedPolicyForReminder || !clientForReminder) return;
    const newLog: AutoReminderLog = {
      // eslint-disable-next-line react-hooks/purity -- event-handler only, not render
      id: `manual-log-${Date.now()}`,
      clientName: getFullName(clientForReminder.firstName, clientForReminder.lastName),
      policyNumber: selectedPolicyForReminder.policyNumber,
      company: selectedPolicyForReminder.company,
      type: selectedPolicyForReminder.status === 'lapsed' ? 'revival' : 'renewal',
      method: method,
      timestamp: 'Just now',
      status: method === 'WhatsApp' ? 'Delivered' : 'Sent',
      paymentLink: getPaymentLink(selectedPolicyForReminder.company),
    };
    setManualLogs((prev) => [newLog, ...prev]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Policies</h1>
          <p className="text-sm text-slate-400 mt-1">{policies.length} total policies</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn btn-primary">
          <Plus size={16} /> Add Policy
        </button>
      </div>

      {/* Reminders & Alerts Sub-Navigation tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-px">
        <button 
          onClick={() => setActiveTab('all')}
          className={`py-2.5 px-4 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'all' ? 'border-yellow-500 text-yellow-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          All Policies
        </button>
        <button 
          onClick={() => setActiveTab('renewals')}
          className={`py-2.5 px-4 text-sm font-semibold border-b-2 transition-all relative ${
            activeTab === 'renewals' ? 'border-yellow-500 text-yellow-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Renewals & Dues
          {policies.filter((p) => p.status !== 'lapsed' && Math.abs(daysFromNow(p.dueDate)) <= 30).length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 text-[10px] rounded-full bg-yellow-500/20 text-yellow-400 font-bold">
              {policies.filter((p) => p.status !== 'lapsed' && Math.abs(daysFromNow(p.dueDate)) <= 30).length}
            </span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('lapsed')}
          className={`py-2.5 px-4 text-sm font-semibold border-b-2 transition-all relative ${
            activeTab === 'lapsed' ? 'border-yellow-500 text-yellow-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Lapsed Policy Revival
          {policies.filter((p) => p.status === 'lapsed').length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 text-[10px] rounded-full bg-red-500/20 text-red-400 font-bold">
              {policies.filter((p) => p.status === 'lapsed').length}
            </span>
          )}
        </button>
      </div>

      {/* Auto-Reminder Control Card (shown for Renewals and Lapsed tabs) */}
      {(activeTab === 'renewals' || activeTab === 'lapsed') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          {/* Status Toggle Card */}
          <div className="card p-5 space-y-3 bg-slate-900/50 border border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-200 text-sm">Auto-Reminder Engine</h3>
              <button 
                onClick={() => setAutoRemindersEnabled(!autoRemindersEnabled)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                {autoRemindersEnabled ? (
                  <ToggleRight className="text-yellow-400 w-12 h-7" />
                ) : (
                  <ToggleLeft className="text-slate-600 w-12 h-7" />
                )}
              </button>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Set a time below to automatically dispatch WhatsApp reminders with payment links to all due & lapsed policy holders.
            </p>
            <div className="flex items-center gap-2 text-xs">
              <span className={`w-2 h-2 rounded-full ${isScheduled ? 'bg-yellow-400 animate-pulse' : scheduleFired ? 'bg-emerald-500' : 'bg-emerald-500'}`} />
              <span className="text-slate-300 font-medium">Status: {isScheduled ? `Scheduled at ${scheduledTime}` : scheduleFired ? 'Dispatched ✓' : autoRemindersEnabled ? 'Active (Idle)' : 'Disabled'}</span>
            </div>

            {/* Scheduler Controls */}
            {autoRemindersEnabled && (
              <div className="border-t border-slate-800 pt-3 mt-1 space-y-2">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1"><Clock size={10} /> Schedule Dispatch Time</label>
                <div className="flex gap-2">
                  <input
                    type="time"
                    className="input text-xs py-1.5 px-2.5 h-8 flex-1"
                    value={scheduledTime}
                    onChange={(e) => { setScheduledTime(e.target.value); setScheduleFired(false); }}
                    disabled={isScheduled}
                  />
                  {!isScheduled ? (
                    <button
                      onClick={() => {
                        if (!scheduledTime) { alert('Please select a time first.'); return; }
                        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
                          Notification.requestPermission();
                        }
                        setIsScheduled(true);
                        setScheduleFired(false);
                      }}
                      disabled={!scheduledTime}
                      className="btn btn-primary text-[10px] py-1.5 px-3 flex items-center gap-1"
                    >
                      <Bell size={12} />
                      Schedule
                    </button>
                  ) : (
                    <button
                      onClick={() => { setIsScheduled(false); }}
                      className="btn btn-secondary text-[10px] py-1.5 px-3 text-red-400 border-red-500/30"
                    >
                      Cancel
                    </button>
                  )}
                </div>
                {isScheduled && (
                  <p className="text-[10px] text-yellow-400 font-semibold animate-pulse flex items-center gap-1">
                    <Bell size={10} />
                    WhatsApp reminders will auto-dispatch at {scheduledTime}. Keep this tab open.
                  </p>
                )}
                {scheduleFired && !isScheduled && (
                  <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle size={10} />
                    Reminders dispatched! Check logs above.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Active Logs Card */}
          <div className="lg:col-span-2 card p-5 space-y-3 bg-slate-900/30">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Reminder Dispatch Logs (Today)</h4>
            {[...manualLogs, ...autoLogs].length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No reminders dispatched yet. Select &quot;Notice Alert&quot; below to send manually.</p>
            ) : (
              <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                {[...manualLogs, ...autoLogs].map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-2.5 rounded bg-slate-900/80 border border-slate-800 text-xs">
                    <div className="flex items-center gap-2">
                      {log.method === 'WhatsApp' ? (
                        <MessageSquare size={14} className="text-emerald-400" />
                      ) : (
                        <Mail size={14} className="text-blue-400" />
                      )}
                      <div>
                        <span className="font-semibold text-slate-300">{log.clientName}</span>
                        <span className="text-slate-500 mx-1.5">·</span>
                        <span className="text-slate-400">{log.company} ({log.policyNumber})</span>
                      </div>
                    </div>
                    <div className="text-right text-[10px] flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        log.method === 'WhatsApp' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'
                      }`}>
                        {log.method}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-yellow-400 font-semibold">{log.type === 'renewal' ? 'Renewal Due' : 'Lapsed Revival'}</span>
                      <span className="text-slate-500 font-medium">{log.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input className="input pl-10" placeholder="Search by client, company, policy number..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto text-xs" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="all">All Types</option>
          {Object.entries(policyTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        {activeTab === 'all' && (
          <select className="input w-auto text-xs" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="lapsed">Lapsed</option>
            <option value="pending">Pending</option>
            <option value="claim">Claim</option>
          </select>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState 
          icon={<Shield size={28} />} 
          title={activeTab === 'renewals' ? "No pending renewals" : activeTab === 'lapsed' ? "No lapsed policies" : "No policies found"} 
          description="Track policyholder updates, premium alerts, and status notifications." 
        />
      ) : (
        <div className="card overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left p-4 text-xs font-semibold text-slate-400 uppercase">Client</th>
                  <th className="text-left p-4 text-xs font-semibold text-slate-400 uppercase">Company</th>
                  <th className="text-left p-4 text-xs font-semibold text-slate-400 uppercase">Policy #</th>
                  <th className="text-left p-4 text-xs font-semibold text-slate-400 uppercase">Type</th>
                  <th className="text-left p-4 text-xs font-semibold text-slate-400 uppercase">Premium</th>
                  <th className="text-left p-4 text-xs font-semibold text-slate-400 uppercase">Sum Assured</th>
                  <th className="text-left p-4 text-xs font-semibold text-slate-400 uppercase">Due Date</th>
                  <th className="text-left p-4 text-xs font-semibold text-slate-400 uppercase">Status</th>
                  {(activeTab === 'renewals' || activeTab === 'lapsed') && (
                    <th className="text-right p-4"></th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const client = clients.find((c) => c.id === p.clientId);
                  const days = daysFromNow(p.dueDate);
                  return (
                    <tr key={p.id} className="table-row">
                      <td className="p-4 font-medium">{client ? getFullName(client.firstName, client.lastName) : '—'}</td>
                      <td className="p-4 text-slate-300">{p.company}</td>
                      <td className="p-4 text-slate-400 font-mono text-xs">{p.policyNumber}</td>
                      <td className="p-4"><Badge label={policyTypeLabels[p.type] || p.type} variant="gold" dot={false} /></td>
                      <td className="p-4 text-yellow-400 font-semibold">{formatCurrency(p.premium)}</td>
                      <td className="p-4 text-slate-300">{formatCurrency(p.sumAssured)}</td>
                      <td className="p-4">
                        <span className={`flex items-center gap-1 ${
                          p.status === 'lapsed' ? 'text-red-400 font-medium' :
                          days <= 7 && days >= 0 ? 'text-red-400 font-medium animate-pulse' : 
                          days <= 30 && days >= 0 ? 'text-amber-400 font-medium' : 
                          'text-slate-300'
                        }`}>
                          {p.status !== 'lapsed' && days >= 0 && days <= 7 && <AlertTriangle size={12} />}
                          {formatDate(p.dueDate)}
                          {p.status !== 'lapsed' && days < 0 && <span className="text-red-500 text-xs font-semibold">(Overdue)</span>}
                        </span>
                      </td>
                      <td className="p-4">{policyStatusBadge(p.status)}</td>
                      {(activeTab === 'renewals' || activeTab === 'lapsed') && (
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => setSelectedPolicyForReminder(p)}
                            className="btn btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 ml-auto"
                          >
                            <MessageSquare size={13} />
                            Notice Alert
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Setup Reminder Notice Alert Modal */}
      {selectedPolicyForReminder && clientForReminder && (
        <Modal 
          isOpen={true} 
          onClose={() => setSelectedPolicyForReminder(null)} 
          title={selectedPolicyForReminder.status === 'lapsed' ? "Lapsed Policy Revival Notice" : "Renewal Reminder Alert"}
          size="md"
        >
          <div className="space-y-4">
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 text-xs space-y-2">
              <p><span className="text-slate-500">Client:</span> <span className="font-bold">{clientNameStr}</span></p>
              <p><span className="text-slate-500">Policy:</span> <span>{selectedPolicyForReminder.company} ({selectedPolicyForReminder.policyNumber})</span></p>
              <p><span className="text-slate-500">Due Date:</span> <span className="font-semibold text-yellow-400">{formatDate(selectedPolicyForReminder.dueDate)}</span></p>
              <div className="border-t border-slate-800 my-2 pt-2 space-y-1">
                <p className="font-semibold text-slate-300">Credentials to enter on portal:</p>
                <p><span className="text-slate-500">Policy Number:</span> <span className="font-mono font-bold text-yellow-400 select-all">{selectedPolicyForReminder.policyNumber}</span></p>
                <p><span className="text-slate-500">Date of Birth:</span> <span className="font-mono font-bold text-yellow-400 select-all">{formatDobForLic(clientForReminder.dob)}</span></p>
                <p><span className="text-slate-500">Mobile Number:</span> <span className="font-mono font-bold text-yellow-400 select-all">{clientForReminder.phone}</span></p>
                <p><span className="text-slate-500">Email ID:</span> <span className="font-mono font-bold text-yellow-400 select-all">{clientForReminder.email}</span></p>
              </div>
              <p><span className="text-slate-500">Portal Link:</span> <a href={getPaymentLink(selectedPolicyForReminder.company)} target="_blank" rel="noreferrer" className="text-yellow-400 hover:underline font-bold">{getPaymentLink(selectedPolicyForReminder.company)}</a></p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="label text-xs">Notice Message Template</label>
                <div className="flex gap-1.5 bg-slate-900 p-0.5 rounded border border-slate-800">
                  <button 
                    onClick={() => setMsgLanguage('en')}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${msgLanguage === 'en' ? 'bg-yellow-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    English
                  </button>
                  <button 
                    onClick={() => setMsgLanguage('hi')}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${msgLanguage === 'hi' ? 'bg-yellow-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    हिंदी (Hindi)
                  </button>
                </div>
              </div>
              <textarea 
                className="input min-h-[220px] text-xs font-mono leading-relaxed" 
                value={getReminderMessage(msgLanguage)}
                readOnly
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <button onClick={() => setSelectedPolicyForReminder(null)} className="btn btn-secondary text-xs">Close</button>
            <button onClick={handleCopyReminder} className="btn btn-secondary text-xs flex items-center gap-1.5">
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy Notice'}
            </button>
            <a 
              href={`mailto:${clientForReminder.email}?subject=${encodeURIComponent(
                selectedPolicyForReminder.status === 'lapsed' 
                  ? `Lapsed Policy Revival Notice - ${selectedPolicyForReminder.company}` 
                  : `Renewal Reminder Alert - ${selectedPolicyForReminder.company}`
              )}&body=${encodeURIComponent(getReminderMessage(msgLanguage))}`}
              className="btn btn-secondary text-xs flex items-center gap-1.5"
              onClick={() => addManualLog('Email')}
            >
              <Mail size={13} />
              Email Notice
            </a>
            <a 
              href={`https://api.whatsapp.com/send?phone=${formatPhoneForWhatsapp(clientForReminder.phone)}&text=${encodeURIComponent(getReminderMessage(msgLanguage))}`}
              target="_blank" 
              rel="noreferrer"
              className="btn btn-primary text-xs flex items-center gap-1.5"
              onClick={() => addManualLog('WhatsApp')}
            >
              <Send size={13} />
              WhatsApp Notice
            </a>
          </div>
        </Modal>
      )}

      {/* Add Policy Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add New Policy" size="lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Client *</label>
            <select className="input" value={form.clientId} onChange={(e) => set('clientId', e.target.value)}>
              <option value="">Select client...</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{getFullName(c.firstName, c.lastName)}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Company *</label>
            <input className="input" value={form.company} onChange={(e) => set('company', e.target.value)} placeholder="LIC" />
          </div>
          <div>
            <label className="label">Policy Number *</label>
            <input className="input" value={form.policyNumber} onChange={(e) => set('policyNumber', e.target.value)} placeholder="LIC-2024-12345" />
          </div>
          <div>
            <label className="label">Type</label>
            <select className="input" value={form.type} onChange={(e) => set('type', e.target.value)}>
              {Object.entries(policyTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Premium (₹)</label>
            <input className="input" type="number" value={form.premium || ''} onChange={(e) => set('premium', Number(e.target.value))} />
          </div>
          <div>
            <label className="label">Frequency</label>
            <select className="input" value={form.premiumFrequency} onChange={(e) => set('premiumFrequency', e.target.value)}>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="half_yearly">Half Yearly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div>
            <label className="label">Sum Assured (₹)</label>
            <input className="input" type="number" value={form.sumAssured || ''} onChange={(e) => set('sumAssured', Number(e.target.value))} />
          </div>
          <div>
            <label className="label">Nominee</label>
            <input className="input" value={form.nominee} onChange={(e) => set('nominee', e.target.value)} />
          </div>
          <div>
            <label className="label">Start Date</label>
            <input className="input" type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} />
          </div>
          <div>
            <label className="label">Due Date</label>
            <input className="input" type="date" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setShowAdd(false)} className="btn btn-secondary">Cancel</button>
          <button onClick={handleAdd} className="btn btn-primary">Add Policy</button>
        </div>
      </Modal>
    </div>
  );
}
