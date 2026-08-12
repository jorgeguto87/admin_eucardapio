import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import adminApi from '../config/api'
import { adminTokenBridge } from '../config/tokenBridge'
import { authEvents } from '../config/authEvents'

const useAdminAuthStore = create(
  persist(
    (set, get) => ({
      user:         null, // { id, name, email, permissions }
      accessToken:  null,
      refreshToken: null,
      isLoading:    false,

      login: async ({ email, password }) => {
        set({ isLoading: true })
        try {
          const { data } = await adminApi.post('/auth/login', { email, password })
          // Backend retorna { accessToken, refreshToken, admin: {...} } — não "user".
          const { accessToken, refreshToken, admin } = data.data

          adminTokenBridge.setTokens(accessToken, refreshToken)
          set({ accessToken, refreshToken, user: admin, isLoading: false })

          return { ok: true }
        } catch (err) {
          set({ isLoading: false })
          return { ok: false, message: err.response?.data?.error?.message || 'Erro ao fazer login' }
        }
      },

      logout: async () => {
        const { refreshToken } = get()
        if (refreshToken) {
          await adminApi.post('/auth/logout', { refreshToken }).catch(() => {})
        }
        adminTokenBridge.clearTokens()
        set({ user: null, accessToken: null, refreshToken: null })
      },

      /**
       * Encerra a sessão localmente sem chamar o backend.
       * Usado quando o refresh token já expirou/foi revogado (evento vindo do interceptor HTTP).
       */
      clearSession: () => {
        adminTokenBridge.clearTokens()
        set({ user: null, accessToken: null, refreshToken: null })
      },

      /**
       * Atualiza os dados do admin autenticado.
       * OBS: GET /auth/me não retorna "permissions" (limitação atual do backend),
       * então fazemos merge em vez de sobrescrever, preservando as permissões
       * obtidas no login.
       */
      fetchMe: async () => {
        try {
          const { data } = await adminApi.get('/auth/me')
          set((state) => ({ user: { ...state.user, ...data.data } }))
          return true
        } catch {
          return false
        }
      },

      hasPermission: (permission) => !!get().user?.permissions?.[permission],

      isAuthenticated: () => !!get().accessToken,
    }),
    {
      name: 'admin-auth',
      partialize: (state) => ({
        accessToken:  state.accessToken,
        refreshToken: state.refreshToken,
        user:         state.user,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) {
          adminTokenBridge.setTokens(state.accessToken, state.refreshToken)
        }
      },
    },
  ),
)

// Quando o interceptor HTTP detecta que o refresh token não é mais válido,
// limpa a sessão local (store + tokenBridge) sem forçar reload cru da página —
// o ProtectedAdminRoute cuida do redirecionamento via React Router.
authEvents.onForceLogout(() => {
  useAdminAuthStore.getState().clearSession()
})

authEvents.onTokensRefreshed((accessToken, refreshToken) => {
  useAdminAuthStore.setState({ accessToken, refreshToken })
})

export default useAdminAuthStore
