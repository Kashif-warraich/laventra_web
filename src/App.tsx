import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
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

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
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
            <Route path="/events" element={<EventsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/device-logs" element={<DeviceLogsPage />} />
            <Route
              path="/users"
              element={
                <ProtectedRoute requiredRole="super_admin">
                  <UsersPage />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
