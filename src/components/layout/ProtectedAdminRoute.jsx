import { Navigate } from 'react-router-dom'
import useAdminAuthStore from '../../stores/adminAuthStore'

export default function ProtectedAdminRoute({ children }) {
  const isAuthenticated = useAdminAuthStore((s) => s.isAuthenticated())
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}
