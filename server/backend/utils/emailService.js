const nodemailer = require('nodemailer');

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

async function sendPasswordResetEmail(to, resetUrl) {
  const transporter = getTransporter();

  if (!transporter) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV] Password reset link for ${to}: ${resetUrl}`);
      return;
    }

    const err = new Error('Password reset email service is not configured');
    err.statusCode = 503;
    throw err;
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  await transporter.sendMail({
    from,
    to,
    subject: 'Reset your FitGuide AI password',
    text: `A password reset was requested for your FitGuide AI account. Open this link to set a new password: ${resetUrl}\n\nThis link expires in 20 minutes. If you did not request a reset, you can ignore this email.`,
    html: `<p>A password reset was requested for your FitGuide AI account.</p><p><a href="${resetUrl}">Reset your password</a></p><p>This link expires in 20 minutes. If you did not request a reset, you can ignore this email.</p>`,
  });
}

module.exports = { sendPasswordResetEmail };