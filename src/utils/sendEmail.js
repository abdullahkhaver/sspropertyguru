import nodemailer from 'nodemailer';

export const sendEmail = async (to, subject, text) => {
  // Primary: Resend API (works on Railway)
  if (process.env.RESEND_API_KEY) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
          to: [to],
          subject: subject,
          text: text,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const data = await response.json();

      if (!response.ok) {
        console.error('[EMAIL] Resend error response:', JSON.stringify(data));
        throw new Error(`Resend API error: ${response.status} - ${data?.message || 'Unknown error'}`);
      }

      console.log('[EMAIL] Sent via Resend successfully to:', to);
      return;
    } catch (error) {
      clearTimeout(timeout);
      console.error('[EMAIL] Resend failed:', error.message);
      throw error;
    }
  }

  // Fallback: Gmail SMTP (may be blocked on Railway)
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('No email provider configured. Set RESEND_API_KEY or SMTP_USER/SMTP_PASS.');
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 15000,
  });

  await transporter.sendMail({
    from: `"SS Property Guru" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
  });

  console.log('[EMAIL] Sent via Gmail SMTP to:', to);
};
