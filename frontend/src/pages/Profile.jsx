import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import AppLayout from '../components/AppLayout.jsx';
import Button from '../components/Button.jsx';
import Alert from '../components/Alert.jsx';
import Loading from '../components/Loading.jsx';
import api from '../services/api.js';
import { labelText } from '../utils/formatDate.js';

const initialForm = {
  age: '',
  gender: 'male',
  height: '',
  weight: '',
  activityLevel: 'moderate',
  fitnessGoal: 'weight_loss',
  budgetPreference: 'low',
};

export default function Profile() {
  const [form, setForm] = useState(initialForm);
  const [profile, setProfile] = useState(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await api.get('/profile');
        const saved = res.data?.data?.profile;

        if (saved) {
          setProfile(saved);
          setHasProfile(true);

          setForm({
            age: saved.age || '',
            gender: saved.gender || 'male',
            height: saved.height || '',
            weight: saved.weight || '',
            activityLevel: saved.activityLevel || 'moderate',
            fitnessGoal: saved.fitnessGoal || 'weight_loss',
            budgetPreference: saved.budgetPreference || 'low',
          });
        }
      } catch {
        setHasProfile(false);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  const update = (field, value) => {
    setForm({
      ...form,
      [field]: value,
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    const payload = {
      ...form,
      age: Number(form.age),
      height: Number(form.height),
      weight: Number(form.weight),
    };

    try {
      setSaving(true);

      const res = hasProfile
        ? await api.put('/profile', payload)
        : await api.post('/profile', payload);

      const saved = res.data?.data?.profile;

      setProfile(saved);
      setHasProfile(true);
      setMessage(hasProfile ? 'Profile updated successfully.' : 'Profile created successfully.');
    } catch (err) {
      setError(err.appMessage || 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="page-heading">
        <h1>Fitness Profile</h1>
        <p>Keep your profile updated to get better recommendations.</p>
      </div>

      {loading ? <Loading /> : null}

      <Alert type="success">{message}</Alert>
      <Alert type="error">{error}</Alert>

      <div className="profile-layout">
        <form className="panel profile-form" onSubmit={handleSave}>
          <div className="form-grid three">
            <label className="field">
              <span>Age</span>
              <input
                type="number"
                value={form.age}
                onChange={(e) => update('age', e.target.value)}
                required
                min={10}
                max={120}
              />
            </label>

            <label className="field">
              <span>Gender</span>
              <select
                value={form.gender}
                onChange={(e) => update('gender', e.target.value)}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </label>

            <label className="field">
              <span>Height</span>
              <input
                type="number"
                value={form.height}
                onChange={(e) => update('height', e.target.value)}
                placeholder="172 cm"
                required
              />
            </label>

            <label className="field">
              <span>Weight</span>
              <input
                type="number"
                value={form.weight}
                onChange={(e) => update('weight', e.target.value)}
                placeholder="68 kg"
                required
              />
            </label>
          </div>

          <ChoiceGroup
            label="Activity Level"
            value={form.activityLevel}
            options={[
              ['low', 'Low'],
              ['moderate', 'Moderate'],
              ['high', 'High'],
            ]}
            onChange={(v) => update('activityLevel', v)}
          />

          <ChoiceGroup
            label="Fitness Goal"
            value={form.fitnessGoal}
            options={[
              ['weight_loss', 'Weight Loss'],
              ['muscle_gain', 'Muscle Gain'],
              ['general_fitness', 'General Fitness'],
            ]}
            onChange={(v) => update('fitnessGoal', v)}
          />

          <ChoiceGroup
            label="Budget Preference"
            value={form.budgetPreference}
            options={[
              ['low', 'Low'],
              ['medium', 'Medium'],
              ['high', 'High'],
            ]}
            onChange={(v) => update('budgetPreference', v)}
          />

          <div className="align-end">
            <Button loading={saving} type="submit">
              {hasProfile ? '✓ Update Profile' : '✓ Save Profile'}
            </Button>
          </div>
        </form>

        <aside className="bmi-card">
          <h2>Your BMI Summary</h2>

          <div className="bmi-number">
            <Heart size={28} />

            <div>
              <strong>{profile?.bmi || '--'}</strong>
              <span>{labelText(profile?.bmiCategory || 'Not calculated')}</span>
            </div>
          </div>

          <div className="bmi-rows">
            <p>
              <span>Weight</span>
              <strong>{profile?.weight || form.weight || '--'} kg</strong>
            </p>

            <p>
              <span>Height</span>
              <strong>{profile?.height || form.height || '--'} cm</strong>
            </p>

            <p>
              <span>Category</span>
              <strong>{labelText(profile?.bmiCategory || 'N/A')}</strong>
            </p>
          </div>

          <p className="note-box">
            BMI is a general indicator and may not reflect all body conditions.
          </p>
        </aside>
      </div>
    </AppLayout>
  );
}

function ChoiceGroup({ label, value, options, onChange }) {
  return (
    <div className="choice-block">
      <strong>{label}</strong>

      <div className="choice-row">
        {options.map(([val, text]) => (
          <button
            key={val}
            type="button"
            className={value === val ? 'selected' : ''}
            onClick={() => onChange(val)}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}