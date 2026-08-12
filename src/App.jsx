import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider, QueryCache } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import toast from 'react-hot-toast'

import AdminShell from './components/layout/AdminShell'
import ProtectedAdminRoute from './components/layout/ProtectedAdminRoute'

import AdminLoginPage from './pages/auth/AdminLoginPage'
import AdminDashboardPage from './pages/dashboard/AdminDashboardPage'
import AdminRestaurantsPage from './pages/restaurants/AdminRestaurantsPage'
import AdminRestaurantDetailPage from './pages/restaurants/AdminRestaurantDetailPage'
import AdminDeletedRestaurantsPage from './pages/restaurants/AdminDeletedRestaurantsPage'
import AdminPlansPage from './pages/plans/AdminPlansPage'
import AdminNoticesPage from './pages/notices/AdminNoticesPage'
import AdminBillingPage from './pages/billing/AdminBillingPage'
import AdminSettingsPage from './pages/settings/AdminSettingsPage'
import AdminReportsPage from './pages/reports/AdminReportsPage'
import AdminAdminsPage from './pages/admins/AdminAdminsPage'
import NotFoundPage from './pages/NotFoundPage'

// Toasts globais para erros de requisição não tratados localmente por cada tela/mutação.
// 401 já é resolvido pelo interceptor de refresh em config/api.js (silencioso).
const notifyQueryError = (error) => {
  const status = error?.response?.status
  if (status === 403) toast.error('Você não tem permissão para acessar este recurso.')
  else if (status >= 500) toast.error('Erro no servidor. Tente novamente em instantes.')
  // 404 e erros de validação (400) ficam a cargo da UI de cada página (ErrorState/EmptyState).
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
  queryCache: new QueryCache({ onError: notifyQueryError }),
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<AdminLoginPage />} />

          <Route element={<ProtectedAdminRoute><AdminShell /></ProtectedAdminRoute>}>
            <Route path="/" element={<AdminDashboardPage />} />
            <Route path="/restaurants" element={<AdminRestaurantsPage />} />
            <Route path="/restaurants/deleted" element={<AdminDeletedRestaurantsPage />} />
            <Route path="/restaurants/:id" element={<AdminRestaurantDetailPage />} />
            <Route path="/billing" element={<AdminBillingPage />} />
            <Route path="/plans" element={<AdminPlansPage />} />
            <Route path="/notices" element={<AdminNoticesPage />} />
            <Route path="/reports" element={<AdminReportsPage />} />
            <Route path="/admins" element={<AdminAdminsPage />} />
            <Route path="/settings" element={<AdminSettingsPage />} />
          </Route>

          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>

      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
    </QueryClientProvider>
  )
}
