'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/app-context';
import StatCard from '@/components/ui/stat-card';
import Badge, { policyStatusBadge } from '@/components/ui/badge';
import Modal from '@/components/ui/modal';
import { formatCurrency, formatDate, daysFromNow, generateId } from '@/lib/utils';
import { Shield, TrendingUp, Calendar, AlertTriangle, Mail, Phone, CalendarRange, Clock, User } from 'lucide-react';

export default function ClientDashboard() {
  const { clients, policies, investments, appointments, addAppointment } = useApp();
  const [clientId, setClientId] = useState<string>('client-001');
  const [showBookModal, setShowBookModal] = useState(false);

  // Form states for booking
  const [bookTitle, setBookTitle] = useState('Portfolio Review');
  const [bookDate, setBookDate] = useState('');
  const [bookTime, setBookTime] = useState('10:00');
  const [bookDuration, setBookDuration] = useState('30');
  const [bookNotes, setBookNotes] = useState('');
  const [bookSuccess, setBookSuccess] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem('ak_logged_in_client_id');
    if (id) {
      setClientId(id);
    }
  }, []);

  const activeClient = clients.find((c) => c.id === clientId) as any;
  const firstName = activeClient ? activeClient.firstName : 'Client';
  const advisor = activeClient?.advisor;

  const myPolicies = policies.filter((p) => p.clientId === clientId);
  const myInvestments = investments.filter((i) => i.clientId === clientId);
  const activePolicies = myPolicies.filter((p) => p.status === 'active').length;
  const totalPortfolio = myInvestments.reduce((s, i) => s + i.currentValue, 0);
  const premiumsDue = myPolicies.filter((p) => daysFromNow(p.dueDate) >= 0 && daysFromNow(p.dueDate) <= 30).length;
  const nextAppt = appointments.find((a) => a.clientId === clientId && a.status === 'scheduled');

  const handleBookAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookDate) {
      alert('Please select a date');
      return;
    }

    const apptId = generateId();
    addAppointment({
      id: apptId,
      clientId: clientId,
      clientName: activeClient ? `${activeClient.firstName} ${activeClient.lastName}` : 'Client',
      title: bookTitle,
      type: 'meeting',
      date: bookDate,
      time: bookTime,
      duration: Number(bookDuration),
      notes: bookNotes,
      status: 'scheduled',
      advisorId: activeClient?.advisorId || null,
    } as any);

    setBookSuccess(true);
    setTimeout(() => {
      setBookSuccess(false);
      setShowBookModal(false);
      // Reset form
      setBookTitle('Portfolio Review');
      setBookDate('');
      setBookTime('10:00');
      setBookDuration('30');
      setBookNotes('');
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Dashboard</h1>
        <p className="text-sm text-slate-400 mt-1">Welcome back, {firstName}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Policies" value={activePolicies.toString()} icon={<Shield size={20} />} accent="bg-emerald-500/10 text-emerald-400" />
        <StatCard title="Portfolio Value" value={formatCurrency(totalPortfolio)} icon={<TrendingUp size={20} />} accent="bg-blue-500/10 text-blue-400" />
        <StatCard title="Premiums Due" value={premiumsDue.toString()} icon={<AlertTriangle size={20} />} accent="bg-amber-500/10 text-amber-400" />
        <StatCard title="Next Appointment" value={nextAppt ? `${formatDate(nextAppt.date)} at ${nextAppt.time}` : 'None Scheduled'} icon={<Calendar size={20} />} accent="bg-purple-500/10 text-purple-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Policies & Investments (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* My Policies */}
          <div className="card p-5 animate-fade-in">
            <h3 className="font-semibold mb-4 text-slate-200">My Policies</h3>
            {myPolicies.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">No policies found.</p>
            ) : (
              <div className="space-y-3">
                {myPolicies.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                    <div>
                      <p className="text-sm font-medium text-slate-300">{p.company}</p>
                      <p className="text-xs text-slate-500">{p.policyNumber} · Premium: {formatCurrency(p.premium)}/yr</p>
                    </div>
                    {policyStatusBadge(p.status)}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* My Investments */}
          <div className="card p-5 animate-fade-in">
            <h3 className="font-semibold mb-4 text-slate-200">My Investments</h3>
            {myInvestments.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">No investments found.</p>
            ) : (
              <div className="space-y-3">
                {myInvestments.map((i) => (
                  <div key={i.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                    <div>
                      <p className="text-sm font-medium text-slate-300">{i.schemeName}</p>
                      <p className="text-xs text-slate-500">Invested: {formatCurrency(i.investedAmount)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-emerald-400">{formatCurrency(i.currentValue)}</p>
                      <p className={`text-xs ${i.returns >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{i.returns >= 0 ? '+' : ''}{i.returns.toFixed(1)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Advisor Details & Actions (1/3 width) */}
        <div className="space-y-6">
          {/* Advisor Details */}
          <div className="card p-5 animate-fade-in">
            <h3 className="font-semibold mb-4 text-slate-200 flex items-center gap-2">
              <User size={18} className="text-yellow-400" />
              My Advisor
            </h3>

            {advisor ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center font-bold text-yellow-400 border border-yellow-500/20">
                    {advisor.firstName ? `${advisor.firstName[0]}${advisor.lastName[0]}` : 'A'}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200">
                      {advisor.firstName ? `${advisor.firstName} ${advisor.lastName}` : 'Financial Partner'}
                    </h4>
                    <p className="text-xs text-slate-500">Authorized Financial Advisor</p>
                  </div>
                </div>

                <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center gap-2.5 text-xs text-slate-400">
                    <Mail size={14} className="text-slate-500" />
                    <span>{advisor.email}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-400">
                    <Phone size={14} className="text-slate-500" />
                    <span>{advisor.phone || '—'}</span>
                  </div>
                </div>

                <button
                  onClick={() => setShowBookModal(true)}
                  className="w-full mt-2 btn btn-primary py-2.5 text-xs flex items-center justify-center gap-2"
                >
                  <CalendarRange size={14} />
                  Request Appointment
                </button>
              </div>
            ) : (
              <div className="text-center py-4 space-y-2">
                <p className="text-xs text-slate-500">No advisor currently assigned.</p>
                <p className="text-[11px] text-slate-400">
                  Contact support at <span className="text-yellow-400">support@aksaarthi.com</span> to link your advisor.
                </p>
              </div>
            )}
          </div>

          {/* Next Scheduled Meeting detail */}
          {nextAppt && (
            <div className="card p-5 bg-purple-500/5 border border-purple-500/10 animate-fade-in">
              <h3 className="font-semibold mb-3 text-purple-400 flex items-center gap-2 text-sm">
                <CalendarRange size={16} />
                Upcoming Meeting
              </h3>
              <p className="text-xs font-medium text-slate-200">{nextAppt.title}</p>
              <p className="text-[11px] text-slate-400 mt-1">
                {formatDate(nextAppt.date)} at {nextAppt.time} ({nextAppt.duration} mins)
              </p>
              {nextAppt.notes && (
                <p className="text-[10px] text-slate-500 mt-2 bg-slate-900/50 p-2 rounded italic">
                  &quot;{nextAppt.notes}&quot;
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Appointment Booking Modal */}
      <Modal isOpen={showBookModal} onClose={() => setShowBookModal(false)} title="Request an Appointment">
        {bookSuccess ? (
          <div className="flex flex-col items-center gap-3 py-6 text-emerald-400 text-center">
            <Calendar size={48} className="animate-bounce" />
            <p className="font-semibold text-lg">Appointment Requested!</p>
            <p className="text-sm text-slate-400">
              Your request has been sent to {advisor?.firstName || 'your advisor'}.
            </p>
          </div>
        ) : (
          <form onSubmit={handleBookAppointment} className="space-y-4">
            <p className="text-xs text-slate-400">
              Schedule a review or consultation meeting with your financial advisor.
            </p>

            <div>
              <label className="label">Meeting Purpose</label>
              <select className="input" value={bookTitle} onChange={(e) => setBookTitle(e.target.value)}>
                <option value="Portfolio Review">Portfolio Review</option>
                <option value="Policy Discussion">Policy Discussion</option>
                <option value="Investment Strategy">Investment Strategy</option>
                <option value="General Consultation">General Consultation</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label flex items-center gap-1.5"><Calendar size={12} /> Date</label>
                <input
                  type="date"
                  className="input"
                  required
                  value={bookDate}
                  onChange={(e) => setBookDate(e.target.value)}
                />
              </div>
              <div>
                <label className="label flex items-center gap-1.5"><Clock size={12} /> Time</label>
                <input
                  type="time"
                  className="input"
                  required
                  value={bookTime}
                  onChange={(e) => setBookTime(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="label">Duration</label>
              <select className="input" value={bookDuration} onChange={(e) => setBookDuration(e.target.value)}>
                <option value="15">15 Minutes</option>
                <option value="30">30 Minutes</option>
                <option value="45">45 Minutes</option>
                <option value="60">1 Hour</option>
              </select>
            </div>

            <div>
              <label className="label">Notes / Agenda (Optional)</label>
              <textarea
                className="input min-h-[80px] text-xs"
                placeholder="Mention any specific policies or questions you want to discuss..."
                value={bookNotes}
                onChange={(e) => setBookNotes(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary w-full py-3 mt-2 flex items-center justify-center gap-2">
              <CalendarRange size={16} /> Request Appointment
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
}

