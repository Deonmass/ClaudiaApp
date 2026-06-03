import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { MainLayout } from './components/layout/MainLayout'
import { AuthProvider } from './contexts/AuthContext'
import { DataProvider } from './contexts/DataContext'
import { YearFilterProvider } from './contexts/YearFilterContext'
import { LayoutProvider } from './contexts/LayoutContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { AgentsPage } from './pages/AgentsPage'
import { AttendancePage } from './pages/AttendancePage'
import { AttendanceReportPage } from './pages/AttendanceReportPage'
import { CashPage } from './pages/CashPage'
import { ClientsPage } from './pages/ClientsPage'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { SettingsPage } from './pages/SettingsPage'

export default function App() {
  return (
    <ThemeProvider>
      <DataProvider>
        <YearFilterProvider>
          <AuthProvider>
            <LayoutProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route element={<ProtectedRoute />}>
                  <Route element={<MainLayout />}>
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route
                      element={<ProtectedRoute module="dashboard" />}
                    >
                      <Route path="dashboard" element={<DashboardPage />} />
                    </Route>
                    <Route path="projects">
                      <Route index element={<Navigate to="/projects/en-cours" replace />} />
                      <Route
                        element={<ProtectedRoute module="projects" />}
                      >
                        <Route path="en-cours" element={<ProjectsPage view="en-cours" />} />
                      </Route>
                      <Route
                        element={
                          <ProtectedRoute module="projects" action="view_closed" />
                        }
                      >
                        <Route path="cloture" element={<ProjectsPage view="cloture" />} />
                      </Route>
                    </Route>
                    <Route
                      element={<ProtectedRoute module="clients" />}
                    >
                      <Route path="clients" element={<ClientsPage />} />
                    </Route>
                    <Route
                      element={<ProtectedRoute module="agents" />}
                    >
                      <Route path="agents" element={<AgentsPage />} />
                    </Route>
                    <Route element={<ProtectedRoute module="cash" />}>
                      <Route path="cash" element={<CashPage />} />
                    </Route>
                    <Route
                      element={<ProtectedRoute module="attendance" />}
                    >
                      <Route path="attendance" element={<AttendancePage />} />
                    </Route>
                    <Route
                      element={
                        <ProtectedRoute module="attendance" action="view_report" />
                      }
                    >
                      <Route path="attendance/rapport" element={<AttendanceReportPage />} />
                    </Route>
                    <Route
                      path="attendance/report"
                      element={<Navigate to="/attendance/rapport" replace />}
                    />
                    <Route
                      element={<ProtectedRoute module="settings" />}
                    >
                      <Route path="settings" element={<SettingsPage />} />
                    </Route>
                  </Route>
                </Route>
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </BrowserRouter>
            </LayoutProvider>
          </AuthProvider>
        </YearFilterProvider>
      </DataProvider>
    </ThemeProvider>
  )
}
