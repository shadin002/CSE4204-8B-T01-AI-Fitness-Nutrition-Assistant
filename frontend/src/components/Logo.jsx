import { Dumbbell } from 'lucide-react';

export default function Logo() {
  return (
    <div className="logo">
      <div className="logo-icon">
        <Dumbbell size={18} />
      </div>
      <div>
        <strong>FitGuide AI</strong>
        <span>Fitness & Nutrition Assistant</span>
      </div>
    </div>
  );
}
