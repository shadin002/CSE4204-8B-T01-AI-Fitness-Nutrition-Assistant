import { useEffect, useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import AppLayout from '../components/AppLayout.jsx';
import Button from '../components/Button.jsx';
import Alert from '../components/Alert.jsx';
import RecommendationCard from '../components/RecommendationCard.jsx';
import api from '../services/api.js';
import { formatDate, toInputDate } from '../utils/formatDate.js';

const getDateTime = (record) => {
  return new Date(record?.date || record?.createdAt || 0).getTime();
};

const getCreatedTime = (record) => {
  return new Date(record?.createdAt || record?.date || 0).getTime();
};

const getObjectIdValue = (record) => {
  return String(record?._id || '');
};

const sortForHistory = (records = []) => {
  return [...records].sort((a, b) => {
    const dateDiff = getDateTime(b) - getDateTime(a);

    if (dateDiff !== 0) {
      return dateDiff;
    }

    const createdDiff = getCreatedTime(b) - getCreatedTime(a);

    if (createdDiff !== 0) {
      return createdDiff;
    }

    return getObjectIdValue(b).localeCompare(getObjectIdValue(a));
  });
};

const sortForChart = (records = []) => {
  return [...records].sort((a, b) => {
    const dateDiff = getDateTime(a) - getDateTime(b);

    if (dateDiff !== 0) {
      return dateDiff;
    }

    const createdDiff = getCreatedTime(a) - getCreatedTime(b);

    if (createdDiff !== 0) {
      return createdDiff;
    }

    return getObjectIdValue(a).localeCompare(getObjectIdValue(b));
  });
};

export default function Progress() {
  const [form, setForm] = useState({
    weight: '',
    date: toInputDate(),
    note: '',
  });

  const [records, setRecords] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const loadProgress = async () => {
    const res = await api.get('/progress');
    const progressRecords = res.data?.data?.records || [];
    setRecords(progressRecords);
  };

  useEffect(() => {
    loadProgress().catch(() => setError('Could not load progress history.'));

    api
      .get('/recommendations?type=progress')
      .then((res) => setFeedback(res.data?.data?.recommendations?.[0] || null))
      .catch(() => {});
  }, []);

  const historyRecords = useMemo(() => {
    return sortForHistory(records);
  }, [records]);

  const chartRecords = useMemo(() => {
    return sortForChart(records).slice(-6);
  }, [records]);

  const firstRecord = useMemo(() => {
    return sortForChart(records)[0] || null;
  }, [records]);

  const latestRecord = historyRecords[0] || null;

  const chartWeights = chartRecords
    .map((item) => Number(item.weight))
    .filter((value) => !Number.isNaN(value));

  const minWeight = chartWeights.length ? Math.min(...chartWeights) : 0;
  const maxWeight = chartWeights.length ? Math.max(...chartWeights) : 0;
  const weightRange = Math.max(maxWeight - minWeight, 1);

  const getBarHeight = (weight) => {
    const numericWeight = Number(weight);
    return 42 + ((numericWeight - minWeight) / weightRange) * 88;
  };

  const totalChange =
    firstRecord && latestRecord
      ? (Number(latestRecord.weight) - Number(firstRecord.weight)).toFixed(1)
      : '0.0';

  const saveProgress = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      setSaving(true);

      await api.post('/progress', {
        weight: Number(form.weight),
        date: form.date,
        note: form.note,
      });

      setMessage('Progress saved successfully.');

      setForm({
        weight: '',
        date: toInputDate(),
        note: '',
      });

      await loadProgress();
    } catch (err) {
      setError(err.appMessage || 'Could not save progress.');
    } finally {
      setSaving(false);
    }
  };

  const getFeedback = async () => {
    setError('');

    try {
      setAiLoading(true);
      const res = await api.post('/recommendations/progress');
      setFeedback(res.data?.data?.recommendation);
    } catch (err) {
      setError(err.appMessage || 'AI progress feedback is not available yet.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="page-heading row-heading">
        <div>
          <h1>Progress Tracking</h1>
          <p>Track your journey and receive AI-assisted feedback.</p>
        </div>

        <Button loading={aiLoading} onClick={getFeedback}>
          <Sparkles size={16} />
          Get AI Progress Feedback
        </Button>
      </div>

      <Alert type="success">{message}</Alert>
      <Alert type="error">{error}</Alert>

      <section className="progress-grid">
        <form className="panel progress-form" onSubmit={saveProgress}>
          <h2>Add New Progress</h2>

          <label className="field">
            <span>Current Weight (kg)</span>
            <input
              type="number"
              step="0.1"
              min="1"
              value={form.weight}
              onChange={(e) => setForm({ ...form, weight: e.target.value })}
              required
            />
          </label>

          <label className="field">
            <span>Date</span>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
            />
            <small>Selected date: {formatDate(form.date)}. Use the calendar icon to avoid date-format confusion.</small>
          </label>

          <label className="field">
            <span>Note</span>
            <input
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="Felt good after workout"
            />
          </label>

          <Button loading={saving} type="submit">
            Save Progress
          </Button>
        </form>

        <div className="panel chart-panel">
          <h2>Weight Progress</h2>

          {chartRecords.length ? (
            <div
              style={{
                width: '100%',
                marginTop: '22px',
                overflowX: 'auto',
              }}
            >
              <div
                style={{
                  minHeight: '185px',
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: '26px',
                  padding: '22px 8px 18px',
                  borderBottom: '2px solid #ccebe5',
                }}
              >
                {chartRecords.map((item, index) => {
                  const height = getBarHeight(item.weight);

                  return (
                    <div
                      key={item._id || index}
                      style={{
                        minWidth: '62px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: 800,
                          color: '#102033',
                          marginBottom: '8px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.weight} kg
                      </div>

                      <div
                        style={{
                          height: '132px',
                          width: '32px',
                          display: 'flex',
                          alignItems: 'flex-end',
                          justifyContent: 'center',
                        }}
                      >
                        <div
                          title={`${item.weight} kg - ${formatDate(item.date)}`}
                          style={{
                            width: '26px',
                            height: `${height}px`,
                            minHeight: '18px',
                            background: '#19b89c',
                            borderRadius: '999px 999px 0 0',
                            boxShadow: '0 10px 20px rgba(25, 184, 156, 0.22)',
                            transition: 'height 0.25s ease',
                          }}
                        />
                      </div>

                      <div
                        style={{
                          marginTop: '9px',
                          fontSize: '11px',
                          color: '#6e7e8e',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {formatDate(item.date)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="empty-state">No progress data yet.</p>
          )}

          <div className="summary-row">
            <div>
              <strong>{totalChange} kg</strong>
              <span>Total Change</span>
            </div>

            <div>
              <strong>{records.length}</strong>
              <span>Record(s)</span>
            </div>

            <div>
              <strong>{firstRecord?.weight || '--'} kg</strong>
              <span>Start Weight</span>
            </div>

            <div>
              <strong>{latestRecord?.weight || '--'} kg</strong>
              <span>Current</span>
            </div>
          </div>
        </div>

        <aside className="panel feedback-panel">
          <h2>AI Progress Feedback</h2>

          {feedback?.aiResponse ? (
            <>
              <RecommendationCard title="Short Analysis">
                {feedback.aiResponse.analysis}
              </RecommendationCard>

              <RecommendationCard title="Suggested Adjustment" tone="blue">
                {feedback.aiResponse.suggestedAdjustment}
              </RecommendationCard>

              <RecommendationCard title="Motivation" tone="purple">
                {feedback.aiResponse.motivation}
              </RecommendationCard>
            </>
          ) : (
            <p className="empty-state">
              AI feedback will appear here after you request a progress analysis.
            </p>
          )}
        </aside>
      </section>

      <section className="panel">
        <h2>Progress History</h2>

        {historyRecords.length ? (
          <div className="table-wrapper">
            <table className="clean-table full">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Weight</th>
                  <th>Note</th>
                </tr>
              </thead>

              <tbody>
                {historyRecords.map((record) => (
                  <tr key={record._id}>
                    <td>{formatDate(record.date)}</td>
                    <td>{record.weight} kg</td>
                    <td>{record.note || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty-state">No progress history has been added yet.</p>
        )}
      </section>
    </AppLayout>
  );
}