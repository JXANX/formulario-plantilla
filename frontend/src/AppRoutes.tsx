import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import DashboardPage from './pages/DashboardPage';
import TestigoFormPage from './pages/TestigoFormPage';
import TestigosListPage from './pages/TestigosListPage';
import MesasReportPage from './pages/MesasReportPage';
import AuditLogPage from './pages/AuditLogPage';
import LoginPage from './pages/LoginPage';
import CoordinadoresPage from './pages/CoordinadoresPage';
import CoordinadoresAcreditadosPage from './pages/CoordinadoresAcreditadosPage';
import DistribucionPage from './pages/DistribucionPage';
import AcreditacionesPage from './pages/AcreditacionesPage';

// New Pages
import UsuariosPage from './pages/UsuariosPage';
import OperarioConteoPage from './pages/OperarioConteoPage';
import DashboardVotosPage from './pages/DashboardVotosPage';
import AbogadoConsultaPage from './pages/AbogadoConsultaPage';
import CandidatosPage from './pages/CandidatosPage';

import { authService } from './services/auth.service';

function RoleGuard({ allowedRoles, children }: { allowedRoles: string[]; children: React.ReactNode }) {
  const user = authService.getCurrentUser();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (!allowedRoles.includes(user.rol)) {
    if (user.rol === 'OPERARIO') return <Navigate to="/conteo-votos" replace />;
    if (user.rol === 'ABOGADO') return <Navigate to="/consulta-votos" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<MainLayout />}>
        {/* Default redirect depending on role when entering "/" */}
        <Route index element={
          <RoleGuard allowedRoles={['SUPER_ADMIN', 'COORDINADOR_TESTIGOS', 'ADMIN']}>
            <Navigate to="/dashboard" replace />
          </RoleGuard>
        } />
        
        {/* Coordinadores / Super Admin */}
        <Route path="dashboard" element={
          <RoleGuard allowedRoles={['SUPER_ADMIN', 'COORDINADOR_TESTIGOS', 'ADMIN']}>
            <DashboardPage />
          </RoleGuard>
        } />
        <Route path="registro" element={
          <RoleGuard allowedRoles={['SUPER_ADMIN', 'COORDINADOR_TESTIGOS', 'ADMIN']}>
            <TestigoFormPage />
          </RoleGuard>
        } />
        <Route path="testigos" element={
          <RoleGuard allowedRoles={['SUPER_ADMIN', 'COORDINADOR_TESTIGOS', 'ADMIN']}>
            <TestigosListPage />
          </RoleGuard>
        } />
        <Route path="coordinadores" element={
          <RoleGuard allowedRoles={['SUPER_ADMIN', 'COORDINADOR_TESTIGOS', 'ADMIN']}>
            <CoordinadoresPage />
          </RoleGuard>
        } />
        <Route path="coordinadores-acreditados" element={
          <RoleGuard allowedRoles={['SUPER_ADMIN', 'COORDINADOR_TESTIGOS', 'ADMIN']}>
            <CoordinadoresAcreditadosPage />
          </RoleGuard>
        } />
        <Route path="reporte-mesas" element={
          <RoleGuard allowedRoles={['SUPER_ADMIN', 'COORDINADOR_TESTIGOS', 'ADMIN']}>
            <MesasReportPage />
          </RoleGuard>
        } />
        <Route path="distribucion" element={
          <RoleGuard allowedRoles={['SUPER_ADMIN', 'COORDINADOR_TESTIGOS', 'ADMIN']}>
            <DistribucionPage />
          </RoleGuard>
        } />
        <Route path="acreditados" element={
          <RoleGuard allowedRoles={['SUPER_ADMIN', 'COORDINADOR_TESTIGOS', 'ADMIN']}>
            <AcreditacionesPage />
          </RoleGuard>
        } />

        {/* SUPER_ADMIN only */}
        <Route path="historial" element={
          <RoleGuard allowedRoles={['SUPER_ADMIN']}>
            <AuditLogPage />
          </RoleGuard>
        } />
        <Route path="usuarios" element={
          <RoleGuard allowedRoles={['SUPER_ADMIN']}>
            <UsuariosPage />
          </RoleGuard>
        } />
        <Route path="control-votos" element={
          <RoleGuard allowedRoles={['SUPER_ADMIN', 'OPERARIO', 'ABOGADO']}>
            <DashboardVotosPage />
          </RoleGuard>
        } />
        <Route path="candidatos" element={
          <RoleGuard allowedRoles={['SUPER_ADMIN']}>
            <CandidatosPage />
          </RoleGuard>
        } />

        <Route path="conteo-votos" element={
          <RoleGuard allowedRoles={['SUPER_ADMIN', 'OPERARIO']}>
            <OperarioConteoPage />
          </RoleGuard>
        } />

        {/* ABOGADO + SUPER_ADMIN */}
        <Route path="consulta-votos" element={
          <RoleGuard allowedRoles={['SUPER_ADMIN', 'ABOGADO']}>
            <AbogadoConsultaPage />
          </RoleGuard>
        } />
      </Route>
    </Routes>
  );
}