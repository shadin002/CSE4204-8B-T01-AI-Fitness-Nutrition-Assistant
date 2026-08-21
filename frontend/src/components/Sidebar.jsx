import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Activity, BarChart3, BookOpen, Circle, LayoutDashboard, LogOut, Menu, Settings, User, X, Zap } from 'lucide-react';
import Logo from './Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const items = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/workout', label: 'Workout', icon: Zap },
  { to: '/nutrition', label: 'Nutrition', icon: Circle },
  { to: '/progress', label: 'Progress', icon: BarChart3 },
  { to: '/exercises', label: 'Exercise Library', icon: BookOpen },
  { to: '/settings', label: 'Account Settings', icon: Settings },
];

export default function Sidebar({ admin = false }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menu = admin
    ? [
        { to: '/admin', label: 'Admin Dashboard', icon: Activity },
        { to: '/settings', label: 'Account Settings', icon: Settings },
      ]
    : items;

  return (
    <aside className={open ? 'sidebar mobile-open' : 'sidebar'}>
      <div className="sidebar-top-row">
        <Logo />
        <button className="mobile-side-button" type="button" onClick={() => setOpen((value) => !value)} aria-label="Toggle app menu">
          {open ? <X size={21} /> : <Menu size={21} />}
        </button>
      </div>

      <div className="sidebar-collapsible">
        <nav className="side-nav">
          {menu.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} onClick={() => setOpen(false)}>
                <Icon size={16} /><span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <button className="logout-btn" onClick={handleLogout}><LogOut size={16} /> Logout</button>
        <div className="tip-card">
          <strong>{admin ? 'Admin Mode' : 'FitGuide Tip'}</strong>
          <span>{admin ? 'Manage exercise content and categories.' : 'Keep your profile and progress data accurate for better guidance.'}</span>
        </div>
      </div>
    </aside>
  );
}
