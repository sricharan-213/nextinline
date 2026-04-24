import { Routes, Route, Navigate } from 'react-router-dom';

// Public applicant pages
import Home from './pages/Home';
import ApplicantEntry from './pages/ApplicantEntry';
import ApplicantDashboard from './pages/ApplicantDashboard';
import Status from './pages/Status';

// Admin pages
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminPipeline from './pages/AdminPipeline';

function AdminRoute({ children }) {
  const token = localStorage.getItem('adminToken');
  if (!token) return <Navigate to="/admin/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* PUBLIC ROUTES — for applicants */}
      <Route path="/" element={<Home />} />
      <Route path="/applicant" element={<ApplicantEntry />} />
      <Route path="/applicant/dashboard" element={<ApplicantDashboard />} />
      <Route path="/status/:applicantId" element={<Status />} />

      {/* ADMIN ROUTES — password protected */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/pipeline/:jobId" element={<AdminRoute><AdminPipeline /></AdminRoute>} />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
