import Link from 'next/link';
import {
  Sparkles, Shield, TrendingUp, Users, Bot, BarChart3,
  Calendar, FileText, ChevronRight, Zap,
} from 'lucide-react';

const features = [
  { icon: <Users size={24} />, title: 'Client CRM', description: 'Complete client lifecycle management with detailed profiles, family info, and financial data.' },
  { icon: <Shield size={24} />, title: 'Insurance Management', description: 'Track policies across Life, Health, Motor, Term, ULIP, Travel & Home insurance.' },
  { icon: <TrendingUp size={24} />, title: 'Investment Portfolio', description: 'Manage Mutual Funds, SIPs, Stocks, FDs, PPF, NPS, Gold, and more.' },
  { icon: <Bot size={24} />, title: 'AI Assistant', description: 'Intelligent copilot that summarizes portfolios, identifies gaps, and drafts communications.' },
  { icon: <BarChart3 size={24} />, title: 'Business Analytics', description: 'Revenue trends, client growth, policy distribution, and company performance charts.' },
  { icon: <Calendar size={24} />, title: 'Calendar & Tasks', description: 'Appointment scheduling, task management, and daily planning tools.' },
  { icon: <FileText size={24} />, title: 'Reports & Documents', description: 'Generate portfolio reports, store client documents securely in the vault.' },
  { icon: <Zap size={24} />, title: 'Commission Tracker', description: 'Track earnings by company, type, and month with pending payment alerts.' },
];

const stats = [
  { label: 'Active Advisors', value: '500+' },
  { label: 'Policies Managed', value: '10K+' },
  { label: 'AUM Tracked', value: '₹100 Cr+' },
  { label: 'Client Satisfaction', value: '99%' },
];

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative gradient-hero overflow-hidden">
        {/* Ambient light effects */}
        <div className="absolute top-[-200px] left-[-100px] w-[500px] h-[500px] bg-yellow-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[-200px] right-[-100px] w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-6 py-24 md:py-36">
          <div className="text-center animate-fade-in">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm font-medium mb-8">
              <Sparkles size={14} />
              AI-Powered Financial Advisor OS
            </div>

            {/* Title */}
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
              <span className="text-white">AK Saarthi</span>{' '}
              <span className="bg-gradient-to-r from-yellow-400 to-yellow-500 bg-clip-text text-transparent">AI</span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto mb-4 leading-relaxed">
              The complete operating system for financial advisors.
              <br />
              <span className="text-slate-300">Manage clients, policies, investments — all in one place.</span>
            </p>

            <p className="text-sm text-slate-500 mb-10">
              AK Investments & Financial Services
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/advisor/dashboard"
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-500 px-8 py-3.5 text-slate-900 font-bold text-lg transition-all hover:shadow-[0_4px_24px_rgba(250,204,21,0.3)] hover:-translate-y-0.5"
              >
                Advisor Dashboard
                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/client/dashboard"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/50 backdrop-blur px-8 py-3.5 font-semibold text-lg hover:border-slate-600 hover:bg-slate-800/50 transition-all"
              >
                Client Portal
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-slate-800 bg-slate-900/50 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="text-2xl md:text-3xl font-bold text-yellow-400">{s.value}</p>
                <p className="text-sm text-slate-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything you need to run your advisory business
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            PolicyBazaar + Groww + HubSpot CRM + Notion + Google Calendar — unified into one premium platform.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="card p-6 hover:border-yellow-500/30 group animate-fade-in"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-400 mb-4 group-hover:scale-110 transition-transform">
                {f.icon}
              </div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <div className="p-10 rounded-2xl bg-gradient-to-r from-yellow-500/10 to-blue-500/10 border border-yellow-500/20">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to transform your advisory business?</h2>
            <p className="text-slate-400 mb-8">Start managing your clients, policies, and investments with AI-powered intelligence.</p>
            <Link
              href="/advisor/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-500 px-8 py-3.5 text-slate-900 font-bold text-lg transition-all hover:shadow-[0_4px_24px_rgba(250,204,21,0.3)] hover:-translate-y-0.5"
            >
              Get Started
              <ChevronRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-yellow-500 flex items-center justify-center">
              <Sparkles size={12} className="text-slate-900" />
            </div>
            <span>AK Saarthi AI</span>
          </div>
          <p>© {new Date().getFullYear()} AK Investments & Financial Services</p>
        </div>
      </footer>
    </main>
  );
}