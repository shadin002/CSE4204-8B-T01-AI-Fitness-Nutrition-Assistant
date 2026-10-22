# Password recovery SMTP setup

The backend already provides POST /api/auth/forgot-password and POST /api/auth/reset-password/:token. SMTP is now required for email delivery, including development. Missing SMTP no longer logs secret reset links and pretends to send mail.

## Configure

Add the following settings to backend/.env, keeping your existing database and JWT settings. Obtain real values from your email provider's SMTP settings. Do not commit credentials or paste passwords into chat.

```dotenv
SMTP_HOST=your_provider_smtp_host
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_provider_smtp_username
SMTP_PASS=your_provider_smtp_password
SMTP_FROM="FitGuide AI <your_verified_sender@example.com>"
CLIENT_URL=http://localhost:5173
```

For implicit TLS on port 465, set SMTP_PORT=465 and SMTP_SECURE=true. Port 587 uses mandatory STARTTLS. Certificate validation remains enabled. Use a provider-issued SMTP password or app password if required. The sender must be permitted by the provider. Set CLIENT_URL to your frontend URL in deployment; the first comma-separated URL is used for reset links.

From backend/ run:

```sh
npm install
npm run smtp:verify
npm run test:recovery
npm run dev
```

smtp:verify checks connection and authentication without sending mail. It does not prove sender authorization or inbox delivery. Restart the backend after changing .env.

## Frontend contract / manual check

1. Submit POST /api/auth/forgot-password with JSON {"email":"your-test-account@example.com"}. Use an account registered in this app. A successful request returns a generic message.
2. Check that account's inbox and spam folder. The link points to CLIENT_URL/reset-password/TOKEN and expires after 20 minutes.
3. The frontend must render a new-password form at /reset-password/:token. Submit POST /api/auth/reset-password/TOKEN with JSON {"password":"a-new-password"}. Passwords must be 8–128 characters. Do not reset on a GET request or merely opening the email link.
4. Confirm login works with the new password and fails with the old one. Confirm reusing the reset link fails. Existing sessions are invalidated by the existing tokenVersion mechanism.
5. An unknown email receives the same generic success response. Both recovery routes share a limit of five requests per 15 minutes per IP.

Only backend files were supplied; a frontend recovery form could not be inspected or modified.

## Changes and validation

- Validated SMTP port and TLS settings; required encrypted SMTP and bounded connection timeouts.
- Added npm run smtp:verify and mocked email-service tests.
- Removed development reset-token console output and sanitized delivery failures.
- Escaped HTML reset links and normalized trailing slashes in CLIENT_URL.
- Existing token hashing, expiry, reset handling, and mail-failure cleanup remain in place.

Local mocked SMTP tests passed.
