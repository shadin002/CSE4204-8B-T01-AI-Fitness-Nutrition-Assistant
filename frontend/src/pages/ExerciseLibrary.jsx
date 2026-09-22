import { useEffect, useMemo, useState } from 'react';
import AppLayout from '../components/AppLayout.jsx';
import ExerciseCard from '../components/ExerciseCard.jsx';
import Alert from '../components/Alert.jsx';
import Loading from '../components/Loading.jsx';
import api from '../services/api.js';

export default function ExerciseLibrary() {
  const [exercises, setExercises] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeDifficulty, setActiveDifficulty] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [exerciseRes, categoryRes] = await Promise.all([
          api.get('/exercises'),
          api.get('/categories')
        ]);
        setExercises(exerciseRes.data?.data?.exercises || []);
        setCategories(categoryRes.data?.data?.categories || []);
      } catch (err) {
        setError(err.appMessage);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

 const filtered = useMemo(() => {
  return exercises.filter((exercise) => {
    const nameMatch = exercise.name
      .toLowerCase()
      .includes(search.toLowerCase());

    const categoryMatch =
      activeCategory === 'all' ||
      exercise.categoryId?._id === activeCategory ||
      exercise.categoryId === activeCategory;

    const difficultyMatch =
      activeDifficulty === 'all' ||
      exercise.difficulty?.toLowerCase() === activeDifficulty;

    return nameMatch && categoryMatch && difficultyMatch;
  });
}, [exercises, search, activeCategory, activeDifficulty]);

  return (
    <AppLayout>
      <div className="library-head">
        <div>
          <h1>Exercise Library</h1>
          <p>Browse guided exercises with clear instructions.</p>
        </div>
        <input className="search-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search exercises..." />
      </div>

      <Alert type="error">{error}</Alert>
      {loading ? <Loading /> : null}

      <div className="filter-row">
        <button className={activeCategory === 'all' ? 'selected' : ''} onClick={() => setActiveCategory('all')}>All Exercises</button>
        {categories.map((category) => (
          <button key={category._id} className={activeCategory === category._id ? 'selected' : ''} onClick={() => setActiveCategory(category._id)}>
            {category.categoryName}
          </button>
        ))}
      </div>

      <div className="filter-row">
        <button className={activeDifficulty === 'all' ? 'selected' : ''} onClick={() => setActiveDifficulty('all')}
  >
    All Levels
         </button>

        <button className={activeDifficulty === 'beginner' ? 'selected' : ''} onClick={() => setActiveDifficulty('beginner')}
  >
    Beginner
         </button>

        <button className={activeDifficulty === 'intermediate' ? 'selected' : ''} onClick={() => setActiveDifficulty('intermediate')}
>
    Intermediate
         </button>

        <button className={activeDifficulty === 'advanced' ? 'selected' : ''} onClick={() => setActiveDifficulty('advanced')}
  >
    Advanced
         </button>
      </div>

      <section className="exercise-grid">
        {filtered.map((exercise) => <ExerciseCard key={exercise._id} exercise={exercise} />)}
      </section>

      {!loading && filtered.length === 0 ? <p className="empty-state">No exercises found.</p> : null}
    </AppLayout>
  );
}
