'use client';

import { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/contexts/app-context';
import { formatCurrency, getFullName } from '@/lib/utils';
import { Calculator, Sparkles, Send, Copy, Printer, Check, ShieldAlert, Heart, FileText } from 'lucide-react';

interface ProjectionRow {
  year: number;
  age: number;
  premium: number;
  cumulativePremium: number;
  bonusAccrued: number;
  survivalBenefit: number;
  lifeCover: number;
  maturityValue: number;
}

const licBonusRates: Record<string, number> = {
  '914': 42, // Rs 42 per 1000 sum assured per year (New Endowment)
  '915': 45, // Rs 45 per 1000 sum assured per year (Jeevan Anand)
  '936': 46, // Jeevan Labh has higher bonus rates
  '933': 44, // Jeevan Lakshya Child Plan
  '945': 40, // Jeevan Umang Whole Life
  '871': 40, // Guaranteed addition of Rs 40/1000 for Jeevan Utsav
  '854': 0,  // Tech Term (Pure Term - no bonus)
  '870': 0,  // Jeevan Kiran (ROP Term - no bonus)
};

const licPlanNames: Record<string, string> = {
  '936': 'LIC Jeevan Labh (Plan 936)',
  '945': 'LIC Jeevan Umang (Plan 945)',
  '914': 'LIC New Endowment (Plan 914)',
  '915': 'LIC New Jeevan Anand (Plan 915)',
  '933': 'LIC Jeevan Lakshya (Plan 933)',
  '871': 'LIC Jeevan Utsav (Plan 871)',
  '854': 'LIC Tech Term (Plan 854)',
  '870': 'LIC Jeevan Kiran (Plan 870)',
};

const healthPlanHighlights: Record<string, { title: string; roomRent: string; restore: string; copay: string; waitingPeriod: string; customFeature: string }> = {
  care: {
    title: 'Care Classic Health',
    roomRent: 'Single Private AC Room Cover Included',
    restore: '100% Automatic Recharge of Sum Insured',
    copay: 'No co-payment for age < 61 years',
    waitingPeriod: '3 Years for Pre-existing Diseases (PED)',
    customFeature: 'No Claim Bonus up to 150% boost.'
  },
  care_supreme: {
    title: 'Care Supreme Health',
    roomRent: 'No Room Rent Capping (Any Room Choice)',
    restore: 'Unlimited Restore Benefit for same or different illness',
    copay: 'Zero co-payment',
    waitingPeriod: '3 Years for PED',
    customFeature: 'Cumulative Bonus Super: Up to 500% increase.'
  },
  care_advantage: {
    title: 'Care Advantage (High Sum Insured)',
    roomRent: 'Single Private AC Room Cover Included',
    restore: '100% Recharge of Sum Insured',
    copay: 'Zero co-pay options available',
    waitingPeriod: '3 Years for PED',
    customFeature: 'Mega Coverage (50L, 1 Crore, 2 Crore Sum Insured)'
  },
  hdfc: {
    title: 'HDFC Ergo Optima Secure',
    roomRent: 'No Room Rent Capping (Any Room Choice)',
    restore: '100% Secure Restore Benefit buffer',
    copay: 'Zero co-payment',
    waitingPeriod: '3 Years for PED',
    customFeature: 'Doubles Sum Insured from Day 1 at zero extra cost.'
  },
  hdfc_restore: {
    title: 'HDFC Ergo Optima Restore',
    roomRent: 'Single Private Room cover included',
    restore: '100% Restore Benefit for next illness',
    copay: 'Zero co-pay',
    waitingPeriod: '3 Years for PED',
    customFeature: 'Multiplier Benefit: 50% No Claim Bonus every claim-free year.'
  },
  star_assure: {
    title: 'Star Health Assure Insurance',
    roomRent: 'Single Private AC Room cover included',
    restore: 'Unlimited automatic restoration of sum insured',
    copay: 'Zero co-payment',
    waitingPeriod: '3 Years for PED',
    customFeature: 'Assure Benefit: Buy back of waiting period option.'
  },
  star_comp: {
    title: 'Star Comprehensive Health',
    roomRent: 'Private Single AC Room Cover',
    restore: '100% Auto Restore of Sum Insured',
    copay: 'Zero co-payment',
    waitingPeriod: '3 Years for PED',
    customFeature: 'Includes OPD dental & ophthalmic consultations.'
  },
  bupa_reassure: {
    title: 'Niva Bupa ReAssure 2.0',
    roomRent: 'No Room Rent Capping (Any Category)',
    restore: 'ReAssure Forever: Unlimited restore even for same illness',
    copay: 'Zero co-payment',
    waitingPeriod: '3 Years for PED',
    customFeature: 'Lock the Clock: Premium remains same as entry age until first claim.'
  }
};

export default function PresentationPage() {
  const { clients } = useApp();
  
  // Input parameters
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientName, setClientName] = useState('Valued Client');
  const [clientAge, setClientAge] = useState(30);
  const [productType, setProductType] = useState<'lic' | 'health'>('lic');
  const [selectedProduct, setSelectedProduct] = useState('936'); // Default Jeevan Labh
  
  const [sumAssured, setSumAssured] = useState(500000); // 5 Lakhs default
  const [policyTerm, setPolicyTerm] = useState(21); // Default for Jeevan Labh 21/15
  const [ppt, setPpt] = useState(15); // Premium Paying Term
  
  const [copied, setCopied] = useState(false);

  // Sync client selections. clientName/clientAge stay independent state (rather
  // than being derived directly) because the fields below also accept manual
  // overrides that aren't tied to any client record.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (selectedClientId) {
      const c = clients.find((client) => client.id === selectedClientId);
      if (c) {
        setClientName(getFullName(c.firstName, c.lastName));
        const age = new Date().getFullYear() - new Date(c.dob).getFullYear();
        setClientAge(isNaN(age) ? 30 : age);
      }
    }
  }, [selectedClientId, clients]);

  // Adjust default PPT based on selected LIC product. policyTerm/ppt are also
  // directly editable below, so this normalizes them into a valid combination
  // whenever the product changes rather than being purely derived.
  useEffect(() => {
    if (selectedProduct === '936') {
      if (policyTerm === 16) setPpt(10);
      else if (policyTerm === 21) setPpt(15);
      else if (policyTerm === 25) setPpt(16);
      else { setPolicyTerm(21); setPpt(15); }
    } else if (selectedProduct === '945' || selectedProduct === '871') {
      setPolicyTerm(100 - clientAge);
      if (![5, 6, 7, 8, 9, 10, 12, 15, 20, 25, 30].includes(ppt)) setPpt(15);
    } else if (selectedProduct === '933') {
      if (policyTerm < 13) setPolicyTerm(15);
      setPpt(policyTerm - 3);
    } else {
      setPpt(policyTerm);
    }
  }, [selectedProduct, policyTerm, clientAge, ppt]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Projections Engine — a pure function of the inputs below, so it's a
  // memoized derived value rather than separate state kept in sync via an effect.
  const projections = useMemo<ProjectionRow[]>(() => {
    const rows: ProjectionRow[] = [];
    let cumulativePremium = 0;
    
    if (productType === 'lic') {
      const baseBonusRate = licBonusRates[selectedProduct] || 40;
      let annualBonus = (sumAssured / 1000) * baseBonusRate;
      
      let baseRatePerThousand = 0;
      if (selectedProduct === '936') { 
        baseRatePerThousand = policyTerm === 16 ? 85 : policyTerm === 21 ? 54 : 43;
      } else if (selectedProduct === '945') { 
        baseRatePerThousand = ppt === 15 ? 72 : ppt === 20 ? 52 : 40;
      } else if (selectedProduct === '871') { 
        baseRatePerThousand = ppt === 5 ? 190 : ppt === 10 ? 98 : 65;
      } else if (selectedProduct === '915') { 
        baseRatePerThousand = policyTerm === 15 ? 78 : policyTerm === 20 ? 56 : 45;
      } else if (selectedProduct === '933') { 
        baseRatePerThousand = policyTerm === 15 ? 70 : policyTerm === 20 ? 51 : 41;
      } else if (selectedProduct === '854') { 
        baseRatePerThousand = 1.8; 
        annualBonus = 0;
      } else if (selectedProduct === '870') { 
        baseRatePerThousand = 8.5;
        annualBonus = 0;
      } else { 
        baseRatePerThousand = policyTerm === 15 ? 65 : policyTerm === 20 ? 48 : 37;
      }
      
      const ageFactor = (clientAge - 20) * 0.5;
      const annualPremium = (sumAssured / 1000) * (baseRatePerThousand + (selectedProduct === '854' ? ageFactor * 0.1 : ageFactor));
      
      for (let yr = 1; yr <= policyTerm; yr++) {
        const isPaying = yr <= ppt;
        const currentPremium = isPaying ? annualPremium : 0;
        cumulativePremium += currentPremium;
        
        const bonusAccrued = annualBonus * yr;
        let survivalBenefit = 0;
        let maturityValue = 0;
        
        if (selectedProduct === '945') { 
          if (yr > ppt) {
            survivalBenefit = sumAssured * 0.08;
          }
        } else if (selectedProduct === '871') { 
          if (yr > ppt) {
            survivalBenefit = sumAssured * 0.10;
          }
        }
        
        if (yr === policyTerm) {
          if (selectedProduct === '870') {
            maturityValue = cumulativePremium;
          } else if (selectedProduct === '854' || selectedProduct === '871') {
            maturityValue = 0;
          } else {
            const fab = (sumAssured / 1000) * 20; 
            maturityValue = sumAssured + bonusAccrued + fab;
          }
        }

        const lifeCover = selectedProduct === '854' || selectedProduct === '870' 
          ? sumAssured 
          : sumAssured + bonusAccrued;
        
        rows.push({
          year: yr,
          age: clientAge + yr,
          premium: currentPremium,
          cumulativePremium,
          bonusAccrued,
          survivalBenefit,
          lifeCover,
          maturityValue,
        });
      }
    } else {
      for (let yr = 1; yr <= 10; yr++) {
        const currentAge = clientAge + yr - 1;
        let annualPremium = 0;
        
        if (selectedProduct.startsWith('care')) {
          if (currentAge <= 35) annualPremium = 8200;
          else if (currentAge <= 45) annualPremium = 10800;
          else if (currentAge <= 55) annualPremium = 16200;
          else annualPremium = 27000;
          
          if (selectedProduct === 'care_advantage') {
            annualPremium *= 1.4;
          } else if (selectedProduct === 'care_supreme') {
            annualPremium *= 1.1;
          }
        } else if (selectedProduct.startsWith('hdfc')) {
          if (currentAge <= 35) annualPremium = 9500;
          else if (currentAge <= 45) annualPremium = 12400;
          else if (currentAge <= 55) annualPremium = 18800;
          else annualPremium = 31000;
          
          if (selectedProduct === 'hdfc_restore') {
            annualPremium *= 0.95;
          }
        } else if (selectedProduct.startsWith('star')) {
          if (currentAge <= 35) annualPremium = 7800;
          else if (currentAge <= 45) annualPremium = 10500;
          else if (currentAge <= 55) annualPremium = 15900;
          else annualPremium = 26000;
          
          if (selectedProduct === 'star_comp') {
            annualPremium *= 1.25;
          }
        } else { 
          if (currentAge <= 35) annualPremium = 9200;
          else if (currentAge <= 45) annualPremium = 12100;
          else if (currentAge <= 55) annualPremium = 18300;
          else annualPremium = 29500;
        }
        
        if (sumAssured >= 1000000) {
          annualPremium *= (sumAssured / 500000) * 0.7; 
        }
        
        cumulativePremium += annualPremium;
        
        rows.push({
          year: yr,
          age: currentAge + 1,
          premium: annualPremium,
          cumulativePremium,
          bonusAccrued: 0,
          survivalBenefit: 0,
          lifeCover: sumAssured, 
          maturityValue: 0,
        });
      }
    }
    
    return rows;
  }, [selectedProduct, productType, sumAssured, policyTerm, ppt, clientAge]);

  const getWhatsAppText = () => {
    let text = `*AK Investments & Financial Services*\n*Plan Presentation for ${clientName} (Age: ${clientAge})*\n\n`;
    
    if (productType === 'lic') {
      const lastRow = projections[projections.length - 1];
      const totalPaid = lastRow ? lastRow.cumulativePremium : 0;
      const maturity = lastRow ? lastRow.maturityValue : 0;
      
      const productName = licPlanNames[selectedProduct] || 'LIC Plan';
      
      text += `*Product:* ${productName}\n`;
      text += `*Sum Assured:* ${formatCurrency(sumAssured)}\n`;
      text += `*Policy Term:* ${policyTerm} Years\n`;
      text += `*Premium Payment Term:* ${ppt} Years\n\n`;
      text += `*--- Benefits & Highlights ---*\n`;
      text += `• Total Premium Payable: ~*${formatCurrency(totalPaid)}*\n`;
      
      if (selectedProduct === '945') { 
        text += `• Guaranteed Survival Benefit: *${formatCurrency(sumAssured * 0.08)}/year* tax-free after PPT (${ppt} yrs) till age 100!\n`;
        text += `• Life Cover at Age 80: *${formatCurrency(sumAssured + (sumAssured / 1000) * 40 * (80 - clientAge))}*\n`;
      } else if (selectedProduct === '871') { 
        text += `• Guaranteed Lifetime Survival Benefit: *${formatCurrency(sumAssured * 0.10)}/year* starting from year ${ppt + 1}!\n`;
      } else if (selectedProduct === '854') { 
        text += `• Pure Term Insurance - Zero maturity.\n`;
        text += `• Death Claim Value: *${formatCurrency(sumAssured)}*\n`;
      } else if (selectedProduct === '870') { 
        text += `• Return of Premium Term Plan.\n`;
        text += `• Guaranteed Maturity return of all premiums paid: *${formatCurrency(totalPaid)}*\n`;
      } else if (selectedProduct === '915') { 
        text += `• Estimated Maturity Value: *${formatCurrency(maturity)}*\n`;
        text += `• *Lifetime Cover:* Whole life coverage of *${formatCurrency(sumAssured)}* continues even after maturity returns!\n`;
      } else {
        text += `• Estimated Maturity Value: *${formatCurrency(maturity)}* (Tax-Free u/s 10(10D))\n`;
        text += `• Normal Life Cover starts at: *${formatCurrency(sumAssured)}* (increasing every year with bonus)\n`;
      }
    } else {
      const highlight = healthPlanHighlights[selectedProduct];
      text += `*Product:* ${highlight?.title || 'Health Insurance'}\n`;
      text += `*Sum Insured:* ${formatCurrency(sumAssured)}\n\n`;
      text += `*--- Key Benefits ---*\n`;
      text += `• Room Rent Limit: ${highlight?.roomRent}\n`;
      text += `• Restoration Benefit: ${highlight?.restore}\n`;
      text += `• Co-pay Clause: ${highlight?.copay}\n`;
      text += `• Highlight: ${highlight?.customFeature}\n\n`;
      text += `• Premium (Estimated Annual): *${formatCurrency(projections[0]?.premium || 0)}*\n`;
    }
    
    text += `\n_For customizable modifications, contact us directly._`;
    return encodeURIComponent(text);
  };

  const handleCopy = () => {
    let rawText = `Plan Presentation for ${clientName} (Age: ${clientAge})\n\n`;
    if (productType === 'lic') {
      const lastRow = projections[projections.length - 1];
      rawText += `Product: ${licPlanNames[selectedProduct]}\n`;
      rawText += `Sum Assured: ${formatCurrency(sumAssured)}\n`;
      rawText += `Premium Payment Term: ${ppt} Years\n`;
      if (selectedProduct === '854') {
        rawText += `Life Cover: ${formatCurrency(sumAssured)}\n`;
      } else if (selectedProduct === '870') {
        rawText += `Maturity Return (ROP): ${formatCurrency(lastRow?.cumulativePremium || 0)}\n`;
      } else if (selectedProduct === '871') {
        rawText += `Survival Payout (Lifetime): ${formatCurrency(sumAssured * 0.10)}/yr\n`;
      } else {
        rawText += `Maturity Value: ${formatCurrency(lastRow?.maturityValue || 0)}\n`;
      }
    } else {
      const highlight = healthPlanHighlights[selectedProduct];
      rawText += `Product: ${highlight?.title}\n`;
      rawText += `Sum Insured: ${formatCurrency(sumAssured)}\n`;
      rawText += `Starting Premium: ${formatCurrency(projections[0]?.premium || 0)}/yr\n`;
    }
    
    navigator.clipboard.writeText(rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeHighlight = healthPlanHighlights[selectedProduct] || healthPlanHighlights.care;
  const productName = productType === 'lic' ? (licPlanNames[selectedProduct] || 'LIC Plan') : (activeHighlight?.title || 'Health Insurance');

  return (
    <div className="space-y-6">
      {/* Print styles injection */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body, html {
            background: #ffffff !important;
            color: #000000 !important;
          }
          aside, header, .no-print, button, .btn, select, input, .label {
            display: none !important;
          }
          .ml-\\[240px\\] {
            margin-left: 0 !important;
            padding: 0 !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
          }
          .card {
            border: none !important;
            background: transparent !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print-full-width {
            width: 100% !important;
            max-width: 100% !important;
            flex: 1 1 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          table {
            color: #000000 !important;
            width: 100% !important;
            border-collapse: collapse !important;
            margin-top: 15px !important;
          }
          th, td {
            border: 1px solid #cbd5e1 !important;
            padding: 10px 8px !important;
            color: #000000 !important;
            text-align: left !important;
          }
          th {
            font-weight: bold !important;
            background-color: #f1f5f9 !important;
          }
          .text-yellow-400, .text-rose-400, .text-emerald-400, .text-slate-400, .text-slate-300 {
            color: #000000 !important;
          }
          .print-header {
            display: block !important;
          }
        }
      ` }} />

      {/* Header */}
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-yellow-500/10 text-yellow-400">
            <Calculator size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Plan Presenter</h1>
            <p className="text-sm text-slate-400 mt-1">Generate and share insurance quotes for clients</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Parameter Panel */}
        <div className="card p-6 space-y-4 h-fit no-print">
          <h3 className="font-semibold text-slate-300 border-b border-slate-800 pb-2 flex items-center gap-2">
            <Sparkles size={16} className="text-yellow-400" />
            Parameters
          </h3>

          <div>
            <label className="label">Populate From Client</label>
            <select
              className="input text-sm"
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
            >
              <option value="">Choose Client...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {getFullName(c.firstName, c.lastName)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Client Name</label>
            <input
              type="text"
              className="input"
              value={clientName}
              onChange={(e) => { setClientName(e.target.value); setSelectedClientId(''); }}
            />
          </div>

          <div>
            <label className="label">Client Age</label>
            <input
              type="number"
              className="input"
              value={clientAge}
              onChange={(e) => { setClientAge(Number(e.target.value)); setSelectedClientId(''); }}
            />
          </div>

          {/* Product Category Toggle */}
          <div>
            <label className="label">Category</label>
            <div className="flex gap-2">
              <button
                onClick={() => { setProductType('lic'); setSelectedProduct('936'); }}
                className={`flex-1 btn py-2 text-xs font-semibold rounded-lg transition-colors ${
                  productType === 'lic' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 'bg-slate-900 border border-slate-800 text-slate-400'
                }`}
              >
                LIC Life Plans
              </button>
              <button
                onClick={() => { setProductType('health'); setSelectedProduct('care'); }}
                className={`flex-1 btn py-2 text-xs font-semibold rounded-lg transition-colors ${
                  productType === 'health' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 'bg-slate-900 border border-slate-800 text-slate-400'
                }`}
              >
                Health Insurance
              </button>
            </div>
          </div>

          {/* Product Selection */}
          <div>
            <label className="label">Select Plan Product</label>
            {productType === 'lic' ? (
              <select
                className="input text-xs"
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
              >
                <option value="936">LIC Jeevan Labh (Plan 936)</option>
                <option value="945">LIC Jeevan Umang (Plan 945)</option>
                <option value="914">LIC New Endowment (Plan 914)</option>
                <option value="915">LIC New Jeevan Anand (Plan 915)</option>
                <option value="933">LIC Jeevan Lakshya (Plan 933)</option>
                <option value="871">LIC Jeevan Utsav (Plan 871)</option>
                <option value="854">LIC Tech Term (Plan 854)</option>
                <option value="870">LIC Jeevan Kiran (Plan 870)</option>
              </select>
            ) : (
              <select
                className="input text-xs"
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
              >
                <option value="care">Care Classic Health Insurance</option>
                <option value="care_supreme">Care Supreme Health Insurance</option>
                <option value="care_advantage">Care Advantage (High Sum Insured)</option>
                <option value="hdfc">HDFC Ergo Optima Secure</option>
                <option value="hdfc_restore">HDFC Ergo Optima Restore</option>
                <option value="star_assure">Star Health Assure Insurance</option>
                <option value="star_comp">Star Health Comprehensive</option>
                <option value="bupa_reassure">Niva Bupa ReAssure 2.0</option>
              </select>
            )}
          </div>

          {/* Sum Assured */}
          <div>
            <label className="label">
              {productType === 'lic' ? 'Sum Assured (₹)' : 'Sum Insured / Coverage (₹)'}
            </label>
            <select
              className="input"
              value={sumAssured}
              onChange={(e) => setSumAssured(Number(e.target.value))}
            >
              <option value={300000}>3,00,000</option>
              <option value={500000}>5,00,000</option>
              <option value={700000}>7,00,000</option>
              <option value={1000000}>10,00,000</option>
              <option value={1500000}>15,00,000</option>
              <option value={2000000}>20,00,000</option>
              <option value={5000000}>50,00,000</option>
              {productType === 'health' && <option value={10000000}>1,00,00,000 (1 Crore)</option>}
            </select>
          </div>

          {/* Policy Term & PPT for LIC */}
          {productType === 'lic' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Policy Term</label>
                {selectedProduct === '936' ? (
                  <select className="input" value={policyTerm} onChange={(e) => setPolicyTerm(Number(e.target.value))}>
                    <option value={16}>16 Years</option>
                    <option value={21}>21 Years</option>
                    <option value={25}>25 Years</option>
                  </select>
                ) : (
                  <input
                    type="number"
                    className="input"
                    value={policyTerm}
                    onChange={(e) => setPolicyTerm(Number(e.target.value))}
                  />
                )}
              </div>
              <div>
                <label className="label">Paying Term (PPT)</label>
                <input
                  type="number"
                  className="input bg-slate-800"
                  value={ppt}
                  disabled={selectedProduct === '936' || selectedProduct === '933'}
                  onChange={(e) => setPpt(Number(e.target.value))}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Output Projections */}
        <div className="lg:col-span-2 space-y-6 print-full-width">
          {/* Print Branded Header (hidden by default, shown during print) */}
          <div className="hidden print:block text-center border-b border-slate-300 pb-6 mb-6">
            <h1 className="text-3xl font-extrabold tracking-wide text-slate-900">AK INVESTMENTS & FINANCIAL SERVICES</h1>
            <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">Wealth & Insurance Advisory OS</p>
            <div className="h-0.5 bg-yellow-500 w-24 mx-auto mt-3" />
            <h2 className="text-xl font-bold text-slate-800 mt-6 uppercase">Insurance Proposal Illustration</h2>
            <div className="grid grid-cols-2 gap-6 max-w-xl mx-auto mt-6 text-left text-sm bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <p className="text-slate-500 text-xs font-semibold">Prepared For:</p>
                <p className="font-bold text-slate-800">{clientName}</p>
                <p className="text-slate-600 text-xs mt-0.5">Age: {clientAge} Years</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs font-semibold">Selected Solution:</p>
                <p className="font-bold text-slate-800">{productName}</p>
                <p className="text-slate-600 text-xs mt-0.5">Sum Assured: {formatCurrency(sumAssured)}</p>
              </div>
              {productType === 'lic' && (
                <>
                  <div>
                    <p className="text-slate-500 text-xs font-semibold">Policy Term:</p>
                    <p className="font-bold text-slate-800">{policyTerm} Years</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs font-semibold">Premium Payment Term (PPT):</p>
                    <p className="font-bold text-slate-800">{ppt} Years</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Action Row */}
          <div className="card p-4 flex flex-wrap items-center justify-between gap-3 bg-slate-900/50 no-print">
            <p className="text-sm font-semibold text-slate-300">Share options for this quotation:</p>
            <div className="flex gap-2">
              <button onClick={handleCopy} className="btn btn-secondary text-xs">
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy Text'}
              </button>
              <a
                href={`https://api.whatsapp.com/send?text=${getWhatsAppText()}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary text-xs flex items-center gap-1.5 animate-pulse-glow"
              >
                <Send size={14} /> Send WhatsApp
              </a>
              <button onClick={() => window.print()} className="btn btn-secondary text-xs">
                <Printer size={14} /> Export to PDF / Print
              </button>
            </div>
          </div>

          {/* Proposal Summary Card */}
          <div className="card p-6 bg-gradient-to-br from-slate-900/50 to-slate-900/10 border-l-4 border-l-yellow-500/80">
            <h3 className="text-base font-bold text-slate-200 flex items-center gap-2 mb-3">
              <FileText size={18} className="text-yellow-400" />
              Executive Proposal Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-4">
              <div>
                <span className="text-slate-400 block text-xs uppercase tracking-wider font-semibold">Total Premium Paid</span>
                <span className="text-lg font-bold text-slate-200">{formatCurrency(projections[projections.length - 1]?.cumulativePremium || 0)}</span>
              </div>
              {productType === 'lic' ? (
                <>
                  <div>
                    <span className="text-slate-400 block text-xs uppercase tracking-wider font-semibold">
                      {selectedProduct === '945' || selectedProduct === '871' ? 'Annual Lifetime Return' : 'Estimated Maturity Returns'}
                    </span>
                    <span className="text-lg font-bold text-emerald-400">
                      {selectedProduct === '945' 
                        ? `${formatCurrency(sumAssured * 0.08)} / year`
                        : selectedProduct === '871' 
                        ? `${formatCurrency(sumAssured * 0.10)} / year`
                        : formatCurrency(projections[projections.length - 1]?.maturityValue || 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs uppercase tracking-wider font-semibold">Initial Insurance Cover</span>
                    <span className="text-lg font-bold text-rose-400">{formatCurrency(sumAssured)}</span>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <span className="text-slate-400 block text-xs uppercase tracking-wider font-semibold">Annual Coverage limit</span>
                    <span className="text-lg font-bold text-blue-400">{formatCurrency(sumAssured)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs uppercase tracking-wider font-semibold">Restore Coverage Buffer</span>
                    <span className="text-lg font-bold text-emerald-400">{activeHighlight?.restore}</span>
                  </div>
                </>
              )}
            </div>
            {productType === 'lic' && selectedProduct === '915' && (
              <p className="text-xs text-yellow-400/80 mt-4 leading-relaxed italic">
                * Note: Jeevan Anand includes a Lifetime Cover benefit. Even after receiving your maturity return of {formatCurrency(projections[projections.length - 1]?.maturityValue || 0)}, a permanent life cover of {formatCurrency(sumAssured)} remains active for the rest of your life at zero premium.
              </p>
            )}
          </div>

          {/* Product Specific Info Cards */}
          {productType === 'health' && activeHighlight && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="card p-5 border-l-4 border-l-blue-500 bg-slate-900/10">
                <h4 className="font-bold text-slate-200 flex items-center gap-2 mb-2">
                  <Heart size={16} className="text-rose-400" />
                  Key Health Coverages
                </h4>
                <ul className="text-xs space-y-2 text-slate-400 leading-relaxed">
                  <li>• **Room Rent Limit:** {activeHighlight.roomRent}</li>
                  <li>• **Restore Benefit:** {activeHighlight.restore}</li>
                  <li>• **Co-pay clause:** {activeHighlight.copay}</li>
                  <li>• **Highlight:** {activeHighlight.customFeature}</li>
                </ul>
              </div>
              <div className="card p-5 border-l-4 border-l-yellow-500 bg-slate-900/10">
                <h4 className="font-bold text-slate-200 flex items-center gap-2 mb-2">
                  <ShieldAlert size={16} className="text-yellow-400" />
                  Waiting Periods & Rules
                </h4>
                <ul className="text-xs space-y-2 text-slate-400 leading-relaxed">
                  <li>• **Initial Waiting Period:** 30 Days (Accident cover starts immediately)</li>
                  <li>• **Specific Illnesses (Cataract, Hernia):** 24 Months</li>
                  <li>• **Pre-existing Diseases (PED):** {activeHighlight.waitingPeriod}</li>
                </ul>
              </div>
            </div>
          )}

          {/* Benefits Table */}
          <div className="card p-5">
            <h3 className="font-semibold mb-3 no-print">
              {productType === 'lic' ? 'Premium & Maturity Projection' : 'Premium Schedule by Age Band'}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="p-3 text-slate-400 uppercase tracking-wider font-semibold">Year</th>
                    <th className="p-3 text-slate-400 uppercase tracking-wider font-semibold">Age</th>
                    <th className="p-3 text-slate-400 uppercase tracking-wider font-semibold">Premium Payable</th>
                    <th className="p-3 text-slate-400 uppercase tracking-wider font-semibold">Cumulative Premiums</th>
                    {productType === 'lic' && (
                      <>
                        <th className="p-3 text-slate-400 uppercase tracking-wider font-semibold">Accrued Bonus</th>
                        {['945', '871'].includes(selectedProduct) && (
                          <th className="p-3 text-slate-400 uppercase tracking-wider font-semibold">Survival Payout</th>
                        )}
                        <th className="p-3 text-slate-400 uppercase tracking-wider font-semibold">Estimated Cover</th>
                        <th className="p-3 text-slate-400 uppercase tracking-wider font-semibold">Maturity Returns</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {projections.map((row) => (
                    <tr key={row.year} className="border-b border-slate-800/50 hover:bg-slate-800/10">
                      <td className="p-3 font-medium text-slate-300">{row.year}</td>
                      <td className="p-3 text-slate-300">{row.age}</td>
                      <td className="p-3 text-yellow-400 font-semibold">{row.premium > 0 ? formatCurrency(row.premium) : 'Paid-Up'}</td>
                      <td className="p-3 text-slate-300">{formatCurrency(row.cumulativePremium)}</td>
                      {productType === 'lic' && (
                        <>
                          <td className="p-3 text-slate-400">{selectedProduct === '854' || selectedProduct === '870' ? '—' : formatCurrency(row.bonusAccrued)}</td>
                          {['945', '871'].includes(selectedProduct) && (
                            <td className="p-3 text-emerald-400 font-bold">
                              {row.survivalBenefit > 0 ? formatCurrency(row.survivalBenefit) : '—'}
                            </td>
                          )}
                          <td className="p-3 text-rose-400 font-medium">{formatCurrency(row.lifeCover)}</td>
                          <td className="p-3 text-emerald-400 font-bold">
                            {row.maturityValue > 0 ? formatCurrency(row.maturityValue) : '—'}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Printable proposal footer */}
          <div className="hidden print:block text-center mt-12 pt-6 border-t border-slate-200 text-xs text-slate-400">
            <p>Proposal generated dynamically on {new Date().toLocaleDateString('en-IN')}. For details, contact AK Investments & Financial Services.</p>
            <p className="mt-1 font-semibold">This is an illustration, not a legal contract. Actual policy clauses are subject to the IRDAI terms and conditions.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
