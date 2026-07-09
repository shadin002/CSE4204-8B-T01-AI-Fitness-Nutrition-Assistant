import { useEffect, useState } from 'react';
import { Info, Zap } from 'lucide-react';
import AppLayout from '../components/AppLayout.jsx';
import Button from '../components/Button.jsx';
import Alert from '../components/Alert.jsx';
import RecommendationCard from '../components/RecommendationCard.jsx';
import api from '../services/api.js';

export default function WorkoutRecommendation() {
  const [recommendation, setRecommendation] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const res = await api.get('/recommendations?type=workout');
      const items = res.data?.data?.recommendations || [];
      setHistory(items);
      if (items[0]) setRecommendation(items[0]);
    } catch {
      // AI module may not be merged before Week 8.
    }
  };

  const generate = async () => {
    setError('');
    try {
      setLoading(true);
      const res = await api.post('/recommendations/workout');
      setRecommendation(res.data?.data?.recommendation);
      await loadHistory();
    } catch (err) {
      setError(err.appMessage || 'Workout recommendation is not available yet.');
    } finally {
      setLoading(false);
    }
  };

  const plan = recommendation?.aiResponse;

  return (
    <AppLayout>
      <div className="page-heading">
        <h1>Workout Recommendation</h1>
        <p>AI-assisted workout guidance based on saved profile data.</p>
      </div>

      <div className="info-banner">
        <Info size={18} />
        We use your saved profile, goal, and activity level. The user does not write prompts.
      </div>

      <div className="action-line">
        <Button loading={loading} onClick={generate}><Zap size={16} /> Generate Workout Plan</Button>
        <span>{loading ? 'AI is preparing your plan...' : 'Click to generate a fresh plan.'}</span>
      </div>

      <Alert type="error">{error}</Alert>

      <section className="panel recommendation-panel">
        <div className="panel-head">
          <h2>Recommended Plan <span className="badge">Beginner</span></h2>
          <span>{plan?.weeklyFrequency || 'AI Plan'}</span>
        </div>

        {plan ? (
          <div className="workout-layout">
            <div>
              <h3>Weekly Workout Split</h3>
              <ul className="split-list">
                {plan.workoutPlan?.map((day, index) => (
                  <li key={index}><strong>{day.day}</strong><span>{day.focus}</span></li>
                ))}
              </ul>
            </div>

            <div>
              <h3>Today&apos;s Workout</h3>
              <table className="clean-table">
                <thead><tr><th>Exercise</th><th>Sets</th><th>Reps / Time</th><th>Rest</th></tr></thead>
                <tbody>
                  {(plan.workoutPlan?.[0]?.exercises || []).map((item, index) => (
                    <tr key={index}><td>{item}</td><td>3</td><td>8-12 reps</td><td>60 sec</td></tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="side-notes">
              <RecommendationCard title="Why this plan?">Designed for your current profile and goal.</RecommendationCard>
              <RecommendationCard title="Safety Note" tone="yellow">{plan.safetyNote}</RecommendationCard>
              <RecommendationCard title="Motivation" tone="purple">{plan.motivation}</RecommendationCard>
            </div>
          </div>
        ) : (
          <p className="empty-state">No workout recommendation yet. Generate one after the Week 8 AI backend is connected.</p>
        )}
      </section>
    </AppLayout>
  );
}
