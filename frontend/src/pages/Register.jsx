import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Circle, Star } from 'lucide-react';
import { useState } from 'react';
import Logo from '../components/Logo.jsx';
import Input from '../components/Input.jsx';
import Button from '../components/Button.jsx';
import Alert from '../components/Alert.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Password and confirm password do not match.');
      return;
    }

    try {
      setLoading(true);
      await register({ name: form.name, email: form.email, password: form.password });
      navigate('/login', { state: { message: 'Registration successful. Please log in.' } });
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
          <h1>Start your fitness journey</h1>
          <p>Create an account or log in to access your dashboard, profile, progress, and AI-assisted recommendations.</p>
        </div>
        <div className="auth-benefits">
          <span><ArrowRight size={16} /> Personalized Workouts <small>Plans based on your goal and fitness level.</small></span>
          <span><Circle size={16} /> Budget Nutrition <small>Meal ideas suitable for students.</small></span>
          <span><Star size={16} /> Progress Feedback <small>AI feedback from your saved progress.</small></span>
        </div>
      </section>

      <section className="auth-card">
        <div className="auth-tabs">
          <Link to="/login">Login</Link>
          <Link className="active" to="/register">Register</Link>
        </div>
        <h2>Create your account</h2>
        <p>Start your fitness journey in under a minute.</p>
        <Alert type="error">{error}</Alert>
        <form onSubmit={handleSubmit} className="form-stack">
          <Input label="Full Name" name="name" value={form.name} onChange={update} placeholder="Enter your full name" required />
          <Input label="Email Address" type="email" name="email" value={form.email} onChange={update} placeholder="Enter your email address" required />
          <Input label="Password" type="password" name="password" value={form.password} onChange={update} placeholder="Create a password" required minLength={6} />
          <Input label="Confirm Password" type="password" name="confirmPassword" value={form.confirmPassword} onChange={update} placeholder="Confirm your password" required minLength={6} />
          <Button loading={loading} type="submit">Create Account</Button>
        </form>
      </section>
    </div>
  );
}
