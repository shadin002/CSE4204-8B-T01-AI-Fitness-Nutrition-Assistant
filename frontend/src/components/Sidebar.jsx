import { NavLink, useNavigate } from 'react-router-dom';
import { Activity, BarChart3, BookOpen, Circle, LayoutDashboard, LogOut, User, Utensils, Zap } from 'lucide-react';
import Logo from './Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const items = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/workout', label: 'Workout', icon: Zap },
  { to: '/nutrition', label: 'Nutrition', icon: Circle },
  { to: '/progress', label: 'Progress', icon: BarChart3 },
  { to: '/exercises', label: 'Exercise Library', icon: BookOpen }
];

export default function Sidebar({ admin = false }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menu = admin
    ? [{ to: '/admin', label: 'Admin Dashboard', icon: Activity }]
    : items;

  return (
    <aside className="sidebar">
      <Logo />

      <nav className="side-nav">
        {menu.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink key={item.to} to={item.to}>
              <Icon size={16} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <button className="logout-btn" onClick={handleLogout}>
        <LogOut size={16} />
        Logout
      </button>

      <div className="tip-card">
        <strong>{admin ? 'Admin Mode' : 'Beginner Tip'}</strong>
        <span>{admin ? 'Manage exercises and categories clearly.' : 'Small steps every day help build healthy habits.'}</span>
      </div>
    </aside>
  );
}
