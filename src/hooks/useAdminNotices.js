import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import adminApi from '../config/api'
import toast from 'react-hot-toast'

const errMsg = (err, fallback) => err.response?.data?.error?.message || fallback

// GET /api/admin/notifications — CRUD de avisos administrativos (Fase 4.7)
// Observação: o hook antigo apontava para "/notices" (rota inexistente no backend).
export const useAdminNotices = ({ page = 1, limit = 20, type, target, isActive } = {}) =>
  useQuery({
    queryKey: ['admin', 'notices', { page, limit, type, target, isActive }],
    queryFn:  async () => {
      const params = { page, limit }
      if (type)     params.type     = type
      if (target)   params.target   = target
      if (isActive !== undefined && isActive !== '') params.isActive = isActive
      const { data } = await adminApi.get('/notifications', { params })
      return data // { success, data, pagination }
    },
    placeholderData: (prev) => prev,
  })

export const useCreateNotice = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload) => adminApi.post('/notifications', payload),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['admin', 'notices'] }); toast.success('Aviso criado!') },
    onError:    (err) => toast.error(errMsg(err, 'Erro ao criar aviso')),
  })
}

export const useUpdateNotice = () => {
  const qc = useQueryClient()
  return useMutation({
    // Backend usa PUT (não PATCH) para atualizar avisos.
    mutationFn: ({ id, ...payload }) => adminApi.put(`/notifications/${id}`, payload),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['admin', 'notices'] }); toast.success('Aviso atualizado!') },
    onError:    (err) => toast.error(errMsg(err, 'Erro ao atualizar aviso')),
  })
}

export const useDeleteNotice = () => {
  const qc = useQueryClient()
  return useMutation({
    // Backend responde 204 No Content — sem corpo de resposta.
    mutationFn: (id) => adminApi.delete(`/notifications/${id}`),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['admin', 'notices'] }); toast.success('Aviso removido!') },
    onError:    (err) => toast.error(errMsg(err, 'Erro ao remover aviso')),
  })
}
