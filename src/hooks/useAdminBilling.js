import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import adminApi from '../config/api'
import toast from 'react-hot-toast'

const errMsg = (err, fallback) => err.response?.data?.error?.message || fallback

// GET /api/admin/billing/summary — resumo financeiro da plataforma
export const useBillingSummary = ({ dateFrom, dateTo } = {}) =>
  useQuery({
    queryKey: ['admin', 'billing', 'summary', { dateFrom, dateTo }],
    queryFn:  async () => {
      const params = {}
      if (dateFrom) params.dateFrom = dateFrom
      if (dateTo)   params.dateTo   = dateTo
      return (await adminApi.get('/billing/summary', { params })).data.data
    },
  })

// GET /api/admin/billing — lista de cobranças com filtros e paginação
export const useAdminBillings = (filters = {}) =>
  useQuery({
    queryKey: ['admin', 'billing', 'list', filters],
    queryFn:  async () => {
      const params = {}
      Object.entries(filters).forEach(([k, v]) => { if (v !== undefined && v !== '') params[k] = v })
      const { data } = await adminApi.get('/billing', { params })
      return data // { success, data, pagination }
    },
    placeholderData: (prev) => prev,
  })

const invalidateBilling = (qc) => qc.invalidateQueries({ queryKey: ['admin', 'billing'] })

// POST /api/admin/billing/manual — lançamento manual de cobrança
export const useCreateManualBilling = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload) => adminApi.post('/billing/manual', payload),
    onSuccess:  () => { invalidateBilling(qc); toast.success('Cobrança lançada!') },
    onError:    (err) => toast.error(errMsg(err, 'Erro ao lançar cobrança')),
  })
}

// PATCH /api/admin/billing/:id/paid — marca cobrança como paga manualmente
export const useMarkBillingPaid = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ billingId, ...payload }) => adminApi.patch(`/billing/${billingId}/paid`, payload),
    onSuccess:  () => { invalidateBilling(qc); toast.success('Cobrança marcada como paga!') },
    onError:    (err) => toast.error(errMsg(err, 'Erro ao marcar cobrança como paga')),
  })
}

// PATCH /api/admin/billing/:id/refund — registra estorno
export const useRefundBilling = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ billingId, ...payload }) => adminApi.patch(`/billing/${billingId}/refund`, payload),
    onSuccess:  () => { invalidateBilling(qc); toast.success('Estorno registrado!') },
    onError:    (err) => toast.error(errMsg(err, 'Erro ao registrar estorno')),
  })
}
