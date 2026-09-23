'use client';

import { useState } from 'react';
import { useApp } from '@/contexts/app-context';
import { getFullName, formatCurrency } from '@/lib/utils';
import { Download, Eye, BarChart, Shield, Wallet, DollarSign } from 'lucide-react';

const reportTypes = [
  { id: 'portfolio', label: 'Portfolio Report', icon: <Wallet size={20} />, description: 'Comprehensive investment and insurance overview for a client' },
  { id: 'policy', label: 'Policy Summary', icon: <Shield size={20} />, description: 'All policies with premium, renewal, and claim details' },
  { id: 'financial', label: 'Financial Overview', icon: <BarChart size={20} />, description: 'Client financial health including income, assets, and goals' },
  { id: 'commission', label: 'Commission Report', icon: <DollarSign size={20} />, description: 'Monthly and company-wise commission breakdown' },
];

export default function ReportsPage() {
  const { clients, policies, investments, commissions } = useApp();
  const [selectedReport, setSelectedReport] = useState<string>('');
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [preview, setPreview] = useState<string>('');

  const generatePreview = () => {
    if (selectedReport === 'commission') {
      const totalPaid = commissions.filter((c) => c.status === 'paid').reduce((s, c) => s + c.amount, 0);
      const totalPending = commissions.filter((c) => c.status === 'pending').reduce((s, c) => s + c.amount, 0);
      setPreview(
        `COMMISSION REPORT\n${'═'.repeat(40)}\n\n` +
        `Total Earned: ${formatCurrency(totalPaid)}\n` +
        `Total Pending: ${formatCurrency(totalPending)}\n` +
        `Total Transactions: ${commissions.length}\n\n` +
        `--- Breakdown by Company ---\n` +
        Object.entries(commissions.reduce((acc, c) => { acc[c.company] = (acc[c.company] || 0) + c.amount; return acc; }, {} as Record<string, number>))
          .sort((a, b) => b[1] - a[1])
          .map(([co, amt]) => `  ${co}: ${formatCurrency(amt)}`)
          .join('\n')
      );
      return;
    }

    const client = clients.find((c) => c.id === selectedClient);
    if (!client) { setPreview('Please select a client.'); return; }

    const clientPolicies = policies.filter((p) => p.clientId === client.id);
    const clientInvestments = investments.filter((i) => i.clientId === client.id);

    if (selectedReport === 'portfolio') {
      setPreview(
        `PORTFOLIO REPORT — ${getFullName(client.firstName, client.lastName)}\n${'═'.repeat(40)}\n\n` +
        `--- Insurance (${clientPolicies.length} policies) ---\n` +
        clientPolicies.map((p) => `  ${p.company} | ${p.policyNumber} | ${formatCurrency(p.premium)}/yr | Sum: ${formatCurrency(p.sumAssured)}`).join('\n') +
        `\n\nTotal Annual Premium: ${formatCurrency(clientPolicies.reduce((s, p) => s + p.premium, 0))}\n\n` +
        `--- Investments (${clientInvestments.length}) ---\n` +
        clientInvestments.map((i) => `  ${i.schemeName} | Invested: ${formatCurrency(i.investedAmount)} | Current: ${formatCurrency(i.currentValue)} | ${i.returns}%`).join('\n') +
        `\n\nTotal AUM: ${formatCurrency(clientInvestments.reduce((s, i) => s + i.currentValue, 0))}`
      );
    } else if (selectedReport === 'policy') {
      setPreview(
        `POLICY SUMMARY — ${getFullName(client.firstName, client.lastName)}\n${'═'.repeat(40)}\n\n` +
        clientPolicies.map((p) => `Company: ${p.company}\nPolicy: ${p.policyNumber}\nType: ${p.type}\nPremium: ${formatCurrency(p.premium)}/${p.premiumFrequency}\nSum Assured: ${formatCurrency(p.sumAssured)}\nNominee: ${p.nominee}\nStatus: ${p.status}\n`).join('\n---\n')
      );
    } else if (selectedReport === 'financial') {
      setPreview(
        `FINANCIAL OVERVIEW — ${getFullName(client.firstName, client.lastName)}\n${'═'.repeat(40)}\n\n` +
        `Annual Income: ${formatCurrency(client.annualIncome)}\n` +
        `Risk Profile: ${client.riskProfile}\n` +
        `Financial Goals: ${client.financialGoals || 'Not specified'}\n\n` +
        `Existing Insurance: ${client.existingInsurance || 'N/A'}\n` +
        `Existing Investments: ${client.existingInvestments || 'N/A'}\n` +
        `Loans: ${client.loans || 'None'}\n\n` +
        `Active Policies: ${clientPolicies.length}\n` +
        `Investment Portfolio: ${formatCurrency(clientInvestments.reduce((s, i) => s + i.currentValue, 0))}`
      );
    }
  };

  const exportPDF = () => {
    if (!preview) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const title = reportTypes.find((r) => r.id === selectedReport)?.label || 'Report';
    const client = clients.find((c) => c.id === selectedClient);
    const clientName = client ? `${client.firstName} ${client.lastName}` : 'Business';

    printWindow.document.write(`
      <html>
        <head>
          <title>${title} - ${clientName}</title>
          <style>
            body {
              font-family: monospace;
              padding: 40px;
              color: #111;
              white-space: pre-wrap;
              font-size: 14px;
              line-height: 1.5;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #333;
              padding-bottom: 15px;
              margin-bottom: 30px;
              font-family: sans-serif;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              color: #b45309;
            }
            .header p {
              margin: 5px 0 0 0;
              color: #666;
              font-size: 12px;
            }
            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>AK SAARTHI AI</h1>
            <p>AK Investments & Financial Services</p>
          </div>
          <div>${preview.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-sm text-slate-400 mt-1">Generate professional reports for your business</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {reportTypes.map((r) => (
          <button
            key={r.id}
            onClick={() => { setSelectedReport(r.id); setPreview(''); }}
            className={`card p-5 text-left transition-all ${selectedReport === r.id ? 'border-yellow-500/50 bg-yellow-500/5' : ''}`}
          >
            <div className="p-2.5 rounded-xl bg-yellow-500/10 w-fit mb-3 text-yellow-400">{r.icon}</div>
            <h3 className="font-semibold text-sm mb-1">{r.label}</h3>
            <p className="text-xs text-slate-500">{r.description}</p>
          </button>
        ))}
      </div>

      {selectedReport && (
        <div className="card p-5 animate-fade-in">
          <div className="flex flex-wrap gap-3 items-end mb-4">
            {selectedReport !== 'commission' && (
              <div className="flex-1 min-w-[200px]">
                <label className="label">Select Client</label>
                <select className="input" value={selectedClient} onChange={(e) => { setSelectedClient(e.target.value); setPreview(''); }}>
                  <option value="">Choose a client...</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{getFullName(c.firstName, c.lastName)}</option>)}
                </select>
              </div>
            )}
            <button onClick={generatePreview} className="btn btn-primary">
              <Eye size={16} /> Preview Report
            </button>
            <button onClick={exportPDF} className="btn btn-secondary" disabled={!preview}>
              <Download size={16} /> Export PDF
            </button>
          </div>

          {preview && (
            <div className="bg-slate-800/50 rounded-lg p-5 border border-slate-700">
              <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">{preview}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
