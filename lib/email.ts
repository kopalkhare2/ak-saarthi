import nodemailer from 'nodemailer';

interface SendApprovalParams {
  to: string;
  name: string;
  temporaryPassword?: string;
  loginUrl?: string;
}

interface SendRequestNotificationParams {
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
}

const DEFAULT_LOGIN_URL = process.env.NEXTAUTH_URL || 'https://ak-saarthi.vercel.app/login';
const ADMIN_NOTIFICATION_EMAIL = process.env.ADMIN_EMAIL || 'kopalkhare2@gmail.com';

/**
 * Creates an SMTP transporter if SMTP environment variables are provided.
 */
function getSmtpTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }
  return null;
}

/**
 * Send an email via Resend REST API or SMTP fallback
 */
async function dispatchEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<{ sent: boolean; provider?: string; error?: string }> {
  // 1. Try Resend if API key is present
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'AK Saarthi AI <onboarding@resend.dev>',
          to: [to],
          subject,
          html,
          text,
        }),
      });

      if (res.ok) {
        return { sent: true, provider: 'resend' };
      }
      const errData = await res.json();
      console.warn('Resend API error:', errData);
    } catch (e: any) {
      console.warn('Failed to send via Resend:', e.message);
    }
  }

  // 2. Try SMTP if configured
  const transporter = getSmtpTransporter();
  if (transporter) {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || `AK Saarthi AI <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
        text,
      });
      return { sent: true, provider: 'smtp' };
    } catch (e: any) {
      console.warn('Failed to send via SMTP:', e.message);
      return { sent: false, error: e.message };
    }
  }

  return { sent: false, provider: 'none', error: 'No email service configured' };
}

/**
 * Generate formatted welcome template for approved advisors
 */
export function generateAdvisorWelcomeTemplate(params: SendApprovalParams) {
  const loginUrl = params.loginUrl || DEFAULT_LOGIN_URL;
  const tempPassword = params.temporaryPassword || 'password123';

  const subject = 'Welcome to AK Saarthi AI — Your Advisor Account Is Approved!';

  const text = `Hello ${params.name},

Congratulations! Your advisor access request for AK Saarthi AI has been reviewed and APPROVED by the administrator.

Here are your account credentials:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Portal URL: ${loginUrl}
Username / Email: ${params.to}
Temporary Password: ${tempPassword}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You can also use "Continue with Google" on the login page if your Google email matches ${params.to}.

Next Steps:
1. Log in at ${loginUrl}
2. Go to Settings to complete your advisor profile (ARN/License number)
3. Change your password in Settings under "Change Password"

Welcome to AK Saarthi AI!
Financial Advisor Operating System`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #f8fafc; margin: 0; padding: 24px; }
    .card { max-width: 560px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    .badge { display: inline-block; background-color: rgba(234, 179, 8, 0.15); color: #facc15; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 16px; border: 1px solid rgba(234, 179, 8, 0.3); }
    h1 { color: #ffffff; font-size: 24px; margin-top: 0; margin-bottom: 8px; }
    p { color: #94a3b8; font-size: 14px; line-height: 1.6; }
    .creds-box { background-color: #0b0f19; border: 1px solid #374151; border-radius: 12px; padding: 20px; margin: 24px 0; }
    .cred-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
    .cred-label { color: #94a3b8; }
    .cred-val { color: #f8fafc; font-family: monospace; font-weight: 600; }
    .btn { display: inline-block; background-color: #facc15; color: #0b0f19; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-size: 14px; margin-top: 12px; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #1f2937; font-size: 12px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">Access Approved</div>
    <h1>Welcome to AK Saarthi AI</h1>
    <p>Hello <strong>${params.name}</strong>,</p>
    <p>Your request for Advisor access has been approved! You now have your dedicated workspace on AK Saarthi AI to manage clients, policies, portfolios, and insurance tracking.</p>
    
    <div class="creds-box">
      <div class="cred-row"><span class="cred-label">Login Portal:</span> <span class="cred-val">${loginUrl}</span></div>
      <div class="cred-row"><span class="cred-label">Username / Email:</span> <span class="cred-val">${params.to}</span></div>
      <div class="cred-row"><span class="cred-label">Temporary Password:</span> <span class="cred-val">${tempPassword}</span></div>
    </div>

    <div style="text-align: center;">
      <a href="${loginUrl}" class="btn" target="_blank">Sign In to Advisor Portal →</a>
    </div>

    <p style="margin-top: 24px; font-size: 13px; color: #cbd5e1;">
      💡 <em>Tip: You can also sign in instantly using <strong>"Continue with Google"</strong> with your registered email (${params.to}).</em>
    </p>

    <div class="footer">
      AK Saarthi AI — Financial Advisor Operating System<br>
      Please change your temporary password after your first login.
    </div>
  </div>
</body>
</html>`;

  return { subject, text, html };
}

/**
 * Sends welcome & credential email to an approved advisor.
 */
export async function sendAdvisorApprovalEmail(params: SendApprovalParams) {
  const template = generateAdvisorWelcomeTemplate(params);
  const result = await dispatchEmail({
    to: params.to,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });

  return {
    ...result,
    template,
  };
}

/**
 * Notifies the administrator when a new advisor access request is submitted.
 */
export async function notifyAdminNewRequest(params: SendRequestNotificationParams) {
  const adminEmail = ADMIN_NOTIFICATION_EMAIL;
  const subject = `🔔 New Advisor Access Request: ${params.applicantName}`;
  const text = `A new financial advisor has requested platform access:

Name: ${params.applicantName}
Email: ${params.applicantEmail}
Phone: ${params.applicantPhone}

Review and approve this request in your Admin Console:
${DEFAULT_LOGIN_URL.replace('/login', '/admin/requests')}`;

  const html = `
<div style="font-family: sans-serif; background: #0b0f19; color: #f8fafc; padding: 24px;">
  <div style="max-width: 500px; margin: 0 auto; background: #111827; padding: 24px; border-radius: 12px; border: 1px solid #374151;">
    <h2 style="color: #facc15; margin-top: 0;">New Advisor Access Request</h2>
    <p>A new applicant has requested access as a financial advisor on AK Saarthi AI:</p>
    <ul>
      <li><strong>Name:</strong> ${params.applicantName}</li>
      <li><strong>Email:</strong> ${params.applicantEmail}</li>
      <li><strong>Phone:</strong> ${params.applicantPhone}</li>
    </ul>
    <div style="margin-top: 20px;">
      <a href="${DEFAULT_LOGIN_URL.replace('/login', '/admin/requests')}" style="background: #facc15; color: #0b0f19; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Review in Admin Console →</a>
    </div>
  </div>
</div>`;

  return dispatchEmail({
    to: adminEmail,
    subject,
    html,
    text,
  });
}
