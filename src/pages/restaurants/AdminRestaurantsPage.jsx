import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Select from '../../components/ui/Select'
import Pagination from '../../components/ui/Pagination'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import { SkeletonTable } from '../../components/ui/Skeleton'
import { useAdminRestaurants, useCreateRestaurant } from '../../hooks/useAdminRestaurants'
import { formatDate } from '../../lib/format'

const STATUS_FILTERS = [
  { value: '',          label: 'Todos os status' },
  { value: 'trial',     label: 'Trial' },
  { value: 'active',    label: 'Ativas' },
  { value: 'past_due',  label: 'Vencidas' },
  { value: 'suspended', label: 'Suspensas' },
  { value: 'cancelled', label: 'Canceladas' },
]

// Único plano existente hoje é o Beta — trial é o período inicial gratuito,
// não um "plano" propriamente dito, mas mantido aqui como filtro porque é
// assim que a assinatura fica registrada antes de virar Beta.
const PLAN_FILTERS = [
  { value: '',      label: 'Todos os planos' },
  { value: 'trial', label: 'Trial' },
  { value: 'beta',  label: 'Beta' },
]

const ACTIVE_FILTERS = [
  { value: '',      label: 'Bloqueio: todos' },
  { value: 'true',  label: 'Somente liberados' },
  { value: 'false', label: 'Somente bloqueados' },
]

function NewRestaurantModal({ open, onClose }) {
  const [form, setForm] = useState({
    name: '', phone: '', document: '',
    adminName: '', adminEmail: '', adminPassword: '',
    startActive: false,
  })
  const createRestaurant = useCreateRestaurant()

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    await createRestaurant.mutateAsync(form)
    setForm({ name: '', phone: '', document: '', adminName: '', adminEmail: '', adminPassword: '', startActive: false })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Novo restaurante">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Nome do restaurante" value={form.name} onChange={set('name')} required minLength={2} />
        <Input label="Telefone" value={form.phone} onChange={set('phone')} placeholder="(21) 99999-9999" />
        <Input label="CNPJ/CPF (opcional)" value={form.document} onChange={set('document')} />

        <div className="border-t border-gray-100 pt-4">
          <h3 className="text-xs font-semibold uppercase text-gray-400 mb-2">Login do restaurante</h3>
          <div className="space-y-3">
            <Input label="Nome do responsável" value={form.adminName} onChange={set('adminName')} required minLength={2} />
            <Input label="E-mail de login" type="email" value={form.adminEmail} onChange={set('adminEmail')} required />
            <Input
              label="Senha"
              type="password"
              value={form.adminPassword}
              onChange={set('adminPassword')}
              required
              minLength={8}
              placeholder="Mínimo 8 caracteres"
            />
          </div>
        </div>

        <label className="flex items-start gap-2 text-sm cursor-pointer bg-bg rounded-xl p-3">
          <input
            type="checkbox"
            className="w-4 h-4 rounded accent-primary mt-0.5"
            checked={form.startActive}
            onChange={(e) => setForm((f) => ({ ...f, startActive: e.target.checked }))}
          />
          <span>
            <span className="block font-medium">Já ativar no plano Beta</span>
            <span className="block text-xs text-gray-400">Pula o período de trial — o restaurante já entra ativo, sem cobrança de adesão.</span>
          </span>
        </label>

        <Button type="submit" full loading={createRestaurant.isPending}>Cadastrar restaurante</Button>
      </form>
    </Modal>
  )
}

export default function AdminRestaurantsPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('')
  const [plan, setPlan]     = useState('')
  const [isActive, setIsActive] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage]     = useState(1)
  const [newModalOpen, setNewModalOpen] = useState(false)

  const { data, isLoading, isError, refetch } = useAdminRestaurants({ status, plan, isActive, search, page, limit: 20 })
  const restaurants = data?.data || []
  const pagination  = data?.pagination

  const resetAndSet = (setter) => (value) => { setter(value); setPage(1) }

  return (
    <div>
      <PageHeader
        title="Restaurantes"
        subtitle={`${pagination?.total ?? 0} cadastrados`}
        action={
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => navigate('/restaurants/deleted')}>
              Restaurantes excluídos
            </Button>
            <Button onClick={() => setNewModalOpen(true)}>
              <Plus size={16} />
              Novo restaurante
            </Button>
          </div>
        }
      />

      <NewRestaurantModal open={newModalOpen} onClose={() => setNewModalOpen(false)} />

      <div className="p-4 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
          <div className="relative flex-1 sm:max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input pl-9"
              placeholder="Buscar por nome, slug, documento..."
              value={search}
              onChange={(e) => resetAndSet(setSearch)(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 sm:flex sm:gap-2">
            <Select value={status} onChange={(e) => resetAndSet(setStatus)(e.target.value)}>
              {STATUS_FILTERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </Select>
            <Select value={plan} onChange={(e) => resetAndSet(setPlan)(e.target.value)}>
              {PLAN_FILTERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </Select>
            <Select value={isActive} onChange={(e) => resetAndSet(setIsActive)(e.target.value)}>
              {ACTIVE_FILTERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </Select>
          </div>
        </div>

        <Card className="!p-0 overflow-hidden">
          {isLoading ? (
            <SkeletonTable rows={8} cols={5} />
          ) : isError ? (
            <ErrorState onRetry={refetch} />
          ) : restaurants.length === 0 ? (
            <EmptyState title="Nenhum restaurante encontrado." subtitle="Ajuste os filtros ou o termo de busca." />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead className="bg-bg">
                    <tr>
                      <th className="table-th">Nome</th>
                      <th className="table-th">Plano</th>
                      <th className="table-th">Status</th>
                      <th className="table-th">Bloqueio</th>
                      <th className="table-th">Telefone</th>
                      <th className="table-th">Cadastro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {restaurants.map((r) => (
                      <tr
                        key={r._id}
                        className="cursor-pointer hover:bg-bg/50"
                        onClick={() => navigate(`/restaurants/${r._id}`)}
                      >
                        <td className="table-td font-medium">{r.name}</td>
                        <td className="table-td text-gray-500 capitalize">{r.subscription?.plan}</td>
                        <td className="table-td"><Badge status={r.subscription?.status} /></td>
                        <td className="table-td"><Badge status={r.isActive ? 'unblocked' : 'blocked'} /></td>
                        <td className="table-td text-gray-500">{r.phone || '—'}</td>
                        <td className="table-td text-gray-400">{formatDate(r.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={pagination?.page} pages={pagination?.pages} total={pagination?.total} onChange={setPage} />
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
