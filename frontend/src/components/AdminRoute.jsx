import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Loading from './Loading.jsx';

export default function AdminRoute() {
  const { user, isAuthenticated, authLoading } = useAuth();

  if (authLoading) return <Loading message="Checking admin access..." />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}
