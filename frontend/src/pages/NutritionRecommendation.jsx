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

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await api.get('/recommendations?type=nutrition');
        const items = res.data?.data?.recommendations || [];
        if (items[0]) setRecommendation(items[0]);
      } catch {
        // AI module may not be merged before Week 8.
      }
    }
    loadHistory();
  }, []);

  const generate = async () => {
    setError('');
    try {
      setLoading(true);
      const res = await api.post('/recommendations/nutrition');
      setRecommendation(res.data?.data?.recommendation);
    } catch (err) {
      setError(err.appMessage || 'Nutrition recommendation is not available yet.');
    } finally {
      setLoading(false);
    }
  };

  const plan = recommendation?.aiResponse;

  return (
    <AppLayout>
      <div className="page-heading">
        <h1>Nutrition Recommendation</h1>
        <p>Budget-friendly diet suggestions using local Bangladeshi foods.</p>
      </div>

      <div className="info-banner">
        <Info size={18} />
        We use saved profile, goal, and budget to generate an AI-assisted nutrition plan.
      </div>

      <div className="action-line">
        <Button loading={loading} onClick={generate}><Circle size={16} /> Generate Diet Plan</Button>
      </div>

      <Alert type="error">{error}</Alert>

      <section className="panel nutrition-panel">
        <h2>AI Nutrition Plan <span className="badge">Simple Plan</span></h2>
        {plan ? (
          <>
            <div className="meal-grid">
              {plan.dietPlan?.map((meal, index) => (
                <article key={index} className="meal-card">
                  <Circle size={15} />
                  <strong>{meal.meal}</strong>
                  <p>{meal.suggestions?.join(' + ')}</p>
                </article>
              ))}
            </div>

            <div className="two-column">
              <RecommendationCard title="Local Bangladeshi Food Ideas">
                <ul className="check-list">
                  {(plan.dietPlan || []).flatMap((meal) => meal.suggestions || []).slice(0, 6).map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </RecommendationCard>
              <RecommendationCard title="Budget-Friendly Explanation">
                {plan.budgetExplanation}
              </RecommendationCard>
            </div>
            <div className="two-column">
              <RecommendationCard title="Safety Note" tone="yellow">{plan.safetyNote}</RecommendationCard>
              <RecommendationCard title="Motivation" tone="purple">{plan.motivation}</RecommendationCard>
            </div>
          </>
        ) : (
          <p className="empty-state">No nutrition recommendation yet. Generate one after the Week 8 AI backend is connected.</p>
        )}
      </section>
    </AppLayout>
  );
}
