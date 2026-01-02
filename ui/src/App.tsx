import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout';
import {
  Dashboard,
  Companies,
  CompanyDetail,
  Users,
  Assets,
  AuditLogs,
  Settings,
} from './pages';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="companies" element={<Companies />} />
        <Route path="companies/:id" element={<CompanyDetail />} />
        <Route path="users" element={<Users />} />
        <Route path="assets" element={<Assets />} />
        <Route path="audit-logs" element={<AuditLogs />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default App;
