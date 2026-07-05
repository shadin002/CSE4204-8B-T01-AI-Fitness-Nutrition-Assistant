import { useEffect, useMemo, useState } from 'react';
import { Activity, Circle, Target, User, Weight, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout.jsx';
import StatCard from '../components/StatCard.jsx';
import Loading from '../components/Loading.jsx';
import Alert from '../components/Alert.jsx';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { labelText } from '../utils/formatDate.js';

const getDateTime = (record) => {
  return new Date(record?.date || record?.createdAt || 0).getTime();
};

const getCreatedTime = (record) => {
  return new Date(record?.createdAt || record?.date || 0).getTime();
};

const sortProgressForChart = (records = []) => {
  return [...records].sort((a, b) => {
    const dateDiff = getDateTime(a) - getDateTime(b);

    if (dateDiff !== 0) {
      return dateDiff;
    }

    const createdDiff = getCreatedTime(a) - getCreatedTime(b);

    if (createdDiff !== 0) {
      return createdDiff;
    }

    return String(a?._id || '').localeCompare(String(b?._id || ''));
  });
};

const sortProgressLatestFirst = (records = []) => {
  return [...records].sort((a, b) => {
    const dateDiff = getDateTime(b) - getDateTime(a);

    if (dateDiff !== 0) {
      return dateDiff;
    }

    const createdDiff = getCreatedTime(b) - getCreatedTime(a);

    if (createdDiff !== 0) {
      return createdDiff;
    }

    return String(b?._id || '').localeCompare(String(a?._id || ''));
  });
};

export default function Dashboard() {
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [progress, setProgress] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [profileRes, progressRes, recommendationRes] = await Promise.allSettled([
          api.get('/profile'),
          api.get('/progress'),
          api.get('/recommendations'),
        ]);

        if (profileRes.status === 'fulfilled') {
          setProfile(profileRes.value.data?.data?.profile || null);
        }

        if (progressRes.status === 'fulfilled') {
          setProgress(progressRes.value.data?.data?.records || []);
        }

        if (recommendationRes.status === 'fulfilled') {
          setRecommendations(recommendationRes.value.data?.data?.recommendations || []);
        }
      } catch {
        setNotice('Some dashboard data could not be loaded.');
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const latestProgress = useMemo(() => {
    return sortProgressLatestFirst(progress)[0] || null;
  }, [progress]);

  const sortedProgress = useMemo(() => {
    return sortProgressForChart(progress);
  }, [progress]);

  const chartProgress = useMemo(() => {
    return sortedProgress.slice(-6);
  }, [sortedProgress]);

  const latestWeight = latestProgress?.weight || profile?.weight || 'N/A';
  const latestRecommendation = recommendations[0];

  const chartWeights = chartProgress
    .map((item) => Number(item.weight))
    .filter((value) => !Number.isNaN(value));

  const minWeight = chartWeights.length ? Math.min(...chartWeights) : 0;
  const maxWeight = chartWeights.length ? Math.max(...chartWeights) : 0;
  const weightRange = Math.max(maxWeight - minWeight, 1);

  const getMiniChartHeight = (weight) => {
    const numericWeight = Number(weight);
    return 28 + ((numericWeight - minWeight) / weightRange) * 50;
  };

  return (
    <AppLayout>
      <div className="page-heading">
        <h1>Welcome back, {user?.name || 'User'}!</h1>
        <p>You are one step closer to your best self today.</p>
      </div>

      <Alert>{notice}</Alert>

      {loading ? <Loading /> : null}

      <section className="stats-grid">
        <StatCard
          icon={<User size={18} />}
          label="Profile Summary"
          value={profile ? `${labelText(profile.bmiCategory)} - Age ${profile.age}` : 'Not created'}
          helper={profile ? `Height ${profile.height} cm · ${profile.weight} kg` : 'Complete profile first'}
        />

        <StatCard
          icon={<Activity size={18} />}
          label="BMI"
          value={profile?.bmi || 'N/A'}
          helper={profile ? labelText(profile.bmiCategory) : 'No profile'}
        />

        <StatCard
          icon={<Weight size={18} />}
          label="Current Weight"
          value={`${latestWeight} ${latestWeight !== 'N/A' ? 'kg' : ''}`}
          helper={progress.length ? `${progress.length} record(s) saved` : 'No progress yet'}
        />

        <StatCard
          icon={<Target size={18} />}
          label="Fitness Goal"
          value={labelText(profile?.fitnessGoal || 'Set Profile')}
          helper={profile ? `Budget: ${labelText(profile.budgetPreference)}` : 'Target goal missing'}
        />
      </section>

      <section className="dashboard-grid">
        <div className="panel progress-panel">
          <div className="panel-head">
            <div>
              <h2>Progress Overview</h2>
              <p>Weight progress</p>
            </div>
            <span>Latest Records</span>
          </div>

          <strong className="big-number">{progress.length || 0}</strong>
          <small>Saved records</small>

          <div className="mini-chart">
            {chartProgress.map((item, index) => (
              <span
                key={item._id || index}
                style={{ height: `${getMiniChartHeight(item.weight)}px` }}
                title={`${item.weight} kg`}
              />
            ))}

            {!chartProgress.length ? <p>No progress data yet.</p> : null}
          </div>
        </div>

        <div className="panel ai-panel">
          <h2>Latest AI Recommendation</h2>

          {latestRecommendation ? (
            <div className="ai-message">
              <Zap size={18} />
              <p>
                {latestRecommendation.type === 'workout' &&
                  latestRecommendation.aiResponse?.weeklyFrequency}

                {latestRecommendation.type === 'nutrition' &&
                  latestRecommendation.aiResponse?.budgetExplanation}

                {latestRecommendation.type === 'progress' &&
                  latestRecommendation.aiResponse?.analysis}
              </p>
            </div>
          ) : (
            <div className="ai-message">
              <Zap size={18} />
              <p>AI recommendations will appear here after Week 8 integration.</p>
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="section-title">Quick Actions</h2>

        <div className="quick-grid">
          <Link to="/workout" className="quick-card">
            <Zap size={16} />
            Generate Workout Plan
            <span>›</span>
          </Link>

          <Link to="/nutrition" className="quick-card">
            <Circle size={16} />
            Generate Diet Plan
            <span>›</span>
          </Link>

          <Link to="/progress" className="quick-card">
            <Activity size={16} />
            Track Progress
            <span>›</span>
          </Link>

          <Link to="/exercises" className="quick-card">
            <User size={16} />
            View Exercise Library
            <span>›</span>
          </Link>
        </div>
      </section>
    </AppLayout>
  );
}