import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Circle, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import Logo from '../components/Logo.jsx';
import Input from '../components/Input.jsx';
import Button from '../components/Button.jsx';
import Alert from '../components/Alert.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [sessionMessage, setSessionMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const message = sessionStorage.getItem('fitguide_auth_message');
    if (message) {
      setSessionMessage(message);
      sessionStorage.removeItem('fitguide_auth_message');
    }
  }, []);

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      setLoading(true);
      const user = await login(form.email, form.password);
      navigate(user?.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.appMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <section className="auth-left">
        <Logo />
        <div>
          <h1>Welcome back to your fitness journey</h1>
          <p>Log in to access your dashboard, profile, progress, and AI-assisted recommendations.</p>
        </div>
        <div className="auth-benefits">
          <span><ArrowRight size={16} /> Personalized Workouts <small>Plans based on your goal and fitness level.</small></span>
          <span><Circle size={16} /> Budget Nutrition <small>Meal ideas suitable for students.</small></span>
          <span><Star size={16} /> Progress Feedback <small>AI feedback from your saved progress.</small></span>
        </div>
      </section>

      <section className="auth-card">
        <div className="auth-tabs">
          <Link className="active" to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </div>
        <h2>Log in to your account</h2>
        <p>Welcome back. Enter your details to continue.</p>
        <Alert type="success">{location.state?.message || sessionMessage}</Alert>
        <Alert type="error">{error}</Alert>
        <form onSubmit={handleSubmit} className="form-stack">
          <Input label="Email Address" type="email" name="email" value={form.email} onChange={update} placeholder="Enter your email address" required />
          <Input label="Password" type="password" name="password" value={form.password} onChange={update} placeholder="Enter your password" required />
          <div className="form-row small-row auth-link-row">
            <span>Forgot your password?</span>
            <Link to="/forgot-password">Recover password</Link>
          </div>
          <Button loading={loading} type="submit">Log In</Button>
          <p className="center-note">Don&apos;t have an account? <Link to="/register">Register</Link></p>
        </form>
      </section>
    </div>
  );
}
