import { useEffect, useMemo, useState } from 'react';
import { Info, Zap } from 'lucide-react';
import AppLayout from '../components/AppLayout.jsx';
import Button from '../components/Button.jsx';
import Alert from '../components/Alert.jsx';
import RecommendationCard from '../components/RecommendationCard.jsx';
import api from '../services/api.js';
import { labelText } from '../utils/formatDate.js';

export default function WorkoutRecommendation() {
  const [recommendation, setRecommendation] = useState(null);
  const [selectedDay, setSelectedDay] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadLatest = async () => {
    try {
      const res = await api.get('/recommendations?type=workout&latest=true');
      setRecommendation(res.data?.data?.recommendations?.[0] || null);
      setSelectedDay(0);
    } catch {
      setRecommendation(null);
    }
  };

  useEffect(() => { loadLatest(); }, []);

  const generate = async (force = false) => {
    setError('');
    setMessage('');
    try {
      setLoading(true);
      const res = await api.post(`/recommendations/workout${force ? '?force=true' : ''}`);
      setRecommendation({ ...res.data?.data?.recommendation, isStale: false });
      setSelectedDay(0);
      setMessage(res.data?.data?.cached ? 'Your current workout plan is already up to date.' : 'Workout plan generated successfully.');
    } catch (err) {
      setError(err.appMessage || 'Workout recommendation is not available yet.');
    } finally {
      setLoading(false);
    }
  };

  const plan = recommendation?.aiResponse;
  const isLegacyPlan = useMemo(
    () => Boolean(plan?.workoutPlan?.some((day) => (day.exercises || []).some((item) => typeof item === 'string'))),
    [plan]
  );
  const activeDay = useMemo(() => (!isLegacyPlan ? plan?.workoutPlan?.[selectedDay] || null : null), [plan, selectedDay, isLegacyPlan]);
  const experience = labelText(recommendation?.inputData?.trainingExperience || 'beginner');

  return (
    <AppLayout>
      <div className="page-heading"><h1>Workout Recommendation</h1><p>AI-assisted workout guidance based on your current saved profile.</p></div>

      <div className="info-banner"><Info size={18} /> We use your current weight, goal, activity level, training experience, equipment access, and movement limitations.</div>
      <div className="action-line">
        <Button loading={loading} onClick={() => generate(false)}><Zap size={16} /> {plan ? 'Refresh Current Plan' : 'Generate Workout Plan'}</Button>
        {plan ? <button type="button" className="secondary-action" onClick={() => generate(true)} disabled={loading}>Regenerate New Version</button> : null}
      </div>

      <Alert type="success">{message}</Alert>
      <Alert type="error">{error}</Alert>
      {isLegacyPlan ? <Alert type="info">This saved workout uses the older plan format. Refresh Current Plan to convert it to the new detailed day-by-day format.</Alert> : recommendation?.isStale ? <Alert type="info">Your fitness profile changed after this plan was generated. Refresh the plan before following it.</Alert> : null}

      <section className="panel recommendation-panel">
        <div className="panel-head">
          <h2>Recommended Plan <span className="badge">{experience}</span></h2>
          <span className="plan-frequency">{plan?.weeklyFrequency ? `${plan.weeklyFrequency} • 7-day schedule` : 'AI Plan'}</span>
        </div>

        {plan && !isLegacyPlan ? (
          <div className="workout-layout">
            <div>
              <h3>Weekly Workout Plan</h3>
              <ul className="split-list interactive-split">
                {plan.workoutPlan?.map((day, index) => (
                  <li key={day.day}>
                    <button type="button" className={selectedDay === index ? 'day-select active' : 'day-select'} onClick={() => setSelectedDay(index)}>
                      <strong>{day.day}</strong><span>{day.focus}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3>{activeDay?.day || 'Day'} Details</h3>
              <p className="day-type-label">{labelText(activeDay?.dayType)} · {activeDay?.focus}</p>
              <div className="workout-table-wrap">
                <table className="clean-table workout-table">
                  <thead><tr><th>Exercise / Activity</th><th>Sets</th><th>Reps / Time</th><th>Rest</th></tr></thead>
                  <tbody>
                    {(activeDay?.exercises || []).map((item, index) => (
                      <tr key={`${item.name}-${index}`}>
                        <td>{item.name}</td>
                        <td>{item.sets}</td>
                        <td>{item.repsOrTime}</td>
                        <td>{item.restSeconds ? `${item.restSeconds} sec` : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="side-notes">
              <RecommendationCard title="Why this plan?">Built from your current profile, available equipment, experience level, and fitness goal.</RecommendationCard>
              <RecommendationCard title="Safety Note" tone="yellow">{plan.safetyNote}</RecommendationCard>
              <RecommendationCard title="Motivation" tone="purple">{plan.motivation}</RecommendationCard>
            </div>
          </div>
        ) : isLegacyPlan ? <p className="empty-state">Your previous workout is still saved, but it needs one refresh before it can be shown with accurate sets, repetitions/time, and rest values.</p> : <p className="empty-state">No workout recommendation yet. Generate a plan after completing your fitness profile.</p>}
      </section>
    </AppLayout>
  );
}
