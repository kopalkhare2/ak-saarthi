import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth';
import { formatCurrency, getFullName } from '@/lib/utils';
import type { Client, Policy, Investment } from '@prisma/client';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Fallback mock engine (original logic) in case API key is missing
function getMockResponse(query: string, data: { clients: Client[]; policies: Policy[]; investments: Investment[] }): string {
  const q = query.toLowerCase();
  const { clients, policies, investments } = data;

  if (q.includes('summarize') || q.includes('portfolio')) {
    const name = clients.find((c) => q.includes(c.firstName.toLowerCase()) || q.includes(c.lastName.toLowerCase()));
    if (name) {
      const pols = policies.filter((p) => p.clientId === name.id);
      const invs = investments.filter((i) => i.clientId === name.id);
      const totalPremium = pols.reduce((s, p) => s + p.premium, 0);
      const totalValue = invs.reduce((s, i) => s + i.currentValue, 0);
      return `**${getFullName(name.firstName, name.lastName)}** — Portfolio Summary\n\n` +
        `• **${pols.length}** active policies (Total premium: ${formatCurrency(totalPremium)}/year)\n` +
        `• **${invs.length}** investments (Current value: ${formatCurrency(totalValue)})\n` +
        `• Risk Profile: ${name.riskProfile.charAt(0).toUpperCase() + name.riskProfile.slice(1)}\n` +
        `• Financial Goals: ${name.financialGoals || 'Not specified'}\n\n` +
        `**Recommendation:** ${name.riskProfile === 'aggressive' ? 'Consider diversifying into debt funds for stability.' : name.riskProfile === 'conservative' ? 'Current allocation looks appropriate. Review FD maturity dates.' : 'Good balance. Consider increasing SIP amounts for long-term goals.'}`;
    }
    return "I couldn't find that client. Please specify a client name, e.g., 'Summarize Rajesh Sharma's portfolio'.";
  }

  if (q.includes('renewal') && !q.includes('draft')) {
    const upcoming = policies.filter((p) => p.renewalStatus === 'due');
    if (upcoming.length === 0) return "Great news! No upcoming renewals at the moment.";
    return `**Upcoming Renewals (${upcoming.length})**\n\n` +
      upcoming.map((p) => {
        const c = clients.find((cl) => cl.id === p.clientId);
        return `• **${c ? getFullName(c.firstName, c.lastName) : 'Unknown'}** — ${p.company} (${p.policyNumber}) — Premium: ${formatCurrency(p.premium)}`;
      }).join('\n');
  }

  if (q.includes('draft') && q.includes('reminder')) {
    return `**Draft Renewal Reminder:**\n\n` +
      `"Dear Client,\n\nThis is a friendly reminder that your insurance policy is due for renewal. ` +
      `To ensure continuous coverage and avoid any lapse in protection, please arrange for the premium payment at your earliest convenience.\n\n` +
      `If you have any questions or need assistance, please don't hesitate to reach out.\n\nBest regards,\nAdvisor Kumar\nAK Investments & Financial Services"`;
  }

  if (q.includes('insurance gap') || q.includes('gap')) {
    const noHealth = clients.filter((c) => !policies.some((p) => p.clientId === c.id && p.type === 'health'));
    const noTerm = clients.filter((c) => !policies.some((p) => p.clientId === c.id && (p.type === 'term' || p.type === 'life')));
    return `**Insurance Gap Analysis**\n\n` +
      `• **No Health Insurance:** ${noHealth.length > 0 ? noHealth.map((c) => getFullName(c.firstName, c.lastName)).join(', ') : 'All clients covered ✓'}\n` +
      `• **No Life/Term Insurance:** ${noTerm.length > 0 ? noTerm.map((c) => getFullName(c.firstName, c.lastName)).join(', ') : 'All clients covered ✓'}\n\n` +
      `**Action:** Prioritize these clients for insurance discussions in your next meetings.`;
  }

  if (q.includes('follow up') || q.includes('this week')) {
    return `**Recommended Follow-ups This Week:**\n\n` +
      `1. **Priya Patel** — Motor insurance renewal in 5 days (ICICI Lombard)\n` +
      `2. **Rajesh Sharma** — LIC term plan premium due in 15 days\n` +
      `3. **Deepak Singh** — TATA AIA policy has lapsed, needs revival discussion\n` +
      `4. **Sneha Gupta** — New client, needs term + health insurance setup\n\n` +
      `Would you like me to draft messages for any of these clients?`;
  }

  return `I'm your AI assistant for financial advisory tasks. I can help you:\n\n` +
    `• Summarize client portfolios\n` +
    `• Identify upcoming renewals\n` +
    `• Draft communication messages\n` +
    `• Analyze insurance gaps\n` +
    `• Suggest follow-ups\n\n` +
    `Try asking: *"Summarize Rajesh Sharma's portfolio"* or *"Which clients have upcoming renewals?"*`;
}

export async function POST(request: Request) {
  try {
    const auth = await requireSession(['advisor']);
    if ('response' in auth) return auth.response;

    const { query } = await request.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Fetch database snapshot for context
    const [clients, policies, investments] = await Promise.all([
      prisma.client.findMany({ include: { family: true } }),
      prisma.policy.findMany(),
      prisma.investment.findMany(),
    ]);

    if (!GEMINI_API_KEY) {
      console.log('GEMINI_API_KEY is missing. Falling back to mock generator.');
      const mockResult = getMockResponse(query, { clients, policies, investments });
      return NextResponse.json({ response: mockResult });
    }

    // Format context for Gemini
    const databaseContext = {
      clients: clients.map((c) => ({
        id: c.id,
        name: `${c.firstName} ${c.lastName}`,
        dob: c.dob,
        phone: c.phone,
        email: c.email,
        city: c.city,
        occupation: c.occupation,
        annualIncome: c.annualIncome,
        riskProfile: c.riskProfile,
        financialGoals: c.financialGoals,
        family: c.family.map((f) => `${f.name} (${f.relation})`),
      })),
      policies: policies.map((p) => ({
        id: p.id,
        clientId: p.clientId,
        company: p.company,
        policyNumber: p.policyNumber,
        type: p.type,
        premium: p.premium,
        premiumFrequency: p.premiumFrequency,
        dueDate: p.dueDate,
        sumAssured: p.sumAssured,
        nominee: p.nominee,
        status: p.status,
        renewalStatus: p.renewalStatus,
      })),
      investments: investments.map((i) => ({
        id: i.id,
        clientId: i.clientId,
        type: i.type,
        schemeName: i.schemeName,
        fundHouse: i.fundHouse,
        investedAmount: i.investedAmount,
        currentValue: i.currentValue,
        returns: i.returns,
        status: i.status,
      })),
    };

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const systemPrompt = `You are AK Saarthi AI, a premium AI copilot for a financial advisor. 
You have direct read access to the advisor's database. Here is the database in JSON format:
${JSON.stringify(databaseContext, null, 2)}

Instructions:
1. Use this database context to answer the user's queries about clients, policies, portfolios, renewals, and follow-ups.
2. Be brief, professional, and act as a reliable financial assistant.
3. Write your responses in clear Markdown format with bold text, bullet points, and tables where appropriate.
4. Format all financial figures in INR (₹).
5. If the user asks you to draft a message (WhatsApp or Email), provide a professional copy-pasteable template pre-filled with the client's information.
6. If the user asks about a client not in the database, politely say you couldn't find them.`;

    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: 'Identify yourself and your capabilities.' }],
        },
        {
          role: 'model',
          parts: [{ text: 'I am AK Saarthi AI, your intelligent financial assistant. I can summarize client portfolios, analyze insurance gaps, identify upcoming policy renewals, draft communications, and suggest follow-ups based on your database.' }],
        },
      ],
      systemInstruction: systemPrompt,
    });

    const result = await chat.sendMessage(query);
    const responseText = result.response.text();

    return NextResponse.json({ response: responseText });
  } catch (error) {
    console.error('Gemini AI execution failed:', error);
    return NextResponse.json(
      { error: 'Failed to process request with AI' },
      { status: 500 }
    );
  }
}
