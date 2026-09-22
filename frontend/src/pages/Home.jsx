import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, Check, Circle, Star, Zap } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';

export default function Home() {
  return (
    <div className="public-page">
      <Navbar />

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Smart. Simple. For a Healthier You.</p>
          <h1>
            AI-Based Fitness & <span>Nutrition Assistant</span>
          </h1>
          <p>
            Personalized workout and nutrition guidance for beginners, students,
            and budget-conscious users.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="btn btn-primary">
              <Check size={16} /> Get Started
            </Link>
            <a href="#features" className="btn btn-outline">
              See Features
            </a>
          </div>
        </div>

        <div className="plan-preview">
          <div className="preview-top">
            <h3>Today&apos;s Plan</h3>
            <span>On track</span>
          </div>
          <div className="preview-row">
            <Zap size={16} />
            <div>
              <strong>Full Body Workout</strong>
              <small>25 min</small>
            </div>
          </div>
          <div className="preview-row">
            <Circle size={16} />
            <div>
              <strong>Budget Diet Plan</strong>
              <small>Local food</small>
            </div>
          </div>
          <div className="preview-row">
            <BarChart3 size={16} />
            <div>
              <strong>Progress</strong>
              <small>68% weekly goal</small>
            </div>
          </div>
          <div className="preview-progress">
            <span />
          </div>
          <p>AI suggestion: Add eggs, dal, and vegetables today for a budget-friendly nutrition boost.</p>
        </div>
      </section>

      <section id="features" className="feature-grid">
        {[
          ['Personalized Workout Plans', 'Routines matched to your goal and level.', ArrowRight],
          ['Budget-Based Nutrition', 'Local Bangladeshi meals that fit your wallet.', Circle],
          ['Progress Tracking', 'Log weight and notes, watch yourself improve.', BarChart3],
          ['AI-Assisted Guidance', 'Smart feedback based on your data.', Star]
        ].map(([title, text, Icon]) => (
          <article key={title} className="feature-card">
            <div className="soft-icon"><Icon size={17} /></div>
            <div>
              <strong>{title}</strong>
              <p>{text}</p>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
