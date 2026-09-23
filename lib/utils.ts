// ─── Currency ───────────────────────────────────────────

export function formatCurrency(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`;
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCurrencyFull(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

// ─── Dates ──────────────────────────────────────────────

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
  });
}

export function daysFromNow(dateStr: string): number {
  const now = new Date();
  const d = new Date(dateStr);
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function isOverdue(dateStr: string): boolean {
  return daysFromNow(dateStr) < 0;
}

// ─── Percentage ─────────────────────────────────────────

export function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

// ─── Name Helpers ───────────────────────────────────────

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
}

export function getFullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`;
}

// ─── ID Generator ───────────────────────────────────────

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// ─── Status Colors ──────────────────────────────────────

export const policyStatusColors: Record<string, { bg: string; text: string; dot: string }> = {
  active: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  lapsed: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400' },
  pending: { bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-400' },
  claim: { bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-400' },
  expired: { bg: 'bg-slate-500/10', text: 'text-slate-400', dot: 'bg-slate-400' },
};

export const investmentStatusColors: Record<string, { bg: string; text: string; dot: string }> = {
  active: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  matured: { bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-400' },
  withdrawn: { bg: 'bg-slate-500/10', text: 'text-slate-400', dot: 'bg-slate-400' },
  paused: { bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-400' },
};

export const taskPriorityColors: Record<string, { bg: string; text: string; dot: string }> = {
  high: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400' },
  medium: { bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-400' },
  low: { bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-400' },
};

export const riskProfileColors: Record<string, { bg: string; text: string }> = {
  conservative: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
  moderate: { bg: 'bg-amber-500/10', text: 'text-amber-400' },
  aggressive: { bg: 'bg-red-500/10', text: 'text-red-400' },
};

// ─── Policy Type Labels ────────────────────────────────

export const policyTypeLabels: Record<string, string> = {
  life: 'Life Insurance',
  health: 'Health Insurance',
  motor: 'Motor Insurance',
  term: 'Term Plan',
  ulip: 'ULIP',
  travel: 'Travel Insurance',
  home: 'Home Insurance',
};

export const investmentTypeLabels: Record<string, string> = {
  mutual_fund: 'Mutual Fund',
  sip: 'SIP',
  stock: 'Stock',
  etf: 'ETF',
  bond: 'Bond',
  gold: 'Gold',
  nps: 'NPS',
  fd: 'Fixed Deposit',
  ppf: 'PPF',
};

// ─── Search / Filter ───────────────────────────────────

export function searchFilter<T>(
  items: T[],
  query: string,
  fields: (keyof T)[]
): T[] {
  if (!query.trim()) return items;
  const q = query.toLowerCase();
  return items.filter((item) =>
    fields.some((field) => {
      const val = item[field];
      if (typeof val === 'string') return val.toLowerCase().includes(q);
      if (typeof val === 'number') return val.toString().includes(q);
      return false;
    })
  );
}

// ─── Appointment Type Colors ───────────────────────────

export const appointmentTypeColors: Record<string, string> = {
  meeting: 'bg-blue-500',
  follow_up: 'bg-amber-500',
  call: 'bg-emerald-500',
  review: 'bg-purple-500',
};

// ─── WhatsApp Phone Formatting ─────────────────────────

export function formatPhoneForWhatsapp(phone: string): string {
  const cleaned = phone.replace(/[+\-\s()]/g, '');
  // If the cleaned number is exactly 10 digits, prefix it with '91' (India)
  if (cleaned.length === 10) {
    return `91${cleaned}`;
  }
  return cleaned;
}

