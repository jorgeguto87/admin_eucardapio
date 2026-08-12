import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import adminApi from '../config/api'
import toast from 'react-hot-toast'

const errMsg = (err, fallback) => err.response?.data?.error?.message || fallback

const invalidate = (qc, restaurantId) => {
  qc.invalidateQueries({ queryKey: ['admin', 'restaurants', restaurantId] })
  qc.invalidateQueries({ queryKey: ['admin', 'restaurants'] })
  qc.invalidateQueries({ queryKey: ['admin', 'subscriptions', restaurantId] })
  qc.invalidateQueries({ queryKey: ['admin', 'billing'] })
}

// GET /api/admin/subscriptions/:restaurantId — assinatura completa + histórico de status
export const useAdminSubscription = (restaurantId) =>
  useQuery({
    queryKey: ['admin', 'subscriptions', restaurantId],
    queryFn:  async () => (await adminApi.get(`/subscriptions/${restaurantId}`)).data.data,
    enabled:  !!restaurantId,
  })

// GET /api/admin/subscriptions/:restaurantId/history — histórico de cobranças do restaurante
export const useRestaurantBillingHistory = (restaurantId, { page = 1, limit = 10 } = {}) =>
  useQuery({
    queryKey: ['admin', 'subscriptions', restaurantId, 'history', page, limit],
    queryFn:  async () => (await adminApi.get(`/subscriptions/${restaurantId}/history`, { params: { page, limit } })).data.data,
    enabled:  !!restaurantId,
  })

/**
 * CONFIRMA que o pagamento já foi recebido (por fora do sistema, ou com um
 * mpPaymentId de referência) e ativa a assinatura imediatamente. NUNCA deve
 * ser usado como "ativar de graça" — o backend exige mpPaymentId OU uma
 * justificativa (adminNote) com pelo menos 5 caracteres.
 * POST /api/admin/subscriptions/:restaurantId/confirm-payment
 */
export const useConfirmSubscriptionPayment = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ restaurantId, ...payload }) => adminApi.post(`/subscriptions/${restaurantId}/confirm-payment`, payload),
    onSuccess: (_, { restaurantId }) => { invalidate(qc, restaurantId); toast.success('Pagamento confirmado — assinatura ativa!') },
    onError: (err) => toast.error(errMsg(err, 'Erro ao confirmar pagamento')),
  })
}

/**
 * EMITE uma cobrança de verdade (gera um Pix na conta MP da plataforma) e
 * deixa o restaurante em "past_due" (aguardando pagamento) — isso é o que
 * o botão "Emitir cobrança" deve chamar no dia a dia. Só vira "active"
 * quando o pagamento for confirmado (webhook do MP, ou confirm-payment
 * manual acima).
 * POST /api/admin/subscriptions/:restaurantId/charge
 */
export const useChargeSubscription = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ restaurantId, ...payload }) => adminApi.post(`/subscriptions/${restaurantId}/charge`, payload),
    onSuccess: (_, { restaurantId }) => { invalidate(qc, restaurantId); toast.success('Cobrança emitida! Aguardando pagamento.') },
    onError: (err) => toast.error(errMsg(err, 'Erro ao emitir cobrança')),
  })
}

// POST /api/admin/subscriptions/:restaurantId/suspend
export const useSuspendSubscription = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ restaurantId, reason }) => adminApi.post(`/subscriptions/${restaurantId}/suspend`, { reason }),
    onSuccess: (_, { restaurantId }) => { invalidate(qc, restaurantId); toast.success('Assinatura suspensa!') },
    onError: (err) => toast.error(errMsg(err, 'Erro ao suspender assinatura')),
  })
}

// POST /api/admin/subscriptions/:restaurantId/cancel
export const useCancelSubscription = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ restaurantId, reason }) => adminApi.post(`/subscriptions/${restaurantId}/cancel`, { reason }),
    onSuccess: (_, { restaurantId }) => { invalidate(qc, restaurantId); toast.success('Assinatura cancelada!') },
    onError: (err) => toast.error(errMsg(err, 'Erro ao cancelar assinatura')),
  })
}

/**
 * Altera manualmente currentPeriodEnd (próxima cobrança/vencimento) e/ou trialEndsAt
 * (usado também para "renovar trial", estendendo a data de fim do trial).
 * PATCH /api/admin/subscriptions/:restaurantId/dates
 */
export const useUpdateSubscriptionDates = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ restaurantId, ...payload }) => adminApi.patch(`/subscriptions/${restaurantId}/dates`, payload),
    onSuccess: (_, { restaurantId }) => { invalidate(qc, restaurantId); toast.success('Datas atualizadas!') },
    onError: (err) => toast.error(errMsg(err, 'Erro ao atualizar datas')),
  })
}

/**
 * Libera um cliente suspenso/vencido por N dias sem cobrar (estende currentPeriodEnd
 * e volta o status para "active").
 * POST /api/admin/subscriptions/:restaurantId/liberate
 */
export const useLiberateSubscription = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ restaurantId, ...payload }) => adminApi.post(`/subscriptions/${restaurantId}/liberate`, payload),
    onSuccess: (_, { restaurantId }) => { invalidate(qc, restaurantId); toast.success('Cliente liberado!') },
    onError: (err) => toast.error(errMsg(err, 'Erro ao liberar cliente')),
  })
}
