/**
 * Pubsub minimalista para eventos de sessão administrativa.
 *
 * Existe para permitir que `config/api.js` (camada HTTP, sem acesso ao store)
 * avise o `adminAuthStore` quando a sessão precisa ser encerrada (refresh
 * token inválido/expirado), sem criar import circular entre os dois módulos.
 */

const listeners = new Set()
const refreshListeners = new Set()

export const authEvents = {
  onForceLogout: (callback) => {
    listeners.add(callback)
    return () => listeners.delete(callback)
  },
  emitForceLogout: (reason) => {
    listeners.forEach((cb) => cb(reason))
  },

  // Avisa o store quando o refresh automático (interceptor) renova os
  // tokens com sucesso, pra persistir no localStorage também — sem isso,
  // só a memória (tokenBridge) era atualizada, e a próxima recarga de
  // página usava o refresh token antigo (já revogado no backend por
  // rotação), disparando detecção de reuso e derrubando a sessão.
  onTokensRefreshed: (callback) => {
    refreshListeners.add(callback)
    return () => refreshListeners.delete(callback)
  },
  emitTokensRefreshed: (accessToken, refreshToken) => {
    refreshListeners.forEach((cb) => cb(accessToken, refreshToken))
  },
}
