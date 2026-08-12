import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import adminApi from '../config/api'
import toast from 'react-hot-toast'

const errMsg = (err, fallback) => err.response?.data?.error?.message || fallback

// GET /api/admin/admins
export const useAdminAdmins = () =>
  useQuery({
    queryKey: ['admin', 'admins'],
    queryFn:  async () => (await adminApi.get('/admins')).data.data,
  })

export const useCreateAdmin = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload) => adminApi.post('/admins', payload),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['admin', 'admins'] }); toast.success('Administrador criado!') },
    onError:    (err) => toast.error(errMsg(err, 'Erro ao criar administrador')),
  })
}

export const useUpdateAdmin = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }) => adminApi.patch(`/admins/${id}`, payload),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['admin', 'admins'] }); toast.success('Administrador atualizado!') },
    onError:    (err) => toast.error(errMsg(err, 'Erro ao atualizar administrador')),
  })
}

export const useSetAdminActive = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isActive }) => adminApi.patch(`/admins/${id}/active`, { isActive }),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['admin', 'admins'] }); toast.success('Status atualizado!') },
    onError:    (err) => toast.error(errMsg(err, 'Erro ao atualizar status')),
  })
}

export const useResetAdminPassword = () => {
  return useMutation({
    mutationFn: ({ id, newPassword }) => adminApi.patch(`/admins/${id}/password`, { newPassword }),
    onSuccess:  () => toast.success('Senha redefinida!'),
    onError:    (err) => toast.error(errMsg(err, 'Erro ao redefinir senha')),
  })
}
