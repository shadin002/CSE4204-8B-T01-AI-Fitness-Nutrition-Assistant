import { useEffect, useState } from 'react';
import { Activity, CheckCircle, Dumbbell, Grid2X2 } from 'lucide-react';
import AppLayout from '../components/AppLayout.jsx';
import StatCard from '../components/StatCard.jsx';
import Button from '../components/Button.jsx';
import Alert from '../components/Alert.jsx';
import api from '../services/api.js';
import { labelText } from '../utils/formatDate.js';

const emptyExercise = {
  name: '',
  categoryId: '',
  description: '',
  targetBodyPart: '',
  difficulty: 'beginner',
  videoUrl: ''
};

const emptyCategory = {
  categoryName: '',
  description: ''
};

export default function AdminDashboard() {
  const [categories, setCategories] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [categoryForm, setCategoryForm] = useState(emptyCategory);
  const [exerciseForm, setExerciseForm] = useState(emptyExercise);
  const [showExerciseForm, setShowExerciseForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingExerciseId, setEditingExerciseId] = useState(null);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);
  const [savingExercise, setSavingExercise] = useState(false);

  const loadData = async () => {
    const [categoryRes, exerciseRes] = await Promise.all([
      api.get('/categories'),
      api.get('/exercises')
    ]);

    const loadedCategories = categoryRes.data?.data?.categories || [];
    const loadedExercises = exerciseRes.data?.data?.exercises || [];

    setCategories(loadedCategories);
    setExercises(loadedExercises);

    if (!exerciseForm.categoryId && loadedCategories[0]?._id) {
      setExerciseForm((prev) => ({ ...prev, categoryId: loadedCategories[0]._id }));
    }
  };

  useEffect(() => {
    loadData().catch((err) => setError(err.appMessage || 'Failed to load admin data.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetCategoryForm = () => {
    setCategoryForm(emptyCategory);
    setEditingCategoryId(null);
    setShowCategoryForm(false);
  };

  const resetExerciseForm = () => {
    setExerciseForm({ ...emptyExercise, categoryId: categories[0]?._id || '' });
    setEditingExerciseId(null);
    setShowExerciseForm(false);
  };

  const startEditCategory = (category) => {
    setError('');
    setMessage('');
    setEditingCategoryId(category._id);
    setCategoryForm({
      categoryName: category.categoryName || '',
      description: category.description || ''
    });
    setShowCategoryForm(true);
  };

  const startEditExercise = (exercise) => {
    setError('');
    setMessage('');
    setEditingExerciseId(exercise._id);
    setExerciseForm({
      name: exercise.name || '',
      categoryId: exercise.categoryId?._id || exercise.categoryId || '',
      description: exercise.description || '',
      targetBodyPart: exercise.targetBodyPart || '',
      difficulty: exercise.difficulty || 'beginner',
      videoUrl: exercise.videoUrl || ''
    });
    setShowExerciseForm(true);
  };

  const saveCategory = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      setSavingCategory(true);

      if (editingCategoryId) {
        await api.put(`/categories/${editingCategoryId}`, categoryForm);
        setMessage('Category updated successfully.');
      } else {
        await api.post('/categories', categoryForm);
        setMessage('Category added successfully.');
      }

      resetCategoryForm();
      await loadData();
    } catch (err) {
      setError(err.appMessage || 'Category save failed.');
    } finally {
      setSavingCategory(false);
    }
  };

  const saveExercise = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      setSavingExercise(true);

      if (editingExerciseId) {
        await api.put(`/exercises/${editingExerciseId}`, exerciseForm);
        setMessage('Exercise updated successfully.');
      } else {
        await api.post('/exercises', exerciseForm);
        setMessage('Exercise added successfully.');
      }

      resetExerciseForm();
      await loadData();
    } catch (err) {
      setError(err.appMessage || 'Exercise save failed.');
    } finally {
      setSavingExercise(false);
    }
  };

  const deleteExercise = async (id) => {
    if (!confirm('Delete this exercise?')) return;

    try {
      setError('');
      setMessage('');
      await api.delete(`/exercises/${id}`);
      setMessage('Exercise deleted successfully.');
      await loadData();
    } catch (err) {
      setError(err.appMessage || 'Exercise delete failed.');
    }
  };

  const deleteCategory = async (id) => {
    if (!confirm('Delete this category?')) return;

    try {
      setError('');
      setMessage('');
      await api.delete(`/categories/${id}`);
      setMessage('Category deleted successfully.');
      await loadData();
    } catch (err) {
      setError(err.appMessage || 'Category delete failed.');
    }
  };

  return (
    <AppLayout admin>
      <div className="page-heading">
        <h1>Admin Dashboard</h1>
        <p>Manage exercise content and categories.</p>
      </div>

      <Alert type="success">{message}</Alert>
      <Alert type="error">{error}</Alert>

      <section className="stats-grid">
        <StatCard icon={<Dumbbell size={18} />} label="Total Exercises" value={exercises.length} />
        <StatCard icon={<Grid2X2 size={18} />} label="Total Categories" value={categories.length} />
        <StatCard icon={<Activity size={18} />} label="Recent Updates" value={Math.min(exercises.length, 8)} />
        <StatCard icon={<CheckCircle size={18} />} label="System Status" value="Ready" />
      </section>

      <section className="admin-grid">
        <div className="panel">
          <div className="admin-panel-head">
            <div>
              <h2>Manage Exercises</h2>
              <p>Add, update, or remove exercises from the library.</p>
            </div>
            <Button
              type="button"
              onClick={() => {
                if (showExerciseForm) resetExerciseForm();
                else setShowExerciseForm(true);
              }}
            >
              {showExerciseForm ? 'Close' : '+ Add Exercise'}
            </Button>
          </div>

          {showExerciseForm ? (
            <form className="admin-inline-form exercise" onSubmit={saveExercise}>
              <input
                placeholder="Exercise name"
                value={exerciseForm.name}
                onChange={(e) => setExerciseForm({ ...exerciseForm, name: e.target.value })}
                required
              />
              <select
                value={exerciseForm.categoryId}
                onChange={(e) => setExerciseForm({ ...exerciseForm, categoryId: e.target.value })}
                required
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>{category.categoryName}</option>
                ))}
              </select>
              <select
                value={exerciseForm.difficulty}
                onChange={(e) => setExerciseForm({ ...exerciseForm, difficulty: e.target.value })}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
              <input
                placeholder="Target body part"
                value={exerciseForm.targetBodyPart}
                onChange={(e) => setExerciseForm({ ...exerciseForm, targetBodyPart: e.target.value })}
              />
              <input
                placeholder="Video URL"
                value={exerciseForm.videoUrl}
                onChange={(e) => setExerciseForm({ ...exerciseForm, videoUrl: e.target.value })}
              />
              <Button loading={savingExercise} type="submit">
                {editingExerciseId ? 'Update Exercise' : 'Save Exercise'}
              </Button>
              <textarea
                className="full-row"
                placeholder="Short description"
                value={exerciseForm.description}
                onChange={(e) => setExerciseForm({ ...exerciseForm, description: e.target.value })}
              />
              {editingExerciseId ? (
                <button type="button" className="secondary-action full-row" onClick={resetExerciseForm}>
                  Cancel editing
                </button>
              ) : null}
            </form>
          ) : null}

          <div className="table-wrapper">
            <table className="clean-table full">
              <thead><tr><th>Name</th><th>Category</th><th>Level</th><th>Action</th></tr></thead>
              <tbody>
                {exercises.map((exercise) => (
                  <tr key={exercise._id}>
                    <td>{exercise.name}</td>
                    <td>{exercise.categoryId?.categoryName || '-'}</td>
                    <td>{labelText(exercise.difficulty)}</td>
                    <td>
                      <div className="action-group">
                        <button className="text-action" type="button" onClick={() => startEditExercise(exercise)}>Edit</button>
                        <button className="text-action danger" type="button" onClick={() => deleteExercise(exercise._id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!exercises.length ? <tr><td colSpan="4">No exercises added yet.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <div className="admin-panel-head">
            <div>
              <h2>Manage Categories</h2>
              <p>Add, update, or remove exercise categories.</p>
            </div>
            <Button
              type="button"
              onClick={() => {
                if (showCategoryForm) resetCategoryForm();
                else setShowCategoryForm(true);
              }}
            >
              {showCategoryForm ? 'Close' : '+ Add Category'}
            </Button>
          </div>

          {showCategoryForm ? (
            <form className="admin-inline-form compact" onSubmit={saveCategory}>
              <input
                placeholder="Category name"
                value={categoryForm.categoryName}
                onChange={(e) => setCategoryForm({ ...categoryForm, categoryName: e.target.value })}
                required
              />
              <input
                placeholder="Description"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
              />
              <Button loading={savingCategory} type="submit">
                {editingCategoryId ? 'Update' : 'Save'}
              </Button>
              {editingCategoryId ? (
                <button type="button" className="secondary-action full-row" onClick={resetCategoryForm}>
                  Cancel editing
                </button>
              ) : null}
            </form>
          ) : null}

          <div className="table-wrapper">
            <table className="clean-table full">
              <thead><tr><th>Category</th><th>Description</th><th>Action</th></tr></thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category._id}>
                    <td>{category.categoryName}</td>
                    <td>{category.description || '-'}</td>
                    <td>
                      <div className="action-group">
                        <button className="text-action" type="button" onClick={() => startEditCategory(category)}>Edit</button>
                        <button className="text-action danger" type="button" onClick={() => deleteCategory(category._id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!categories.length ? <tr><td colSpan="3">No categories added yet.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
