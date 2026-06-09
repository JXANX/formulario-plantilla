import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import DashboardPage from './pages/DashboardPage';
import TestigoFormPage from './pages/TestigoFormPage';
import TestigosListPage from './pages/TestigosListPage';
import MesasReportPage from './pages/MesasReportPage';
import AuditLogPage from './pages/AuditLogPage';
import LoginPage from './pages/LoginPage';
import CoordinadoresPage from './pages/CoordinadoresPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="registro" element={<TestigoFormPage />} />
        <Route path="testigos" element={<TestigosListPage />} />
        <Route path="coordinadores" element={<CoordinadoresPage />} />
        <Route path="reporte-mesas" element={<MesasReportPage />} />
        <Route path="historial" element={<AuditLogPage />} />
      </Route>
    </Routes>
  );
}