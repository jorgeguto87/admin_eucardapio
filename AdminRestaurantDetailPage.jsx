import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  ArrowLeft, Lock, Unlock, Phone, MapPin, Calendar, Pencil,
  PlayCircle, PauseCircle, XCircle, CalendarClock, Gift, Receipt, Users as UsersIcon,
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Textarea from '../../components/ui/Textarea'
import Modal from '../../components/ui/Modal'
import ConfirmModal from '../../components/ui/ConfirmModal'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ErrorState from '../../components/ui/ErrorState'
import EmptyState from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'
import useAdminAuthStore from '../../stores/adminAuthStore'
import { useAdminRestaurant, useUpdateRestaurant, useSetRestaurantActive, useDeleteRestaurant, useUpdateRestaurantUser } from '../../hooks/useAdminRestaurants'
import {
  useConfirmSubscriptionPayment, useChargeSubscription, useSuspendSubscription, useCancelSubscription,
  useUpdateSubscriptionDates, useLiberateSubscription, useRestaurantBillingHistory, useAdjustPendingBillingAmount,
} from '../../hooks/useAdminSubscriptions'
import { useAdminPlans } from '../../hooks/useAdminPlans'
import { formatCents, formatDate, formatDateTime, toDateInputValue } from '../../lib/format'

export default function AdminRestaurantDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const hasPermission = useAdminAuthStore((s) => s.hasPermission)
  const canManageBilling = hasPermission('manageBilling')

  const { data, isLoading, isError, refetch } = useAdminRestaurant(id)
  const { data: plans } = useAdminPlans({ includeInactive: false })

  const updateRestaurant = useUpdateRestaurant()
  const setActive        = useSetRestaurantActive()
  const deleteRestaurant = useDeleteRestaurant()
  const updateRestaurantUser = useUpdateRestaurantUser()
  const [editUserModal, setEditUserModal] = useState(null)
  const [editUserForm, setEditUserForm] = useState({ name: '', email: '' })
  const confirmPayment    = useConfirmSubscriptionPayment()
  const chargeSub          = useChargeSubscription()
  const suspendSub        = useSuspendSubscription()
  const cancelSub         = useCancelSubscription()
  const updateDates       = useUpdateSubscriptionDates()
  const liberateSub       = useLiberateSubscription()
  const adjustPendingBilling = useAdjustPendingBillingAmount()

  const [modal, setModal]           = useState(null) // 'edit' | 'block' | 'plan' | 'suspend' | 'cancel' | 'dates' | 'liberate' | null
  const [reason, setReason]         = useState('')
  const [editForm, setEditForm]     = useState(null)
  const [planForm, setPlanForm]     = useState({ planSlug: '', billingPeriod: 'monthly', adminNote: '', mpPaymentId: '' })
  const [datesForm, setDatesForm]   = useState({ currentPeriodEnd: '', trialEndsAt: '', billingDay: '' })
  const [liberateDays, setLiberateDays] = useState(30)
  const [adjustAmountForm, setAdjustAmountForm] = useState({ amount: '', reason: '' })
  const [billingPage, setBillingPage] = useState(1)

  const billingHistoryQ = useRestaurantBillingHistory(canManageBilling ? id : null, { page: billingPage, limit: 10 })

  if (isLoading) return <LoadingSpinner />
  if (isError) return <div className="p-8"><ErrorState onRetry={refetch} /></div>
  if (!data?.restaurant) return <div className="p-8"><EmptyState title="Restaurante não encontrado." /></div>

  const { restaurant, subscription, users = [] } = data
  const isBlocked = !restaurant.isActive
  const subStatus = subscription?.status || restaurant.subscription?.status

  const openEdit = () => {
    setEditForm({
      name: restaurant.name || '',
      document: restaurant.document || '',
      phone: restaurant.phone || '',
      timezone: restaurant.timezone || '',
      slug: restaurant.slug || '',
      address: { ...restaurant.address },
    })
    setModal('edit')
  }

  const openPlanModal = () => {
    setPlanForm({
      planSlug: subscription?.planSlug || plans?.[0]?.slug || '',
      billingPeriod: subscription?.billingPeriod === 'annual' ? 'annual' : 'monthly',
      adminNote: '',
      mpPaymentId: '',
    })
    setModal('plan')
  }

  const openDatesModal = () => {
    setDatesForm({
      currentPeriodEnd: toDateInputValue(subscription?.currentPeriodEnd),
      trialEndsAt: toDateInputValue(subscription?.trialEndsAt),
      billingDay: subscription?.billingDay || '',
    })
    setModal('dates')
  }

  const closeModal = () => { setModal(null); setReason('') }

  const submitEdit = async (e) => {
    e.preventDefault()
    await updateRestaurant.mutateAsync({ id, ...editForm })
    closeModal()
  }

  const submitBlock = async () => {
    await setActive.mutateAsync({ id, isActive: isBlocked, reason: reason || undefined })
    closeModal()
  }

  const submitCharge = async (e) => {
    e.preventDefault()
    await chargeSub.mutateAsync({
      restaurantId: id,
      planSlug: planForm.planSlug,
      billingPeriod: planForm.billingPeriod,
    })
    closeModal()
  }

  const submitConfirmPayment = async (e) => {
    e.preventDefault()
    if (!planForm.mpPaymentId && planForm.adminNote.trim().length < 5) {
      toast.error('Informe o ID do pagamento no Mercado Pago OU explique (mín. 5 caracteres) como o pagamento foi recebido.')
      return
    }
    await confirmPayment.mutateAsync({
      restaurantId: id,
      planSlug: planForm.planSlug,
      billingPeriod: planForm.billingPeriod,
      adminNote: planForm.adminNote || undefined,
      mpPaymentId: planForm.mpPaymentId || undefined,
    })
    closeModal()
  }

  const submitSuspend = async () => {
    await suspendSub.mutateAsync({ restaurantId: id, reason: reason || undefined })
    closeModal()
  }

  const submitCancel = async () => {
    await cancelSub.mutateAsync({ restaurantId: id, reason: reason || undefined })
    closeModal()
  }

  const submitDelete = async () => {
    await deleteRestaurant.mutateAsync({ id, reason: reason || undefined })
    navigate('/restaurants')
  }

  const submitDates = async (e) => {
    e.preventDefault()
    const payload = {}
    // Sempre fim do dia (23:59:59) — datas de vencimento são por DIA, sem
    // hora, em todo o resto do sistema (ver billingDate.js no backend).
    if (datesForm.currentPeriodEnd) payload.currentPeriodEnd = new Date(`${datesForm.currentPeriodEnd}T23:59:59`).toISOString()
    if (datesForm.trialEndsAt)      payload.trialEndsAt      = new Date(`${datesForm.trialEndsAt}T23:59:59`).toISOString()
    if (datesForm.billingDay)       payload.billingDay       = Number(datesForm.billingDay)
    await updateDates.mutateAsync({ restaurantId: id, ...payload, reason: reason || undefined })
    closeModal()
  }

  const submitLiberate = async () => {
    await liberateSub.mutateAsync({ restaurantId: id, extraDays: Number(liberateDays), reason: reason || undefined })
    closeModal()
  }

  const submitAdjustAmount = async (e) => {
    e.preventDefault()
    const reais = parseFloat(adjustAmountForm.amount.replace(',', '.'))
    if (!reais || reais <= 0) {
      toast.error('Informe um valor válido, maior que zero.')
      return
    }
    if (adjustAmountForm.reason.trim().length < 5) {
      toast.error('Informe o motivo do ajuste (mínimo 5 caracteres).')
      return
    }
    await adjustPendingBilling.mutateAsync({
      restaurantId: id,
      newTotal: Math.round(reais * 100), // reais → centavos
      reason: adjustAmountForm.reason.trim(),
    })
    setAdjustAmountForm({ amount: '', reason: '' })
    closeModal()
  }

  const billingItems = billingHistoryQ.data?.items || []
  const billingPagination = billingHistoryQ.data?.pagination

  return (
    <div>
      <PageHeader
        title={restaurant.name}
        subtitle="Detalhes do restaurante"
        action={
          <button onClick={() => navigate('/restaurants')} className="btn-ghost">
            <ArrowLeft size={16} />
            Voltar
          </button>
        }
      />

      <div className="p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Informações cadastrais */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm">Informações</h3>
              <button onClick={openEdit} className="p-2 rounded-xl hover:bg-gray-100" title="Editar">
                <Pencil size={15} className="text-gray-400" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-500">
                <Phone size={14} /> {restaurant.phone || '—'}
              </div>
              <div className="text-gray-500">Documento: {restaurant.document || '—'}</div>
              <div className="flex items-center gap-2 text-gray-500 sm:col-span-2">
                <MapPin size={14} />
                {restaurant.address?.street
                  ? `${restaurant.address.street}, ${restaurant.address.number || 's/n'} — ${restaurant.address.city || ''}`
                  : '—'}
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <Calendar size={14} /> Desde {formatDate(restaurant.createdAt)}
              </div>
              <div className="text-gray-500">Slug: {restaurant.slug || '—'}</div>
            </div>
          </Card>

          {/* Assinatura */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm">Assinatura</h3>
              <Badge status={subStatus} />
            </div>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Plano</span>
                <span className="font-medium">{subscription?.planId?.name || subscription?.planSlug || restaurant.subscription?.plan || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Período</span>
                <span className="font-medium capitalize">{subscription?.billingPeriod || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Valor vigente</span>
                <span className="font-medium">{formatCents(subscription?.currentPrice ?? restaurant.subscription?.price ?? 0)}</span>
              </div>
              {subscription?.trialEndsAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Fim do trial</span>
                  <span className="font-medium">{formatDate(subscription.trialEndsAt)}</span>
                </div>
              )}
              {subscription?.currentPeriodEnd && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Próxima cobrança / vencimento</span>
                  <span className="font-medium">{formatDate(subscription.currentPeriodEnd)}</span>
                </div>
              )}
              {subscription?.billingDay && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Dia fixo de vencimento</span>
                  <span className="font-medium">Todo dia {subscription.billingDay}</span>
                </div>
              )}
              {subscription?.canAnticipateFirstPayment && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Antecipação disponível</span>
                  <span className="font-medium text-warning">Sim (restaurante pode pagar antes)</span>
                </div>
              )}
              {subscription?.scheduledDeletionAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Exclusão automática em</span>
                  <span className="font-medium text-danger">{formatDate(subscription.scheduledDeletionAt)}</span>
                </div>
              )}
            </div>

            {canManageBilling && (
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={openPlanModal}>
                  <PlayCircle size={15} /> {['suspended', 'cancelled'].includes(subStatus) ? 'Reativar' : 'Alterar plano'}
                </Button>
                {subStatus === 'trial' && (
                  <Button variant="ghost" onClick={openDatesModal}>
                    <CalendarClock size={15} /> Renovar trial
                  </Button>
                )}
                {subStatus !== 'suspended' && subStatus !== 'cancelled' && (
                  <Button variant="ghost" onClick={() => setModal('suspend')}>
                    <PauseCircle size={15} /> Suspender
                  </Button>
                )}
                {subStatus !== 'cancelled' && (
                  <Button variant="danger" onClick={() => setModal('cancel')}>
                    <XCircle size={15} /> Cancelar assinatura
                  </Button>
                )}
                {subStatus === 'cancelled' && (
                  <Button variant="danger" onClick={() => setModal('delete')}>
                    <XCircle size={15} /> Excluir cliente definitivamente
                  </Button>
                )}
                <Button variant="ghost" onClick={openDatesModal}>
                  <CalendarClock size={15} /> Alterar vencimento
                </Button>
                <Button variant="ghost" onClick={() => setModal('adjust-amount')}>
                  <Receipt size={15} /> Ajustar valor da cobrança
                </Button>
                <Button variant="ghost" onClick={() => setModal('liberate')}>
                  <Gift size={15} /> Liberar (sem cobrar)
                </Button>
              </div>
            )}
          </Card>

          {/* Histórico de status */}
          {subscription?.statusHistory?.length > 0 && (
            <Card>
              <h3 className="font-semibold text-sm mb-4">Histórico da assinatura</h3>
              <div className="space-y-3">
                {[...subscription.statusHistory].reverse().slice(0, 10).map((h) => (
                  <div key={h._id} className="text-sm border-l-2 border-gray-100 pl-3">
                    <p className="font-medium">
                      {h.from ? <>{h.from} → {h.to}</> : <>Criado como {h.to}</>}
                    </p>
                    {h.reason && <p className="text-gray-400 text-xs">{h.reason}</p>}
                    <p className="text-gray-300 text-[11px]">{formatDateTime(h.changedAt)} · {h.changedBy}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Histórico financeiro */}
          {canManageBilling && (
            <Card className="!p-0 overflow-hidden">
              <h3 className="font-semibold text-sm px-5 pt-5 pb-2 flex items-center gap-2">
                <Receipt size={15} /> Histórico financeiro
              </h3>
              {billingHistoryQ.isLoading ? (
                <div className="p-5"><LoadingSpinner text="Carregando cobranças..." /></div>
              ) : billingItems.length === 0 ? (
                <EmptyState title="Nenhuma cobrança registrada." />
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[480px]">
                      <thead>
                        <tr>
                          <th className="table-th">Tipo</th>
                          <th className="table-th">Valor</th>
                          <th className="table-th">Status</th>
                          <th className="table-th">Vencimento</th>
                        </tr>
                      </thead>
                      <tbody>
                        {billingItems.map((b) => (
                          <tr key={b._id}>
                            <td className="table-td capitalize">{b.type}</td>
                            <td className="table-td font-medium">{formatCents(b.total)}</td>
                            <td className="table-td"><Badge status={b.status} /></td>
                            <td className="table-td text-gray-400">{formatDate(b.dueDate)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Pagination page={billingPagination?.page} pages={billingPagination?.pages} total={billingPagination?.total} onChange={setBillingPage} />
                </>
              )}
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <h3 className="font-semibold text-sm mb-3">Controle manual de acesso</h3>
            <p className="text-xs text-gray-400 mb-4">
              Bloquear ou liberar acesso independente do status de pagamento.
            </p>
            <div className="mb-3"><Badge status={isBlocked ? 'blocked' : 'unblocked'} /></div>
            {isBlocked ? (
              <Button full variant="primary" onClick={() => setModal('block')} loading={setActive.isPending}>
                <Unlock size={16} /> Liberar acesso
              </Button>
            ) : (
              <Button full variant="danger" onClick={() => setModal('block')} loading={setActive.isPending}>
                <Lock size={16} /> Bloquear acesso
              </Button>
            )}
          </Card>

          <Card>
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <UsersIcon size={15} /> Usuários ({users.length})
            </h3>
            {users.length === 0 ? (
              <p className="text-xs text-gray-400">Nenhum usuário cadastrado.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {users.map((u) => (
                  <li key={u._id} className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{u.name}{u.isOwner ? ' 👑' : ''}</p>
                      <p className="text-gray-400 text-xs truncate">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge status={u.isActive ? 'unblocked' : 'blocked'} label={u.isActive ? 'Ativo' : 'Inativo'} />
                      <button
                        onClick={() => { setEditUserForm({ name: u.name, email: u.email }); setEditUserModal(u) }}
                        className="p-1.5 rounded-lg hover:bg-gray-100"
                        title="Editar nome/e-mail"
                      >
                        <Pencil size={14} className="text-gray-500" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {/* Modal: editar restaurante */}
      <Modal open={modal === 'edit'} onClose={closeModal} title="Editar restaurante" width="max-w-lg">
        {editForm && (
          <form onSubmit={submitEdit} className="space-y-4">
            <Input label="Nome" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Documento (CPF/CNPJ)" value={editForm.document} onChange={(e) => setEditForm({ ...editForm, document: e.target.value })} />
              <Input label="Telefone" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Slug" value={editForm.slug} onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })} />
              <Input label="Timezone" value={editForm.timezone} onChange={(e) => setEditForm({ ...editForm, timezone: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Rua" value={editForm.address?.street || ''} onChange={(e) => setEditForm({ ...editForm, address: { ...editForm.address, street: e.target.value } })} />
              <Input label="Número" value={editForm.address?.number || ''} onChange={(e) => setEditForm({ ...editForm, address: { ...editForm.address, number: e.target.value } })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Cidade" value={editForm.address?.city || ''} onChange={(e) => setEditForm({ ...editForm, address: { ...editForm.address, city: e.target.value } })} />
              <Input label="UF" maxLength={2} value={editForm.address?.state || ''} onChange={(e) => setEditForm({ ...editForm, address: { ...editForm.address, state: e.target.value } })} />
            </div>
            <Button type="submit" full loading={updateRestaurant.isPending}>Salvar alterações</Button>
          </form>
        )}
      </Modal>

      {/* Modal: bloquear/liberar */}
      <ConfirmModal
        open={modal === 'block'}
        onClose={closeModal}
        onConfirm={submitBlock}
        loading={setActive.isPending}
        variant={isBlocked ? 'primary' : 'danger'}
        title={isBlocked ? 'Liberar acesso' : 'Bloquear acesso'}
        confirmLabel={isBlocked ? 'Liberar' : 'Bloquear'}
        description={
          <div className="space-y-3">
            <p>{isBlocked ? 'O restaurante voltará a ter acesso ao sistema.' : 'Isso bloqueia o login de todos os usuários deste restaurante.'}</p>
            <Textarea label="Motivo (opcional, uso interno)" value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
        }
      />

      {/* Modal: suspender */}
      <ConfirmModal
        open={modal === 'suspend'}
        onClose={closeModal}
        onConfirm={submitSuspend}
        loading={suspendSub.isPending}
        variant="danger"
        title="Suspender assinatura"
        confirmLabel="Suspender"
        description={<Textarea label="Motivo (opcional)" value={reason} onChange={(e) => setReason(e.target.value)} />}
      />

      {/* Modal: cancelar */}
      <ConfirmModal
        open={modal === 'cancel'}
        onClose={closeModal}
        onConfirm={submitCancel}
        loading={cancelSub.isPending}
        variant="danger"
        title="Cancelar assinatura"
        confirmLabel="Cancelar assinatura"
        description={<Textarea label="Motivo (opcional)" value={reason} onChange={(e) => setReason(e.target.value)} />}
      />

      {/* Modal: excluir definitivamente */}
      <ConfirmModal
        open={modal === 'delete'}
        onClose={closeModal}
        onConfirm={submitDelete}
        loading={deleteRestaurant.isPending}
        variant="danger"
        title="Excluir cliente definitivamente"
        confirmLabel="Excluir para sempre"
        description={
          <div className="space-y-3">
            <p className="text-sm text-danger font-medium">
              Isso apaga o restaurante, cardápio, pedidos, clientes, conexão WhatsApp e usuários — sem volta.
            </p>
            <p className="text-xs text-gray-500">
              O histórico de cobranças continua disponível na aba "Restaurantes excluídos", pra fins fiscais.
            </p>
            <Textarea label="Motivo (opcional)" value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
        }
      />

      {/* Modal: alterar plano / emitir cobrança / confirmar pagamento manual */}
      <Modal open={modal === 'plan'} onClose={closeModal} title="Alterar plano / cobrança">
        <div className="space-y-4">
          <Select label="Plano" value={planForm.planSlug} onChange={(e) => setPlanForm({ ...planForm, planSlug: e.target.value })} required>
            <option value="">Selecione...</option>
            {(plans || []).map((p) => <option key={p._id} value={p.slug}>{p.name}</option>)}
          </Select>
          <Select label="Período de cobrança" value={planForm.billingPeriod} onChange={(e) => setPlanForm({ ...planForm, billingPeriod: e.target.value })}>
            <option value="monthly">Mensal</option>
            <option value="annual">Anual</option>
          </Select>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-sm font-semibold mb-1">1. Emitir cobrança (fluxo normal)</p>
            <p className="text-xs text-gray-400 mb-3">
              Gera um Pix de verdade na conta MP da plataforma. O restaurante fica em <strong>"Vencido"</strong> até
              o pagamento ser confirmado (pelo webhook do MP, ou manualmente abaixo).
            </p>
            <Button variant="secondary" full onClick={submitCharge} loading={chargeSub.isPending} disabled={!planForm.planSlug}>
              Emitir cobrança
            </Button>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-sm font-semibold mb-1">2. Confirmar pagamento recebido (exceção)</p>
            <p className="text-xs text-gray-400 mb-3">
              Use <strong>só</strong> se o pagamento já aconteceu de fato (fora do sistema, ou você tem o ID do
              pagamento no MP). Isso ativa a assinatura na hora — não emite Pix nenhum.
            </p>
            <Input
              label="ID do pagamento no Mercado Pago (opcional)"
              value={planForm.mpPaymentId}
              onChange={(e) => setPlanForm({ ...planForm, mpPaymentId: e.target.value })}
            />
            <div className="mt-3">
              <Textarea
                label="Como o pagamento foi recebido? (obrigatório sem ID do MP, mín. 5 caracteres)"
                value={planForm.adminNote}
                onChange={(e) => setPlanForm({ ...planForm, adminNote: e.target.value })}
              />
            </div>
            <Button full variant="primary" className="mt-3" onClick={submitConfirmPayment} loading={confirmPayment.isPending} disabled={!planForm.planSlug}>
              Confirmar pagamento e ativar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: alterar datas (vencimento / trial) */}
      <Modal open={modal === 'dates'} onClose={closeModal} title="Alterar datas da assinatura">
        <form onSubmit={submitDates} className="space-y-4">
          <Input
            label="Próxima cobrança / vencimento"
            type="date"
            value={datesForm.currentPeriodEnd}
            onChange={(e) => setDatesForm({ ...datesForm, currentPeriodEnd: e.target.value })}
          />
          <Input
            label="Fim do trial"
            type="date"
            value={datesForm.trialEndsAt}
            onChange={(e) => setDatesForm({ ...datesForm, trialEndsAt: e.target.value })}
          />
          <Input
            label="Dia fixo de vencimento (1 a 31)"
            type="number"
            min={1}
            max={31}
            placeholder="Ex: 15 — assinatura sempre vence nesse dia do mês"
            value={datesForm.billingDay}
            onChange={(e) => setDatesForm({ ...datesForm, billingDay: e.target.value })}
          />
          <Textarea label="Motivo (opcional)" value={reason} onChange={(e) => setReason(e.target.value)} />
          <Button type="submit" full loading={updateDates.isPending}>Salvar datas</Button>
        </form>
      </Modal>

      {/* Modal: ajustar valor da cobrança pendente */}
      <Modal open={modal === 'adjust-amount'} onClose={closeModal} title="Ajustar valor da cobrança pendente">
        <form onSubmit={submitAdjustAmount} className="space-y-4">
          <p className="text-sm text-gray-500">
            Gera um Pix novo com o valor informado — o Pix anterior deixa de valer.
            Útil pra testar o fluxo de pagamento sem precisar cobrar o valor cheio do plano.
          </p>
          <Input
            label="Novo valor (R$)"
            type="text"
            inputMode="decimal"
            placeholder="Ex: 1,00"
            value={adjustAmountForm.amount}
            onChange={(e) => setAdjustAmountForm({ ...adjustAmountForm, amount: e.target.value })}
          />
          <Textarea
            label="Motivo do ajuste (obrigatório)"
            placeholder="Ex: teste de pagamento antes de ir pra produção"
            value={adjustAmountForm.reason}
            onChange={(e) => setAdjustAmountForm({ ...adjustAmountForm, reason: e.target.value })}
          />
          <Button type="submit" full loading={adjustPendingBilling.isPending}>Gerar Pix com valor ajustado</Button>
        </form>
      </Modal>

      {/* Modal: liberar sem cobrar */}
      <Modal open={modal === 'liberate'} onClose={closeModal} title="Liberar cliente sem cobrar">
        <div className="space-y-4">
          <Input
            label="Dias extras"
            type="number"
            min={1}
            max={365}
            value={liberateDays}
            onChange={(e) => setLiberateDays(e.target.value)}
          />
          <Textarea label="Motivo (opcional)" value={reason} onChange={(e) => setReason(e.target.value)} />
          <p className="text-xs text-gray-400">Estende o vencimento atual pelo número de dias informado e reativa a assinatura sem gerar cobrança.</p>
          <Button full onClick={submitLiberate} loading={liberateSub.isPending}>Confirmar liberação</Button>
        </div>
      </Modal>
      {/* Modal: editar usuário (recuperação de e-mail/nome) */}
      <Modal open={!!editUserModal} onClose={() => setEditUserModal(null)} title="Editar usuário" width="max-w-sm">
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            await updateRestaurantUser.mutateAsync({ restaurantId: id, userId: editUserModal._id, ...editUserForm })
            setEditUserModal(null)
          }}
          className="space-y-4"
        >
          <p className="text-xs text-gray-400">
            Uso pra suporte/recuperação de acesso — não exige a senha do usuário.
          </p>
          <Input label="Nome" value={editUserForm.name} onChange={(e) => setEditUserForm({ ...editUserForm, name: e.target.value })} required />
          <Input label="E-mail" type="email" value={editUserForm.email} onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })} required />
          <Button type="submit" full loading={updateRestaurantUser.isPending}>Salvar</Button>
        </form>
      </Modal>
    </div>
  )
}
