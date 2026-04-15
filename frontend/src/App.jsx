import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Apply from './pages/Apply';
import Status from './pages/Status';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/dashboard/:jobId" element={<Dashboard />} />
      <Route path="/apply/:jobId" element={<Apply />} />
      <Route path="/status/:applicantId" element={<Status />} />
    </Routes>
  );
}
