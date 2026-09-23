'use client';

import { useState } from 'react';
import { useApp } from '@/contexts/app-context';
import Modal from '@/components/ui/modal';
import { generateId, getFullName, formatDate } from '@/lib/utils';
import type { AppointmentType } from '@/lib/types';
import { Plus, ChevronLeft, ChevronRight, Clock } from 'lucide-react';

const appointmentColors: Record<string, string> = {
  meeting: 'bg-blue-500', follow_up: 'bg-amber-500', call: 'bg-emerald-500', review: 'bg-purple-500',
};

export default function CalendarPage() {
  const { clients, appointments, addAppointment } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ clientId: '', title: '', type: 'meeting' as AppointmentType, date: '', time: '10:00', duration: 30, location: '', notes: '' });
  const set = (f: string, v: string | number) => setForm((p) => ({ ...p, [f]: v }));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = currentDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  const prev = () => setCurrentDate(new Date(year, month - 1, 1));
  const next = () => setCurrentDate(new Date(year, month + 1, 1));

  const dayAppts = appointments.filter((a) => a.date === selectedDate && a.status === 'scheduled').sort((a, b) => a.time.localeCompare(b.time));

  const handleAdd = () => {
    if (!form.title || !form.date) return;
    const client = clients.find((c) => c.id === form.clientId);
    addAppointment({
      id: generateId(),
      clientId: form.clientId || undefined,
      clientName: client ? getFullName(client.firstName, client.lastName) : undefined,
      title: form.title,
      type: form.type,
      date: form.date,
      time: form.time,
      duration: Number(form.duration),
      location: form.location || undefined,
      notes: form.notes || undefined,
      status: 'scheduled',
      createdAt: new Date().toISOString(),
    });
    setShowAdd(false);
    setForm({ clientId: '', title: '', type: 'meeting', date: '', time: '10:00', duration: 30, location: '', notes: '' });
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Calendar</h1>
          <p className="text-sm text-slate-400 mt-1">Manage your appointments and schedule</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn btn-primary"><Plus size={16} /> Add Appointment</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 card p-5 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <button onClick={prev} className="p-2 rounded-lg hover:bg-slate-800"><ChevronLeft size={20} className="text-slate-400" /></button>
            <h3 className="font-semibold text-lg">{monthLabel}</h3>
            <button onClick={next} className="p-2 rounded-lg hover:bg-slate-800"><ChevronRight size={20} className="text-slate-400" /></button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="text-xs font-semibold text-slate-500 py-2">{d}</div>
            ))}
            {Array.from({ length: firstDay }, (_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const hasAppts = appointments.some((a) => a.date === dateStr);
              const isSelected = dateStr === selectedDate;
              const isToday = dateStr === today;

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`relative p-2 rounded-lg text-sm transition-all ${
                    isSelected ? 'bg-yellow-500/20 text-yellow-400 font-bold' :
                    isToday ? 'bg-blue-500/10 text-blue-400 font-semibold' :
                    'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  {day}
                  {hasAppts && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-yellow-400 rounded-full" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Day View */}
        <div className="card p-5 animate-fade-in">
          <h3 className="font-semibold mb-1">{formatDate(selectedDate)}</h3>
          <p className="text-xs text-slate-500 mb-4">{dayAppts.length} appointment{dayAppts.length !== 1 ? 's' : ''}</p>
          <div className="space-y-3">
            {dayAppts.length === 0 ? (
              <p className="text-sm text-slate-500 py-8 text-center">No appointments</p>
            ) : dayAppts.map((a) => (
              <div key={a.id} className="p-3 rounded-lg bg-slate-800/50 border-l-3 border-l-yellow-500">
                <div className="flex items-center gap-2 mb-1">
                  <Clock size={12} className="text-slate-500" />
                  <span className="text-xs text-slate-400">{a.time} · {a.duration}min</span>
                  <span className={`w-2 h-2 rounded-full ${appointmentColors[a.type] || 'bg-slate-500'}`} />
                </div>
                <p className="text-sm font-medium">{a.title}</p>
                {a.clientName && <p className="text-xs text-slate-500 mt-0.5">{a.clientName}</p>}
                {a.location && <p className="text-xs text-slate-500">{a.location}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Appointment" size="md">
        <div className="space-y-4">
          <div>
            <label className="label">Title *</label>
            <input className="input" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Policy Review Meeting" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Date *</label>
              <input className="input" type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
            </div>
            <div>
              <label className="label">Time</label>
              <input className="input" type="time" value={form.time} onChange={(e) => set('time', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.type} onChange={(e) => set('type', e.target.value)}>
                <option value="meeting">Meeting</option>
                <option value="follow_up">Follow Up</option>
                <option value="call">Call</option>
                <option value="review">Review</option>
              </select>
            </div>
            <div>
              <label className="label">Duration (min)</label>
              <input className="input" type="number" value={form.duration} onChange={(e) => set('duration', Number(e.target.value))} />
            </div>
          </div>
          <div>
            <label className="label">Client (Optional)</label>
            <select className="input" value={form.clientId} onChange={(e) => set('clientId', e.target.value)}>
              <option value="">Select...</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{getFullName(c.firstName, c.lastName)}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Location</label>
            <input className="input" value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="Office / Zoom" />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input min-h-[60px]" value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setShowAdd(false)} className="btn btn-secondary">Cancel</button>
          <button onClick={handleAdd} className="btn btn-primary">Add Appointment</button>
        </div>
      </Modal>
    </div>
  );
}
