import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Loading from './Loading.jsx';

export default function ProtectedRoute() {
  const { isAuthenticated, authLoading } = useAuth();

  if (authLoading) return <Loading message="Checking account..." />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <Outlet />;
}
