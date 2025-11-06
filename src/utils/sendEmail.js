import nodemailer from 'nodemailer';

export const sendEmail = async (to, subject, text) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER, // your Gmail address
      pass: process.env.SMTP_PASS, // app password (not regular password)
    },
  });

  await transporter.sendMail({
    from: `"SS Property GURU" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
  });
};
