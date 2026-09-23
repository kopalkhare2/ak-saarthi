import { type ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  trend?: { value: number; label: string };
  accent?: string; // tailwind color class for the icon bg
  className?: string;
}

export default function StatCard({
  title,
  value,
  icon,
  trend,
  accent = 'bg-yellow-500/10 text-yellow-400',
  className = '',
}: StatCardProps) {
  const isPositive = trend && trend.value >= 0;

  return (
    <div className={`card p-5 animate-fade-in ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl ${accent}`}>
          {icon}
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
              isPositive
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-red-500/10 text-red-400'
            }`}
          >
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      <p className="text-sm text-slate-400 mb-1">{title}</p>
      <p className="text-2xl font-bold animate-count-up">{value}</p>
      {trend && (
        <p className="text-xs text-slate-500 mt-1">{trend.label}</p>
      )}
    </div>
  );
}
