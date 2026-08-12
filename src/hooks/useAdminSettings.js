import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import adminApi from '../config/api'
import toast from 'react-hot-toast'

const errMsg = (err, fallback) => err.response?.data?.error?.message || fallback

// GET /api/admin/settings — configurações globais da plataforma (singleton)
export const useAdminSettings = () =>
  useQuery({
    queryKey: ['admin', 'settings'],
    queryFn:  async () => (await adminApi.get('/settings')).data.data,
  })

// PATCH /api/admin/settings — requer permissão managePlans (definido assim no backend)
export const useUpdateSettings = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload) => adminApi.patch('/settings', payload),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['admin', 'settings'] }); toast.success('Configurações salvas!') },
    onError:    (err) => toast.error(errMsg(err, 'Erro ao salvar configurações')),
  })
}

// GET /api/admin/settings/mp-status — status real da conexão MP da plataforma
// (o backend consulta a API do MP com o token do .env, não é só "existe ou não").
export const useMpStatus = () =>
  useQuery({
    queryKey: ['admin', 'settings', 'mp-status'],
    queryFn:  async () => (await adminApi.get('/settings/mp-status')).data.data,
    retry: false,
  })
