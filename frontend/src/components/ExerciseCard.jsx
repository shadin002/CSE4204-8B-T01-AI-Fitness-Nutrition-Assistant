import { Play } from 'lucide-react';
import { labelText } from '../utils/formatDate';

export default function ExerciseCard({ exercise }) {
  const categoryName = exercise?.categoryId?.categoryName || exercise?.categoryName || 'General';

  return (
    <article className="exercise-card">
      <div className="exercise-media">
        {exercise.videoUrl ? (
          <a href={exercise.videoUrl} target="_blank" rel="noreferrer" aria-label="Open exercise video">
            <Play size={22} />
          </a>
        ) : (
          <Play size={22} />
        )}
      </div>
      <div className="exercise-body">
        <h3>{exercise.name}</h3>
        <div className="chip-row">
          <span className="tiny-chip">{categoryName}</span>
          <span className="tiny-chip green">{labelText(exercise.difficulty)}</span>
        </div>
        <p>{exercise.description || 'Simple exercise guidance with clear instructions.'}</p>
      </div>
    </article>
  );
}
