import { Navigate } from 'react-router-dom'
import { isAuthed, getUser, type Role } from '../lib/auth'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: Role
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  if (!isAuthed()) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole) {
    const user = getUser()
    if (user?.role !== requiredRole) {
      return <Navigate to="/dashboard" replace />
    }
  }

  return <>{children}</>
}
