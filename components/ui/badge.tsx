interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'gold';
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<string, { bg: string; text: string; dot: string }> = {
  success: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  warning: { bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-400' },
  error: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400' },
  info: { bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-400' },
  neutral: { bg: 'bg-slate-500/10', text: 'text-slate-400', dot: 'bg-slate-400' },
  gold: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', dot: 'bg-yellow-400' },
};

export default function Badge({
  label,
  variant = 'neutral',
  dot = true,
  className = '',
}: BadgeProps) {
  const style = variantStyles[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />}
      {label}
    </span>
  );
}

// Convenience mappers
export function policyStatusBadge(status: string) {
  const map: Record<string, BadgeProps['variant']> = {
    active: 'success', lapsed: 'error', pending: 'warning', claim: 'info', expired: 'neutral',
  };
  return <Badge label={status.charAt(0).toUpperCase() + status.slice(1)} variant={map[status] || 'neutral'} />;
}

export function taskPriorityBadge(priority: string) {
  const map: Record<string, BadgeProps['variant']> = {
    high: 'error', medium: 'warning', low: 'info',
  };
  return <Badge label={priority.charAt(0).toUpperCase() + priority.slice(1)} variant={map[priority] || 'neutral'} />;
}

export function riskProfileBadge(risk: string) {
  const map: Record<string, BadgeProps['variant']> = {
    conservative: 'info', moderate: 'warning', aggressive: 'error',
  };
  return <Badge label={risk.charAt(0).toUpperCase() + risk.slice(1)} variant={map[risk] || 'neutral'} />;
}
