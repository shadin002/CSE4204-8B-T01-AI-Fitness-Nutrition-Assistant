import { Sparkles } from 'lucide-react';

export default function RecommendationCard({ title, children, tone = 'green' }) {
  return (
    <div className={`recommendation-card tone-${tone}`}>
      <div className="recommendation-head">
        <Sparkles size={16} />
        <strong>{title}</strong>
      </div>
      <div>{children}</div>
    </div>
  );
}
