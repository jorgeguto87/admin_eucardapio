import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import adminApi from '../config/api'
import toast from 'react-hot-toast'

const errMsg = (err, fallback) => err.response?.data?.error?.message || fallback

// GET /api/admin/plans?includeInactive=true|false
export const useAdminPlans = ({ includeInactive = true } = {}) =>
  useQuery({
    queryKey: ['admin', 'plans', { includeInactive }],
    queryFn:  async () => (await adminApi.get('/plans', { params: { includeInactive } })).data.data,
  })

// GET /api/admin/plans/:id/stats — contagem de assinantes por status
export const usePlanStats = (planId) =>
  useQuery({
    queryKey: ['admin', 'plans', planId, 'stats'],
    queryFn:  async () => (await adminApi.get(`/plans/${planId}/stats`)).data.data,
    enabled:  !!planId,
  })

export const useCreatePlan = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload) => adminApi.post('/plans', payload),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['admin', 'plans'] }); toast.success('Plano criado!') },
    onError:    (err) => toast.error(errMsg(err, 'Erro ao criar plano')),
  })
}

export const useUpdatePlan = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }) => adminApi.patch(`/plans/${id}`, payload),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['admin', 'plans'] }); toast.success('Plano atualizado!') },
    onError:    (err) => toast.error(errMsg(err, 'Erro ao atualizar plano')),
  })
}

// DELETE /api/admin/plans/:id — soft delete (isActive:false, isPublic:false)
export const useDeactivatePlan = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => adminApi.delete(`/plans/${id}`),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['admin', 'plans'] }); toast.success('Plano desativado!') },
    onError:    (err) => toast.error(errMsg(err, 'Erro ao desativar plano')),
  })
}

// Reativar = PATCH isActive:true (não existe rota dedicada de "activate" no backend)
export const useReactivatePlan = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => adminApi.patch(`/plans/${id}`, { isActive: true }),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['admin', 'plans'] }); toast.success('Plano reativado!') },
    onError:    (err) => toast.error(errMsg(err, 'Erro ao reativar plano')),
  })
}
