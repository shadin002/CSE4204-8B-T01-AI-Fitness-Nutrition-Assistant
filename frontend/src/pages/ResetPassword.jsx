import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Logo from '../components/Logo.jsx';
import Input from '../components/Input.jsx';
import Button from '../components/Button.jsx';
import Alert from '../components/Alert.jsx';
import api from '../services/api.js';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Password and confirm password do not match.');
      return;
    }

    try {
      setLoading(true);
      await api.post(`/auth/reset-password/${token}`, { password: form.password });
      navigate('/login', { state: { message: 'Password reset successful. Please log in.' } });
    } catch (err) {
      setError(err.appMessage || 'The reset link is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page auth-page-simple">
      <section className="auth-left compact-auth-left">
        <Logo />
        <div>
          <h1>Set a new password</h1>
          <p>Choose a new password for your FitGuide AI account.</p>
        </div>
      </section>
      <section className="auth-card">
        <h2>Reset password</h2>
        <Alert type="error">{error}</Alert>
        <form className="form-stack" onSubmit={submit}>
          <Input label="New Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={8} maxLength={128} required />
          <Input label="Confirm New Password" type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} minLength={8} maxLength={128} required />
          <Button loading={loading} type="submit">Reset Password</Button>
          <p className="center-note"><Link to="/login">Back to Login</Link></p>
        </form>
      </section>
    </div>
  );
}
