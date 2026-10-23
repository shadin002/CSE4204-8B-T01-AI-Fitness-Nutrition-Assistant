const { test } = require('node:test');
const assert = require('node:assert/strict');
const nodemailer = require('nodemailer');
const { sendPasswordResetEmail, verifySmtp } = require('../utils/emailService');

test('SMTP recovery configuration and delivery behavior', async () => {
  const originalEnv = { ...process.env };
  const originalCreate = nodemailer.createTransport;
  let config, mail, closed = 0;
  nodemailer.createTransport = (options) => {
    config = options;
    return {
      sendMail: async (message) => { mail = message; return { accepted: [message.to] }; },
      verify: async () => true,
      close: () => { closed++; },
    };
  };
  try {
    for (const key of ['SMTP_HOST', 'SMTP_PORT', 'SMTP_SECURE', 'SMTP_USER', 'SMTP_PASS']) delete process.env[key];
    await assert.rejects(sendPasswordResetEmail('test@example.com', 'https://example.com/reset'), { statusCode: 503 });
    Object.assign(process.env, { SMTP_HOST: 'smtp.example.com', SMTP_USER: 'user', SMTP_PASS: 'test-secret', SMTP_PORT: '587' });
    await sendPasswordResetEmail('test@example.com', 'https://example.com/reset/token?a=1&b=2');
    assert.equal(config.secure, false);
    assert.equal(config.requireTLS, true);
    assert.equal(mail.to, 'test@example.com');
    assert.match(mail.html, /a=1&amp;b=2/);
    assert.equal(closed, 1);
    process.env.SMTP_PORT = '465';
    await verifySmtp();
    assert.equal(config.secure, true);
    process.env.SMTP_SECURE = 'false';
    await assert.rejects(verifySmtp(), /465/);
    process.env.SMTP_PORT = 'invalid';
    await assert.rejects(verifySmtp(), /Invalid SMTP/);
    process.env.SMTP_PORT = '587';
    nodemailer.createTransport = () => ({ sendMail: async () => { throw new Error('private provider details'); }, close() {} });
    await assert.rejects(sendPasswordResetEmail('test@example.com', 'https://example.com'), {
      statusCode: 503, message: 'Password reset email could not be sent. Please try again later.',
    });
  } finally {
    nodemailer.createTransport = originalCreate;
    for (const key of Object.keys(process.env)) if (!(key in originalEnv)) delete process.env[key];
    Object.assign(process.env, originalEnv);
  }
});
