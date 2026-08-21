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
  trainingExperience: 'beginner',
  equipmentAccess: 'bodyweight',
  dietaryPreference: 'no_preference',
  foodAllergies: '',
  movementLimitations: '',
};

export default function Profile() {
  const [form, setForm] = useState(initialForm);
  const [profile, setProfile] = useState(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');


  const applySavedProfile = (saved) => {
    if (!saved) return;
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
      trainingExperience: saved.trainingExperience || 'beginner',
      equipmentAccess: saved.equipmentAccess || 'bodyweight',
      dietaryPreference: saved.dietaryPreference || 'no_preference',
      foodAllergies: saved.foodAllergies || '',
      movementLimitations: saved.movementLimitations || '',
    });
  };

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await api.get('/profile');
        const saved = res.data?.data?.profile;
        if (saved) applySavedProfile(saved);
      } catch (err) {
        if (err?.response?.status === 404) {
          setHasProfile(false);
        } else {
          setError(err.appMessage || 'Could not load your fitness profile.');
        }
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    const payload = {
      age: Number(form.age),
      gender: form.gender,
      height: Number(form.height),
      activityLevel: form.activityLevel,
      fitnessGoal: form.fitnessGoal,
      budgetPreference: form.budgetPreference,
      trainingExperience: form.trainingExperience,
      equipmentAccess: form.equipmentAccess,
      dietaryPreference: form.dietaryPreference,
      foodAllergies: form.foodAllergies,
      movementLimitations: form.movementLimitations,
    };

    if (!hasProfile) payload.weight = Number(form.weight);

    try {
      setSaving(true);
      const res = hasProfile ? await api.put('/profile', payload) : await api.post('/profile', payload);
      const saved = res.data?.data?.profile;
      applySavedProfile(saved);
      setMessage(hasProfile ? 'Profile updated successfully.' : 'Profile created successfully.');
    } catch (err) {
      if (!hasProfile && err?.response?.status === 409) {
        try {
          const existingRes = await api.get('/profile');
          const existing = existingRes.data?.data?.profile;
          if (existing) {
            applySavedProfile(existing);
            setError('An existing profile was found. Update the fields below and click Update Profile.');
            return;
          }
        } catch {
          // Fall through to the original API error if the existing profile cannot be loaded.
        }
      }
      setError(err.appMessage || 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="page-heading">
        <h1>Fitness Profile</h1>
        <p>Keep the information used by your workout and nutrition recommendations up to date.</p>
      </div>

      {loading ? <Loading /> : null}
      <Alert type="success">{message}</Alert>
      <Alert type="error">{error}</Alert>

      {!loading ? (
        <div className="profile-layout">
          <form className="panel profile-form" onSubmit={handleSave}>
            <div className="form-grid three">
              <label className="field">
                <span>Age</span>
                <input type="number" value={form.age} onChange={(e) => update('age', e.target.value)} required min={18} max={120} />
                <small>FitGuide AI currently supports adult users aged 18 and above.</small>
              </label>

              <label className="field">
                <span>Gender</span>
                <select value={form.gender} onChange={(e) => update('gender', e.target.value)}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </label>

              <label className="field">
                <span>Height (cm)</span>
                <input type="number" value={form.height} onChange={(e) => update('height', e.target.value)} required min={50} max={300} />
              </label>

              <label className="field">
                <span>{hasProfile ? 'Current Weight (kg)' : 'Starting Weight (kg)'}</span>
                <input
                  type="number"
                  step="0.1"
                  value={form.weight}
                  onChange={(e) => update('weight', e.target.value)}
                  required={!hasProfile}
                  min={10}
                  max={500}
                  disabled={hasProfile}
                />
                {hasProfile ? <small>Update your weight from Progress Tracking so every part of the app stays consistent.</small> : null}
              </label>

              <label className="field">
                <span>Training Experience</span>
                <select value={form.trainingExperience} onChange={(e) => update('trainingExperience', e.target.value)}>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </label>

              <label className="field">
                <span>Equipment Access</span>
                <select value={form.equipmentAccess} onChange={(e) => update('equipmentAccess', e.target.value)}>
                  <option value="bodyweight">Bodyweight Only</option>
                  <option value="home_basic">Basic Home Equipment</option>
                  <option value="gym">Gym Access</option>
                </select>
              </label>

              <label className="field">
                <span>Dietary Preference</span>
                <select value={form.dietaryPreference} onChange={(e) => update('dietaryPreference', e.target.value)}>
                  <option value="no_preference">No Preference</option>
                  <option value="halal">Halal</option>
                  <option value="vegetarian">Vegetarian</option>
                  <option value="vegan">Vegan</option>
                  <option value="other">Other</option>
                </select>
              </label>
            </div>

            <ChoiceGroup label="Activity Level" value={form.activityLevel} options={[["low", "Low"], ["moderate", "Moderate"], ["high", "High"]]} onChange={(v) => update('activityLevel', v)} />
            <ChoiceGroup label="Fitness Goal" value={form.fitnessGoal} options={[["weight_loss", "Weight Loss"], ["muscle_gain", "Muscle Gain"], ["general_fitness", "General Fitness"]]} onChange={(v) => update('fitnessGoal', v)} />
            <ChoiceGroup label="Budget Preference" value={form.budgetPreference} options={[["low", "Low"], ["medium", "Medium"], ["high", "High"]]} onChange={(v) => update('budgetPreference', v)} />

            <div className="profile-notes-grid">
              <label className="field">
                <span>Food Allergies / Foods to Avoid</span>
                <textarea value={form.foodAllergies} onChange={(e) => update('foodAllergies', e.target.value)} maxLength={300} placeholder="Example: peanuts, shrimp. Leave blank if none." />
              </label>
              <label className="field">
                <span>Movement Limitations / Exercises to Avoid</span>
                <textarea value={form.movementLimitations} onChange={(e) => update('movementLimitations', e.target.value)} maxLength={300} placeholder="Example: avoid high-impact jumping. Leave blank if none." />
              </label>
            </div>

            <p className="note-box profile-safety-note">These fields help the AI avoid unsuitable suggestions, but FitGuide AI provides general guidance and does not replace professional medical advice.</p>

            <div className="align-end">
              <Button loading={saving} type="submit">{hasProfile ? 'Update Profile' : 'Save Profile'}</Button>
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
              <p><span>Current Weight</span><strong>{profile?.weight || form.weight || '--'} kg</strong></p>
              <p><span>Height</span><strong>{profile?.height || form.height || '--'} cm</strong></p>
              <p><span>Category</span><strong>{labelText(profile?.bmiCategory || 'N/A')}</strong></p>
            </div>
            <p className="note-box">BMI is a general adult screening indicator and may not reflect all body conditions.</p>
          </aside>
        </div>
      ) : null}
    </AppLayout>
  );
}

function ChoiceGroup({ label, value, options, onChange }) {
  return (
    <div className="choice-block">
      <strong>{label}</strong>
      <div className="choice-row">
        {options.map(([val, text]) => (
          <button key={val} type="button" className={value === val ? 'selected' : ''} onClick={() => onChange(val)}>{text}</button>
        ))}
      </div>
    </div>
  );
}
