import nodemailer from 'nodemailer';

export const sendEmail = async (to, subject, text) => {
  // Check if using Resend API (recommended for Railway)
  if (process.env.RESEND_API_KEY) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
          to: [to],
          subject: subject,
          text: text
        })
      });
      
      if (!response.ok) {
        throw new Error(`Resend API error: ${response.status}`);
      }
      
      console.log('[EMAIL] Sent via Resend successfully');
      return;
    } catch (error) {
      console.error('[EMAIL] Resend failed:', error.message);
      throw error;
    }
  }
  
  // Fallback to Gmail SMTP
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 30000, // 30 seconds
    greetingTimeout: 30000,
    socketTimeout: 30000,
  });

  await transporter.sendMail({
    from: `"SS Property Guru" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
  });
};
