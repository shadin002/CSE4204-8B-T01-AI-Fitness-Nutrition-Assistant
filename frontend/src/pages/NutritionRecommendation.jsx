import { useEffect, useState } from 'react';
import { Circle, Info } from 'lucide-react';
import AppLayout from '../components/AppLayout.jsx';
import Button from '../components/Button.jsx';
import Alert from '../components/Alert.jsx';
import RecommendationCard from '../components/RecommendationCard.jsx';
import api from '../services/api.js';

export default function NutritionRecommendation() {
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadLatest = async () => {
    try {
      const res = await api.get('/recommendations?type=nutrition&latest=true');
      setRecommendation(res.data?.data?.recommendations?.[0] || null);
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
      const res = await api.post(`/recommendations/nutrition${force ? '?force=true' : ''}`);
      setRecommendation({ ...res.data?.data?.recommendation, isStale: false });
      setMessage(res.data?.data?.cached ? 'Your current nutrition plan is already up to date.' : 'Nutrition plan generated successfully.');
    } catch (err) {
      setError(err.appMessage || 'Nutrition recommendation is not available yet.');
    } finally {
      setLoading(false);
    }
  };

  const plan = recommendation?.aiResponse;

  return (
    <AppLayout>
      <div className="page-heading"><h1>Nutrition Recommendation</h1><p>Budget-aware general nutrition guidance using local Bangladeshi foods.</p></div>
      <div className="info-banner"><Info size={18} /> We use your current BMI, goal, budget, dietary preference, and listed food allergies.</div>
      <div className="action-line">
        <Button loading={loading} onClick={() => generate(false)}><Circle size={16} /> {plan ? 'Refresh Current Plan' : 'Generate Diet Plan'}</Button>
        {plan ? <button type="button" className="secondary-action" onClick={() => generate(true)} disabled={loading}>Regenerate New Version</button> : null}
      </div>

      <Alert type="success">{message}</Alert>
      <Alert type="error">{error}</Alert>
      {recommendation?.isStale ? <Alert type="info">Your profile changed after this nutrition plan was generated. Refresh it before following the suggestions.</Alert> : null}

      <section className="panel nutrition-panel">
        <h2>AI Nutrition Plan <span className="badge">General Guidance</span></h2>
        {plan ? (
          <>
            <div className="meal-grid">
              {plan.dietPlan?.map((meal, index) => (
                <article key={meal.meal} className="meal-card">
                  <div className="meal-card-head"><span className="meal-number">{String(index + 1).padStart(2, '0')}</span></div>
                  <strong>{meal.meal}</strong>
                  <ul className="meal-suggestion-list">{(meal.suggestions || []).map((suggestion, i) => <li key={i}>{suggestion}</li>)}</ul>
                </article>
              ))}
            </div>

            <div className="two-column">
              <RecommendationCard title="Local Bangladeshi Food Ideas"><ul className="check-list">{(plan.localFoodIdeas || []).map((item, index) => <li key={index}>{item}</li>)}</ul></RecommendationCard>
              <RecommendationCard title="Budget-Friendly Explanation">{plan.budgetExplanation}</RecommendationCard>
            </div>
            <div className="two-column">
              <RecommendationCard title="Safety Note" tone="yellow">{plan.safetyNote}</RecommendationCard>
              <RecommendationCard title="Motivation" tone="purple">{plan.motivation}</RecommendationCard>
            </div>
          </>
        ) : <p className="empty-state">No nutrition recommendation yet. Complete your profile and generate a plan.</p>}
      </section>
    </AppLayout>
  );
}
