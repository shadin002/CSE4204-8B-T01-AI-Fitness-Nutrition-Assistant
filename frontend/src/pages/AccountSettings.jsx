import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout.jsx';
import Button from '../components/Button.jsx';
import Alert from '../components/Alert.jsx';
import Input from '../components/Input.jsx';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function AccountSettings() {
  const navigate = useNavigate();
  const { user, updateStoredUser, clearLocalSession } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [account, setAccount] = useState({ name: '', email: '', currentPassword: '' });
  const [password, setPassword] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [deletePassword, setDeletePassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    setAccount({ name: user?.name || '', email: user?.email || '', currentPassword: '' });
  }, [user]);

  const saveAccount = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    const nameChanged = account.name.trim() !== (user?.name || '');
    const emailChanged = account.email.trim().toLowerCase() !== (user?.email || '').toLowerCase();

    if (!nameChanged && !emailChanged) {
      setError('Change your name or email before updating the account.');
      return;
    }

    if (!account.currentPassword) {
      setError('Enter your current password to update account information.');
      return;
    }

    try {
      setSavingAccount(true);
      const res = await api.put('/auth/account', {
        name: account.name.trim(),
        email: account.email.trim(),
        currentPassword: account.currentPassword,
      });
      const nextUser = res.data?.data?.user;
      updateStoredUser(nextUser);
      setAccount((prev) => ({ ...prev, currentPassword: '' }));
      setMessage('Account information updated successfully.');
    } catch (err) {
      setError(err.appMessage || 'Could not update account information.');
    } finally {
      setSavingAccount(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    if (password.newPassword !== password.confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    try {
      setSavingPassword(true);
      await api.put('/auth/change-password', {
        currentPassword: password.currentPassword,
        newPassword: password.newPassword,
      });
      clearLocalSession('Password changed successfully. Please log in with your new password.');
      navigate('/login');
    } catch (err) {
      setError(err.appMessage || 'Could not change password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const deleteAccount = async () => {
    setMessage('');
    setError('');
    if (!deletePassword) {
      setError('Enter your current password before deleting the account.');
      return;
    }
    if (!window.confirm('Delete your account and all of your profile, progress, and recommendation data? This cannot be undone.')) return;

    try {
      await api.delete('/auth/account', { data: { currentPassword: deletePassword } });
      clearLocalSession();
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.appMessage || 'Could not delete account.');
    }
  };

  return (
    <AppLayout admin={isAdmin}>
      <div className="page-heading">
        <h1>Account Settings</h1>
        <p>{isAdmin ? 'Manage your administrator account details and password.' : 'Manage your account details and password separately from your fitness profile.'}</p>
      </div>
      <Alert type="success">{message}</Alert>
      <Alert type="error">{error}</Alert>

      <div className="settings-grid">
        <form className="panel form-stack" onSubmit={saveAccount}>
          <h2>Account Information</h2>
          <Input label="Full Name" value={account.name} onChange={(e) => setAccount({ ...account, name: e.target.value })} minLength={2} maxLength={60} required />
          <Input label="Email Address" type="email" value={account.email} onChange={(e) => setAccount({ ...account, email: e.target.value })} required />
          <Input label="Current Password" type="password" value={account.currentPassword} onChange={(e) => setAccount({ ...account, currentPassword: e.target.value })} placeholder="Required to update name or email" required />
          <Button loading={savingAccount} type="submit">Update Account</Button>
        </form>

        <form className="panel form-stack" onSubmit={changePassword}>
          <h2>Change Password</h2>
          <Input label="Current Password" type="password" value={password.currentPassword} onChange={(e) => setPassword({ ...password, currentPassword: e.target.value })} required />
          <Input label="New Password" type="password" value={password.newPassword} onChange={(e) => setPassword({ ...password, newPassword: e.target.value })} minLength={8} maxLength={128} required />
          <Input label="Confirm New Password" type="password" value={password.confirmPassword} onChange={(e) => setPassword({ ...password, confirmPassword: e.target.value })} minLength={8} maxLength={128} required />
          <Button loading={savingPassword} type="submit">Change Password</Button>
        </form>
      </div>

      {user?.role !== 'admin' ? (
        <section className="panel danger-zone">
          <h2>Delete Account</h2>
          <p>This permanently removes your account, fitness profile, progress history, and saved AI recommendations.</p>
          <Input label="Current Password" type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} placeholder="Confirm with your password" />
          <button type="button" className="btn danger-button" onClick={deleteAccount}>Delete My Account</button>
        </section>
      ) : null}
    </AppLayout>
  );
}
