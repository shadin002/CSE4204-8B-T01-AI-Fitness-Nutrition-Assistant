const nodemailer = require('nodemailer');

function getTransporter() {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    const err = new Error('Password reset email service is not configured');
    err.statusCode = 503;
    throw err;
  }
  const port = Number(process.env.SMTP_PORT || 587);
  const secureSetting = process.env.SMTP_SECURE?.trim().toLowerCase();
  if (!Number.isInteger(port) || port < 1 || port > 65535 ||
      (secureSetting && !['true', 'false'].includes(secureSetting))) {
    throw new Error('Invalid SMTP_PORT or SMTP_SECURE configuration');
  }
  const secure = secureSetting ? secureSetting === 'true' : port === 465;
  if (port === 465 && !secure) {
    throw new Error('Port 465 requires SMTP_SECURE=true');
  }
  return nodemailer.createTransport({
    host, port, secure,
    requireTLS: !secure,
    auth: { user, pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
  });
}

const escapeHtml = (value) => value.replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));

async function verifySmtp() {
  const transporter = getTransporter();
  try {
    await transporter.verify();
  } finally {
    transporter.close();
  }
}

async function sendPasswordResetEmail(to, resetUrl) {
  const transporter = getTransporter();

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  try {
    const result = await transporter.sendMail({
    from,
    to,
    subject: 'Reset your FitGuide AI password',
    text: `A password reset was requested for your FitGuide AI account. Open this link to set a new password: ${resetUrl}\n\nThis link expires in 20 minutes. If you did not request a reset, you can ignore this email.`,
    html: `<p>A password reset was requested for your FitGuide AI account.</p><p><a href="${escapeHtml(resetUrl)}">Reset your password</a></p><p>This link expires in 20 minutes. If you did not request a reset, you can ignore this email.</p>`,
    });
    if (!result.accepted?.length) throw new Error('Recipient rejected');
  } catch (cause) {
    const err = new Error('Password reset email could not be sent. Please try again later.');
    err.statusCode = 503;
    throw err;
  } finally {
    transporter.close();
  }
}

module.exports = { sendPasswordResetEmail, verifySmtp };
