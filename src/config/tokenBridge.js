/**
 * Ponte de tokens do Painel Admin.
 * Completamente isolada do tokenBridge do painel restaurante.
 */

let _accessToken  = null
let _refreshToken = null

export const adminTokenBridge = {
  getAccessToken:  () => _accessToken,
  getRefreshToken: () => _refreshToken,
  setTokens: (access, refresh) => {
    _accessToken  = access
    _refreshToken = refresh
  },
  clearTokens: () => {
    _accessToken  = null
    _refreshToken = null
  },
}