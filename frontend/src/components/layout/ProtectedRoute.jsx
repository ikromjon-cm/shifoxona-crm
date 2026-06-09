import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export function ProtectedRoute({ children, requireAdmin = false, requirePharmacy = false }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-500"></div>
      </div>
    )
  }

  if (!user) {
    if (requirePharmacy) return <Navigate to="/pharmacy/login" state={{ from: location }} replace />
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requireAdmin && user.role !== 'superadmin') {
    return <Navigate to="/" replace />
  }

  if (requirePharmacy && user.role !== 'pharmacy') {
    return <Navigate to="/" replace />
  }

  return children
}
