import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import adminApi from '../config/api'
import toast from 'react-hot-toast'

const errMsg = (err, fallback) => err.response?.data?.error?.message || fallback

export const useAdminRestaurants = ({ status, plan, search, isActive, page = 1, limit = 20 } = {}) =>
  useQuery({
    queryKey: ['admin', 'restaurants', { status, plan, search, isActive, page, limit }],
    queryFn:  async () => {
      const params = { page, limit }
      if (status)   params.status   = status
      if (plan)     params.plan     = plan
      if (search)   params.search   = search
      if (isActive !== undefined && isActive !== '') params.isActive = isActive
      const { data } = await adminApi.get('/restaurants', { params })
      return data
    },
    placeholderData: (prev) => prev,
  })

// GET /api/admin/restaurants/summary — indicadores do dashboard
export const useAdminRestaurantsSummary = () =>
  useQuery({
    queryKey: ['admin', 'restaurants', 'summary'],
    queryFn:  async () => (await adminApi.get('/restaurants/summary')).data.data,
  })

// POST /api/admin/restaurants — cadastro manual (mesmo fluxo do autocadastro público)
export const useCreateRestaurant = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload) => adminApi.post('/restaurants', payload),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['admin', 'restaurants'] }); toast.success('Restaurante cadastrado!') },
    onError:    (err) => toast.error(errMsg(err, 'Erro ao cadastrar restaurante')),
  })
}

// GET /api/admin/restaurants/:id — retorna { restaurant, subscription, users, billingCount }
export const useAdminRestaurant = (id) =>
  useQuery({
    queryKey: ['admin', 'restaurants', id],
    queryFn:  async () => (await adminApi.get(`/restaurants/${id}`)).data.data,
    enabled:  !!id,
  })

const invalidateRestaurant = (qc, id) => {
  qc.invalidateQueries({ queryKey: ['admin', 'restaurants'] })
  if (id) qc.invalidateQueries({ queryKey: ['admin', 'restaurants', id] })
}

/**
 * Edita dados cadastrais do restaurante (escopo administrativo ampliado).
 * PATCH /api/admin/restaurants/:id — campos: name, document, phone, timezone, slug, address
 */
export const useUpdateRestaurant = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }) => adminApi.patch(`/restaurants/${id}`, payload),
    onSuccess: (_, { id }) => {
      invalidateRestaurant(qc, id)
      toast.success('Restaurante atualizado!')
    },
    onError: (err) => toast.error(errMsg(err, 'Erro ao atualizar restaurante')),
  })
}

/**
 * Bloqueia ou libera manualmente o acesso de um restaurante.
 * PATCH /api/admin/restaurants/:id/active — body: { isActive, reason }
 */
export const useSetRestaurantActive = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isActive, reason }) => adminApi.patch(`/restaurants/${id}/active`, { isActive, reason }),
    onSuccess: (_, { id, isActive }) => {
      invalidateRestaurant(qc, id)
      toast.success(isActive ? 'Restaurante liberado!' : 'Restaurante bloqueado!')
    },
    onError: (err) => toast.error(errMsg(err, 'Erro ao atualizar status do restaurante')),
  })
}

/**
 * Exclusão COMPLETA e definitiva — apaga o restaurante e todos os dados
 * operacionais (cardápio, pedidos, clientes, WhatsApp, usuários). Só o
 * histórico de cobranças (Billing) é preservado, visível depois na aba
 * "Restaurantes excluídos".
 * DELETE /api/admin/restaurants/:id — body: { reason }
 */
export const useDeleteRestaurant = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }) => adminApi.delete(`/restaurants/${id}`, { data: { reason } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'restaurants'] })
      qc.invalidateQueries({ queryKey: ['admin', 'restaurants', 'deleted'] })
      toast.success('Restaurante excluído definitivamente.')
    },
    onError: (err) => toast.error(errMsg(err, 'Erro ao excluir restaurante')),
  })
}

// GET /api/admin/restaurants/deleted — restaurantes excluídos + histórico de cobranças
export const useDeletedRestaurants = () =>
  useQuery({
    queryKey: ['admin', 'restaurants', 'deleted'],
    queryFn:  async () => (await adminApi.get('/restaurants/deleted')).data.data,
  })

/**
 * Edita nome/e-mail de um usuário do restaurante — recuperação de acesso
 * (e-mail perdido/esquecido). Ação da plataforma, não exige senha do usuário.
 * PATCH /api/admin/restaurants/:restaurantId/users/:userId
 */
export const useUpdateRestaurantUser = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ restaurantId, userId, ...payload }) =>
      adminApi.patch(`/restaurants/${restaurantId}/users/${userId}`, payload),
    onSuccess: (_, { restaurantId }) => {
      invalidateRestaurant(qc, restaurantId)
      toast.success('Usuário atualizado!')
    },
    onError: (err) => toast.error(errMsg(err, 'Erro ao atualizar usuário')),
  })
}
