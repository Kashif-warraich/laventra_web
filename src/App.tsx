import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AlertProvider } from './context/AlertContext'
import AlertToast from './components/AlertToast'
import ConfirmDialog from './components/ConfirmDialog'
import { useAlert } from './context/AlertContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import LavaggiPage from './pages/LavaggiPage'
import LavaggioDetailPage from './pages/LavaggioDetailPage'
import DevicesPage from './pages/DevicesPage'
import EventsPage from './pages/EventsPage'
import ReportsPage from './pages/ReportsPage'
import UsersPage from './pages/UsersPage'
import DeviceLogsPage from './pages/DeviceLogsPage'
import LicensesPage from './pages/LicensesPage'

const queryClient = new QueryClient()

function AlertLayer() {
  const { alert, confirm, dismissAlert, dismissConfirm } = useAlert()
  return (
    <>
      {alert && <AlertToast type={alert.type} message={alert.message} onDismiss={dismissAlert} />}
      {confirm && <ConfirmDialog title={confirm.title} message={confirm.message} confirmLabel={confirm.confirmLabel} confirmColor={confirm.confirmColor} onConfirm={() => { confirm.onConfirm(); dismissConfirm() }} onCancel={dismissConfirm} />}
    </>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AlertProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/lavaggi" element={<LavaggiPage />} />
            <Route path="/lavaggi/:id" element={<LavaggioDetailPage />} />
            <Route path="/devices" element={<DevicesPage />} />
            <Route path="/licenses" element={<LicensesPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/device-logs" element={<DeviceLogsPage />} />
            <Route
              path="/users"
              element={
                <ProtectedRoute requiredRole="admin">
                  <UsersPage />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        <AlertLayer />
      </BrowserRouter>
      </AlertProvider>
    </QueryClientProvider>
  )
}
