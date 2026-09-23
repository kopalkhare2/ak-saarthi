import { Sparkles } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center bg-[var(--navy-950)] text-white">
      <div className="text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl gradient-gold flex items-center justify-center mx-auto animate-float">
          <Sparkles size={26} className="text-slate-900" />
        </div>
        <p className="text-sm text-slate-400">Loading your workspace...</p>
      </div>
    </div>
  );
}
