import { Navigate, Route, Routes } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Register from './pages/Register.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Profile from './pages/Profile.jsx';
import WorkoutRecommendation from './pages/WorkoutRecommendation.jsx';
import NutritionRecommendation from './pages/NutritionRecommendation.jsx';
import Progress from './pages/Progress.jsx';
import ExerciseLibrary from './pages/ExerciseLibrary.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AdminRoute from './components/AdminRoute.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/workout" element={<WorkoutRecommendation />} />
        <Route path="/nutrition" element={<NutritionRecommendation />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/exercises" element={<ExerciseLibrary />} />
      </Route>

      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<AdminDashboard />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
