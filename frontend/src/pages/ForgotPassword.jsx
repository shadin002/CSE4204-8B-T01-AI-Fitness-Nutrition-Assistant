import { useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo.jsx';
import Input from '../components/Input.jsx';
import Button from '../components/Button.jsx';
import Alert from '../components/Alert.jsx';
import api from '../services/api.js';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      setLoading(true);
      const res = await api.post('/auth/forgot-password', { email });
      setMessage(res.data?.message || 'If an account exists for this email, a reset link has been sent.');
    } catch (err) {
      setError(err.appMessage || 'Password recovery is temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page auth-page-simple">
      <section className="auth-left compact-auth-left">
        <Logo />
        <div>
          <h1>Recover your account</h1>
          <p>Enter the email address used for your FitGuide AI account.</p>
        </div>
      </section>
      <section className="auth-card">
        <h2>Forgot password</h2>
        <p>We will send a time-limited password reset link if the account exists.</p>
        <Alert type="success">{message}</Alert>
        <Alert type="error">{error}</Alert>
        <form className="form-stack" onSubmit={submit}>
          <Input label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Button loading={loading} type="submit">Send Reset Link</Button>
          <p className="center-note"><Link to="/login">Back to Login</Link></p>
        </form>
      </section>
    </div>
  );
}
