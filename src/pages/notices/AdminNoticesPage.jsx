import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
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
import { useAdminNotices, useCreateNotice, useUpdateNotice, useDeleteNotice } from '../../hooks/useAdminNotices'
import { useAdminPlans } from '../../hooks/useAdminPlans'
import { useAdminRestaurants } from '../../hooks/useAdminRestaurants'
import { toDateTimeLocalValue } from '../../lib/format'

const TYPES = [
  { value: 'info',        label: 'Informação' },
  { value: 'warning',     label: 'Atenção' },
  { value: 'urgent',      label: 'Urgente' },
  { value: 'maintenance', label: 'Manutenção' },
]

// Valores devem bater exatamente com NOTIFICATION_TARGET do backend: all | restaurant | plan
const TARGETS = [
  { value: 'all',        label: 'Todos os restaurantes' },
  { value: 'plan',       label: 'Plano específico' },
  { value: 'restaurant', label: 'Restaurante específico' },
]

const emptyForm = () => ({
  title: '', message: '', type: 'info', target: 'all',
  plan: '', restaurantId: '', scheduledAt: '', expiresAt: '', isActive: true,
})

export default function AdminNoticesPage() {
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState('')
  const [targetFilter, setTargetFilter] = useState('')

  const { data, isLoading, isError, refetch } = useAdminNotices({ page, limit: 20, type: typeFilter, target: targetFilter })
  const { data: plans } = useAdminPlans({ includeInactive: false })
  const { data: restaurantsData } = useAdminRestaurants({ limit: 50 })
  const createNotice = useCreateNotice()
  const updateNotice  = useUpdateNotice()
  const deleteNotice  = useDeleteNotice()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing]     = useState(null)
  const [form, setForm]           = useState(emptyForm())
  const [confirmDelete, setConfirmDelete] = useState(null)

  useEffect(() => {
    if (!modalOpen) return
    setForm(editing ? {
      title: editing.title, message: editing.message, type: editing.type, target: editing.target,
      plan: editing.plan || '', restaurantId: editing.restaurantId?._id || editing.restaurantId || '',
      scheduledAt: toDateTimeLocalValue(editing.scheduledAt), expiresAt: toDateTimeLocalValue(editing.expiresAt),
      isActive: editing.isActive,
    } : emptyForm())
  }, [modalOpen, editing])

  const openCreate = () => { setEditing(null); setModalOpen(true) }
  const openEdit   = (n) => { setEditing(n); setModalOpen(true) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      title: form.title, message: form.message, type: form.type, target: form.target,
      isActive: form.isActive,
      restaurantId: form.target === 'restaurant' ? form.restaurantId : null,
      plan: form.target === 'plan' ? form.plan : null,
      scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : null,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
    }

    if (editing) {
      await updateNotice.mutateAsync({ id: editing._id, ...payload })
    } else {
      await createNotice.mutateAsync(payload)
    }
    setModalOpen(false)
  }

  const isSaving = createNotice.isPending || updateNotice.isPending
  const notices = data?.data || []
  const pagination = data?.pagination

  return (
    <div>
      <PageHeader
        title="Avisos"
        subtitle="Comunicações enviadas para os restaurantes"
        action={<Button onClick={openCreate}><Plus size={16} />Novo aviso</Button>}
      />

      <div className="p-4 sm:p-8">
        <div className="flex flex-wrap gap-2 mb-5">
          <Select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }} className="w-auto">
            <option value="">Todos os tipos</option>
            {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </Select>
          <Select value={targetFilter} onChange={(e) => { setTargetFilter(e.target.value); setPage(1) }} className="w-auto">
            <option value="">Todos os públicos</option>
            {TARGETS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </Select>
        </div>

        {isLoading ? (
          <LoadingSpinner />
        ) : isError ? (
          <ErrorState onRetry={refetch} />
        ) : notices.length === 0 ? (
          <EmptyState title="Nenhum aviso encontrado." action={<Button onClick={openCreate}><Plus size={16} />Criar aviso</Button>} />
        ) : (
          <>
            <div className="space-y-3 mb-4">
              {notices.map((notice) => (
                <Card key={notice._id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-2 mb-1">
                        <Badge status={notice.type} />
                        {!notice.isActive && <Badge status="blocked" label="Inativo" />}
                        <span className="text-xs text-muted">
                          {notice.target === 'all' ? 'Todos os restaurantes'
                            : notice.target === 'plan' ? `Plano: ${notice.plan}`
                            : `Restaurante: ${notice.restaurantId?.name || notice.restaurantId}`}
                        </span>
                      </div>
                      <p className="font-semibold text-sm">{notice.title}</p>
                      <p className="text-sm text-muted mt-1">{notice.message}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => openEdit(notice)} className="p-2 rounded-xl hover:bg-surface-hover">
                        <Pencil size={15} className="text-muted" />
                      </button>
                      <button onClick={() => setConfirmDelete(notice)} className="p-2 rounded-xl hover:bg-surface-hover">
                        <Trash2 size={15} className="text-danger" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <Card className="!p-0">
              <Pagination page={pagination?.page} pages={pagination?.pages} total={pagination?.total} onChange={setPage} />
            </Card>
          </>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar aviso' : 'Novo aviso'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required minLength={3} maxLength={120} />
          <Textarea label="Mensagem" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required minLength={5} maxLength={2000} />

          <Select label="Tipo" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </Select>

          <Select label="Público-alvo" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })}>
            {TARGETS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </Select>

          {form.target === 'plan' && (
            <Select label="Plano" value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })} required>
              <option value="">Selecione...</option>
              {(plans || []).map((p) => <option key={p._id} value={p.slug}>{p.name}</option>)}
            </Select>
          )}

          {form.target === 'restaurant' && (
            <Select label="Restaurante" value={form.restaurantId} onChange={(e) => setForm({ ...form, restaurantId: e.target.value })} required>
              <option value="">Selecione...</option>
              {(restaurantsData?.data || []).map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}
            </Select>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input label="Início (opcional)" type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} />
            <Input label="Expira em (opcional)" type="datetime-local" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
          </div>

          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
            Ativo (visível para os restaurantes)
          </label>

          <Button type="submit" full loading={isSaving}>{editing ? 'Salvar alterações' : 'Criar aviso'}</Button>
        </form>
      </Modal>

      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={async () => { await deleteNotice.mutateAsync(confirmDelete._id); setConfirmDelete(null) }}
        loading={deleteNotice.isPending}
        variant="danger"
        title="Excluir aviso"
        confirmLabel="Excluir"
        description={`Tem certeza que deseja excluir o aviso "${confirmDelete?.title}"? Essa ação não pode ser desfeita.`}
      />
    </div>
  )
}
