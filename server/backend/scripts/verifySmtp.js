require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { verifySmtp } = require('../utils/emailService');
verifySmtp().then(() => {
  console.log('SMTP connection and authentication succeeded. No email was sent.');
}).catch((err) => {
  console.error('SMTP verification failed. Check SMTP settings, credentials and network access.');
  if (err.code && /^[A-Z_]+$/.test(err.code)) console.error(`Error code: ${err.code}`);
  process.exitCode = 1;
});
