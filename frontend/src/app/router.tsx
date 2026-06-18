import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { AppShell } from '../layout/AppShell';
import { LoginPage } from '../features/auth/LoginPage';
import { getAccessToken } from '../features/auth/auth.storage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { MembersPage } from '../features/members/MembersPage';
import { SacramentsPage } from '../features/sacraments/SacramentsPage';
import { CertificatesPage } from '../features/certificates/CertificatesPage';
import { RegistersPage } from '../features/registers/RegistersPage';
import { DocumentsPage } from '../features/documents/DocumentsPage';
import { SettingsPage } from '../features/settings/SettingsPage';

function RequireAuth({ children }: { children: ReactNode }) {
  if (!getAccessToken()) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/app"
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="members" element={<MembersPage />} />
          <Route path="sacraments" element={<SacramentsPage />} />
          <Route path="certificates" element={<CertificatesPage />} />
          <Route path="registers" element={<RegistersPage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
