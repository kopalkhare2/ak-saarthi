'use client';

import { useState } from 'react';
import { useApp } from '@/contexts/app-context';
import Badge, { taskPriorityBadge } from '@/components/ui/badge';
import Modal from '@/components/ui/modal';
import { generateId, getFullName, formatDate } from '@/lib/utils';
import type { Task, TaskPriority, TaskStatus } from '@/lib/types';
import { Plus, Circle, Clock, CheckCircle } from 'lucide-react';

function statusIcon(status: string) {
  if (status === 'done') return <CheckCircle size={16} className="text-emerald-400" />;
  if (status === 'in_progress') return <Clock size={16} className="text-amber-400" />;
  return <Circle size={16} className="text-slate-500" />;
}

function Column({
  title,
  items,
  status,
  onCycle,
}: {
  title: string;
  items: Task[];
  status: string;
  onCycle: (task: Task) => void;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          {statusIcon(status)} {title}
        </h3>
        <Badge label={items.length.toString()} variant="neutral" dot={false} />
      </div>
      <div className="space-y-2">
        {items.map((t) => (
          <div
            key={t.id}
            className="p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer group"
            onClick={() => onCycle(t)}
          >
            <div className="flex items-start gap-2">
              <div className="mt-0.5">{statusIcon(t.status)}</div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${t.status === 'done' ? 'line-through text-slate-500' : ''}`}>{t.title}</p>
                {t.clientName && <p className="text-xs text-slate-500 mt-0.5">{t.clientName}</p>}
                <div className="flex items-center gap-2 mt-2">
                  {taskPriorityBadge(t.priority)}
                  {t.dueDate && <span className="text-xs text-slate-500">{formatDate(t.dueDate)}</span>}
                </div>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-xs text-slate-500 text-center py-6">No tasks</p>
        )}
      </div>
    </div>
  );
}

export default function TasksPage() {
  const { clients, tasks, addTask, updateTask } = useApp();
  const [filter, setFilter] = useState<string>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', clientId: '', priority: 'medium' as TaskPriority, dueDate: '' });
  const set = (f: string, v: string) => setForm((p) => ({ ...p, [f]: v }));

  let filtered = tasks;
  if (filter !== 'all') filtered = tasks.filter((t) => t.status === filter);

  const grouped = {
    todo: filtered.filter((t) => t.status === 'todo'),
    in_progress: filtered.filter((t) => t.status === 'in_progress'),
    done: filtered.filter((t) => t.status === 'done'),
  };

  const cycleStatus = (task: Task) => {
    const next: Record<string, TaskStatus> = { todo: 'in_progress', in_progress: 'done', done: 'todo' };
    updateTask({ ...task, status: next[task.status] });
  };

  const handleAdd = () => {
    if (!form.title) return;
    const client = clients.find((c) => c.id === form.clientId);
    addTask({
      id: generateId(),
      title: form.title,
      description: form.description || undefined,
      clientId: form.clientId || undefined,
      clientName: client ? getFullName(client.firstName, client.lastName) : undefined,
      priority: form.priority,
      status: 'todo',
      dueDate: form.dueDate || undefined,
      createdAt: new Date().toISOString(),
    });
    setShowAdd(false);
    setForm({ title: '', description: '', clientId: '', priority: 'medium', dueDate: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-sm text-slate-400 mt-1">{tasks.filter((t) => t.status !== 'done').length} pending tasks</p>
        </div>
        <div className="flex gap-2">
          <select className="input w-auto text-sm" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
          <button onClick={() => setShowAdd(true)} className="btn btn-primary"><Plus size={16} /> Add Task</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-fade-in">
        <Column title="To Do" items={grouped.todo} status="todo" onCycle={cycleStatus} />
        <Column title="In Progress" items={grouped.in_progress} status="in_progress" onCycle={cycleStatus} />
        <Column title="Done" items={grouped.done} status="done" onCycle={cycleStatus} />
      </div>

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Task" size="md">
        <div className="space-y-4">
          <div>
            <label className="label">Title *</label>
            <input className="input" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Renew client policy" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input min-h-[60px]" value={form.description} onChange={(e) => set('description', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Priority</label>
              <select className="input" value={form.priority} onChange={(e) => set('priority', e.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="label">Due Date</label>
              <input className="input" type="date" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Client (Optional)</label>
            <select className="input" value={form.clientId} onChange={(e) => set('clientId', e.target.value)}>
              <option value="">Select...</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{getFullName(c.firstName, c.lastName)}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setShowAdd(false)} className="btn btn-secondary">Cancel</button>
          <button onClick={handleAdd} className="btn btn-primary">Add Task</button>
        </div>
      </Modal>
    </div>
  );
}
