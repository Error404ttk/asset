import React from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import AssetList from './components/AssetList';
import SupplyList from './components/SupplyList'; // Import SupplyList
import AssetForm from './components/AssetForm';
import HardwareList from './components/HardwareList';
import SoftwareList from './components/SoftwareList';
import AuditLog from './components/AuditLog';
import Settings from './components/Settings';
import Login from './components/Login';
import Reports from './components/Reports';
import Analysis from './components/Analysis';
import { AssetProvider } from './context/AssetContext';
import { ToastProvider } from './context/ToastContext';

// Component to handle protected routes
const ProtectedLayout = () => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <ToastProvider>
      <AssetProvider>
        <HashRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />

            {/* Protected Routes */}
            <Route path="/" element={<ProtectedLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="assets" element={<AssetList />} />
              <Route path="supplies" element={<SupplyList />} /> {/* New Route */}
              <Route path="hardware" element={<HardwareList />} />
              <Route path="software" element={<SoftwareList />} />
              <Route path="assets/new" element={<AssetForm />} />
              <Route path="assets/:id" element={<AssetForm />} />
              <Route path="reports" element={<Reports />} />
              <Route path="audit-log" element={<AuditLog />} />
              <Route path="analysis" element={<Analysis />} />
              <Route path="settings" element={<Settings />} />
              {/* Placeholders for other routes */}
              <Route path="loans" element={<div className="p-10 text-center text-slate-500">หน้าระบบยืม-คืน (กำลังพัฒนา)</div>} />
              <Route path="users" element={<Settings initialTab="users" />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </AssetProvider>
    </ToastProvider>
  );
};

export default App;