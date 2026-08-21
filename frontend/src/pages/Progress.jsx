import { useEffect, useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import AppLayout from '../components/AppLayout.jsx';
import Button from '../components/Button.jsx';
import Alert from '../components/Alert.jsx';
import RecommendationCard from '../components/RecommendationCard.jsx';
import api from '../services/api.js';
import { formatDate, toInputDate } from '../utils/formatDate.js';

const getDateTime = (record) => new Date(record?.date || record?.createdAt || 0).getTime();
const getCreatedTime = (record) => new Date(record?.createdAt || record?.date || 0).getTime();
const getObjectIdValue = (record) => String(record?._id || '');

const sortForHistory = (records = []) => [...records].sort((a, b) => getDateTime(b) - getDateTime(a) || getCreatedTime(b) - getCreatedTime(a) || getObjectIdValue(b).localeCompare(getObjectIdValue(a)));
const sortForChart = (records = []) => [...records].sort((a, b) => getDateTime(a) - getDateTime(b) || getCreatedTime(a) - getCreatedTime(b) || getObjectIdValue(a).localeCompare(getObjectIdValue(b)));
const emptyForm = () => ({ weight: '', date: toInputDate(), note: '' });

export default function Progress() {
  const [form, setForm] = useState(emptyForm());
  const [editingId, setEditingId] = useState(null);
  const [records, setRecords] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const loadProgress = async () => {
    const res = await api.get('/progress?limit=100');
    setRecords(res.data?.data?.records || []);
    setTotalRecords(res.data?.data?.count || 0);
  };

  const loadFeedback = async () => {
    try {
      const res = await api.get('/recommendations?type=progress&latest=true');
      setFeedback(res.data?.data?.recommendations?.[0] || null);
    } catch {
      setFeedback(null);
    }
  };

  useEffect(() => {
    loadProgress().catch((err) => setError(err.appMessage || 'Could not load progress history.'));
    loadFeedback();
  }, []);

  const historyRecords = useMemo(() => sortForHistory(records), [records]);
  const chartRecords = useMemo(() => sortForChart(records).slice(-6), [records]);
  const firstRecord = useMemo(() => sortForChart(records)[0] || null, [records]);
  const latestRecord = historyRecords[0] || null;
  const chartWeights = chartRecords.map((item) => Number(item.weight)).filter((value) => !Number.isNaN(value));
  const minWeight = chartWeights.length ? Math.min(...chartWeights) : 0;
  const maxWeight = chartWeights.length ? Math.max(...chartWeights) : 0;
  const weightRange = Math.max(maxWeight - minWeight, 1);
  const getBarHeight = (weight) => 42 + ((Number(weight) - minWeight) / weightRange) * 88;
  const totalChange = firstRecord && latestRecord ? (Number(latestRecord.weight) - Number(firstRecord.weight)).toFixed(1) : '0.0';

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm());
  };

  const saveProgress = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      setSaving(true);
      const payload = { weight: Number(form.weight), date: form.date, note: form.note };
      if (editingId) {
        await api.patch(`/progress/${editingId}`, payload);
        setMessage('Progress record updated successfully.');
      } else {
        await api.post('/progress', payload);
        setMessage('Progress saved successfully. Your current weight and BMI were updated.');
      }
      resetForm();
      await loadProgress();
      await loadFeedback();
    } catch (err) {
      setError(err.appMessage || 'Could not save progress.');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (record) => {
    setEditingId(record._id);
    setForm({ weight: String(record.weight), date: toInputDate(record.date), note: record.note || '' });
    setMessage('');
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const removeRecord = async (record) => {
    if (!window.confirm(`Delete the ${formatDate(record.date)} progress record?`)) return;
    try {
      setError('');
      setMessage('');
      await api.delete(`/progress/${record._id}`);
      if (editingId === record._id) resetForm();
      setMessage('Progress record deleted. Current weight and BMI were recalculated.');
      await loadProgress();
      await loadFeedback();
    } catch (err) {
      setError(err.appMessage || 'Could not delete progress record.');
    }
  };

  const getFeedback = async (force = false) => {
    setError('');
    setMessage('');
    try {
      setAiLoading(true);
      const res = await api.post(`/recommendations/progress${force ? '?force=true' : ''}`);
      setFeedback({ ...res.data?.data?.recommendation, isStale: false });
      setMessage(res.data?.data?.cached ? 'Your current AI feedback is already up to date.' : 'New AI progress feedback generated.');
    } catch (err) {
      setError(err.appMessage || 'AI progress feedback is not available yet.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="page-heading row-heading">
        <div><h1>Progress Tracking</h1><p>Track your weight history and keep your current profile data synchronized.</p></div>
        <Button loading={aiLoading} onClick={() => getFeedback(false)}><Sparkles size={16} /> Get AI Progress Feedback</Button>
      </div>

      <Alert type="success">{message}</Alert>
      <Alert type="error">{error}</Alert>
      {feedback?.isStale ? <Alert type="info">Your progress changed after this AI feedback was generated. Generate updated feedback.</Alert> : null}

      <section className="progress-grid">
        <form className="panel progress-form" onSubmit={saveProgress}>
          <h2>{editingId ? 'Edit Progress' : 'Add New Progress'}</h2>
          <label className="field"><span>Weight (kg)</span><input type="number" step="0.1" min="10" max="500" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} required /></label>
          <label className="field">
            <span>Date</span>
            <input type="date" value={form.date} max={toInputDate()} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            <small>Selected date: {formatDate(form.date)}. Future dates are not allowed.</small>
          </label>
          <label className="field"><span>Note</span><input value={form.note} maxLength={500} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Felt good after workout" /></label>
          <Button loading={saving} type="submit">{editingId ? 'Update Progress' : 'Save Progress'}</Button>
          {editingId ? <button type="button" className="secondary-action" onClick={resetForm}>Cancel editing</button> : null}
        </form>

        <div className="panel chart-panel">
          <h2>Weight Progress</h2>
          {chartRecords.length ? (
            <div className="chart-scroll"><div className="progress-bars">
              {chartRecords.map((item, index) => (
                <div key={item._id || index} className="progress-bar-item">
                  <strong>{item.weight} kg</strong>
                  <div className="progress-bar-track"><div title={`${item.weight} kg - ${formatDate(item.date)}`} className="progress-bar-fill" style={{ height: `${getBarHeight(item.weight)}px` }} /></div>
                  <small>{formatDate(item.date)}</small>
                </div>
              ))}
            </div></div>
          ) : <p className="empty-state">No progress data yet.</p>}

          <div className="summary-row">
            <div><strong>{totalChange} kg</strong><span>Total Change</span></div>
            <div><strong>{totalRecords}</strong><span>Record(s)</span></div>
            <div><strong>{firstRecord?.weight || '--'} kg</strong><span>Start Weight</span></div>
            <div><strong>{latestRecord?.weight || '--'} kg</strong><span>Current</span></div>
          </div>
        </div>

        <aside className="panel feedback-panel">
          <div className="feedback-title-row"><h2>AI Progress Feedback</h2>{feedback ? <button type="button" className="text-action" onClick={() => getFeedback(true)}>Regenerate</button> : null}</div>
          {feedback?.aiResponse ? (
            <>
              <RecommendationCard title="Short Analysis">{feedback.aiResponse.analysis}</RecommendationCard>
              <RecommendationCard title="Suggested Adjustment" tone="blue">{feedback.aiResponse.suggestedAdjustment}</RecommendationCard>
              <RecommendationCard title="Motivation" tone="purple">{feedback.aiResponse.motivation}</RecommendationCard>
            </>
          ) : <p className="empty-state">AI feedback will appear here after you request a progress analysis.</p>}
        </aside>
      </section>

      <section className="panel">
        <h2>Progress History</h2>
        {historyRecords.length ? (
          <div className="table-wrapper"><table className="clean-table full">
            <thead><tr><th>Date</th><th>Weight</th><th>Note</th><th>Action</th></tr></thead>
            <tbody>{historyRecords.map((record) => (
              <tr key={record._id}>
                <td>{formatDate(record.date)}</td><td>{record.weight} kg</td><td>{record.note || '-'}</td>
                <td><div className="action-group"><button type="button" className="text-action" onClick={() => startEdit(record)}>Edit</button><button type="button" className="text-action danger" onClick={() => removeRecord(record)}>Delete</button></div></td>
              </tr>
            ))}</tbody>
          </table></div>
        ) : <p className="empty-state">No progress history has been added yet.</p>}
      </section>
    </AppLayout>
  );
}
