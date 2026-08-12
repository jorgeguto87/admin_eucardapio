import { useState } from 'react'
import { Plus, CheckCircle2, RotateCcw, Wallet, Receipt, TrendingUp, Calendar, Repeat, Award } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Textarea from '../../components/ui/Textarea'
import Modal from '../../components/ui/Modal'
import StatCard from '../../components/ui/StatCard'
import Pagination from '../../components/ui/Pagination'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ErrorState from '../../components/ui/ErrorState'
import EmptyState from '../../components/ui/EmptyState'
import {
  useBillingSummary, useAdminBillings, useCreateManualBilling, useMarkBillingPaid, useRefundBilling,
} from '../../hooks/useAdminBilling'
import { useAdminRestaurants } from '../../hooks/useAdminRestaurants'
import { formatCents, formatDate, reaisToCents } from '../../lib/format'

const STATUS_OPTIONS = [
  { value: '',          label: 'Todos os status' },
  { value: 'pending',   label: 'Pendente' },
  { value: 'paid',      label: 'Paga' },
  { value: 'failed',    label: 'Falhou' },
  { value: 'refunded',  label: 'Estornada' },
  { value: 'waived',    label: 'Isenta' },
]

const TYPE_OPTIONS = [
  { value: '',          label: 'Todos os tipos' },
  { value: 'subscription', label: 'Assinatura' },
  { value: 'setup_fee',    label: 'Taxa de adesão' },
  { value: 'manual',       label: 'Manual' },
]

const MONTH_OPTIONS = [
  { value: '', label: 'Todos os meses' },
  { value: '1', label: 'Janeiro' }, { value: '2', label: 'Fevereiro' }, { value: '3', label: 'Março' },
  { value: '4', label: 'Abril' }, { value: '5', label: 'Maio' }, { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' }, { value: '8', label: 'Agosto' }, { value: '9', label: 'Setembro' },
  { value: '10', label: 'Outubro' }, { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' },
]

const currentYear = new Date().getFullYear()
const YEAR_OPTIONS = [
  { value: '', label: 'Todos os anos' },
  ...Array.from({ length: 5 }, (_, i) => ({ value: String(currentYear - i), label: String(currentYear - i) })),
]

// Constrói dateFrom/dateTo a partir do mês/ano escolhidos no filtro.
const monthYearToRange = (month, year) => {
  if (!month && !year) return {}
  const y = year ? Number(year) : currentYear
  if (month) {
    const m = Number(month)
    const from = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0))
    const to   = new Date(Date.UTC(y, m, 0, 23, 59, 59))
    return { dateFrom: from.toISOString(), dateTo: to.toISOString() }
  }
  // só ano selecionado
  const from = new Date(Date.UTC(y, 0, 1, 0, 0, 0))
  const to   = new Date(Date.UTC(y, 11, 31, 23, 59, 59))
  return { dateFrom: from.toISOString(), dateTo: to.toISOString() }
}

export default function AdminBillingPage() {
  const [filters, setFilters] = useState({ status: '', type: '', page: 1, limit: 20 })
  const [historyMonth, setHistoryMonth] = useState('')
  const [historyYear, setHistoryYear] = useState('')

  const dateRange = monthYearToRange(historyMonth, historyYear)
  const summaryQ = useBillingSummary()
  const listQ = useAdminBillings({ ...filters, ...dateRange })
  const { data: restaurantsData } = useAdminRestaurants({ limit: 50 })

  const createManual = useCreateManualBilling()
  const markPaid = useMarkBillingPaid()
  const refund = useRefundBilling()

  const [manualOpen, setManualOpen] = useState(false)
  const [manualForm, setManualForm] = useState({ restaurantId: '', description: '', amount: '0,00', dueDate: '' })

  const [payModal, setPayModal] = useState(null)
  const [payForm, setPayForm] = useState({ mpPaymentId: '', paymentMethod: 'pix' })

  const [refundModal, setRefundModal] = useState(null)
  const [refundReason, setRefundReason] = useState('')

  const updateFilter = (key, value) => setFilters((f) => ({ ...f, [key]: value, page: 1 }))

  const billings = listQ.data?.data || []
  const pagination = listQ.data?.pagination
  const byPlan = summaryQ.data?.byPlan || []
  const total = summaryQ.data?.total || {}
  const byType = summaryQ.data?.byType || {}
  const currentMonth = summaryQ.data?.currentMonth || { revenue: 0, count: 0 }

  const submitManual = async (e) => {
    e.preventDefault()
    await createManual.mutateAsync({
      restaurantId: manualForm.restaurantId,
      description: manualForm.description,
      amount: reaisToCents(manualForm.amount),
      dueDate: manualForm.dueDate ? new Date(manualForm.dueDate).toISOString() : undefined,
    })
    setManualOpen(false)
    setManualForm({ restaurantId: '', description: '', amount: '0,00', dueDate: '' })
  }

  const submitMarkPaid = async () => {
    await markPaid.mutateAsync({ billingId: payModal._id, ...payForm })
    setPayModal(null)
  }

  const submitRefund = async () => {
    await refund.mutateAsync({ billingId: refundModal._id, reason: refundReason })
    setRefundModal(null)
    setRefundReason('')
  }

  return (
    <div>
      <PageHeader
        title="Financeiro"
        subtitle="Acompanhamento de faturamento e cobranças"
        action={<Button onClick={() => setManualOpen(true)}><Plus size={16} />Lançar cobrança</Button>}
      />

      <div className="p-4 sm:p-8">
        {summaryQ.isLoading ? (
          <LoadingSpinner />
        ) : summaryQ.isError ? (
          <ErrorState onRetry={summaryQ.refetch} />
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4">
              <StatCard label="Receita total (paga)" value={formatCents(total.totalRevenue)} icon={Wallet} color="text-success" />
              <StatCard label="Faturamento do mês" value={formatCents(currentMonth.revenue)} icon={Calendar} color="text-primary" hint={`${currentMonth.count} cobrança(s)`} />
              <StatCard label="Ticket médio" value={formatCents(total.avgTicket)} icon={TrendingUp} color="text-secondary" />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
              <StatCard label="Receita de mensalidades" value={formatCents(byType.subscription?.revenue)} icon={Repeat} color="text-blue-600" hint={`${byType.subscription?.count ?? 0} cobrança(s)`} />
              <StatCard label="Receita de adesão" value={formatCents(byType.setupFee?.revenue)} icon={Award} color="text-orange-500" hint={`${byType.setupFee?.count ?? 0} cobrança(s)`} />
              <StatCard label="Cobranças pagas" value={total.count ?? 0} icon={Receipt} color="text-gray-500" />
            </div>

            {byPlan.length > 0 && (
              <Card className="mb-6">
                <h3 className="font-semibold text-sm mb-3">Receita por plano</h3>
                <div className="space-y-2">
                  {byPlan.map((p) => (
                    <div key={p._id} className="flex items-center justify-between text-sm">
                      <span className="capitalize text-gray-500">{p._id}</span>
                      <span className="font-medium">{formatCents(p.revenue)} · {p.count} cobranças</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}

        <h3 className="font-semibold text-sm text-secondary mb-3">Histórico de pagamentos</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          <Select value={filters.status} onChange={(e) => updateFilter('status', e.target.value)} className="w-auto">
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
          <Select value={filters.type} onChange={(e) => updateFilter('type', e.target.value)} className="w-auto">
            {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
          <Select value={historyMonth} onChange={(e) => { setHistoryMonth(e.target.value); setFilters((f) => ({ ...f, page: 1 })) }} className="w-auto">
            {MONTH_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
          <Select value={historyYear} onChange={(e) => { setHistoryYear(e.target.value); setFilters((f) => ({ ...f, page: 1 })) }} className="w-auto">
            {YEAR_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </div>

        <Card className="!p-0 overflow-hidden">
          {listQ.isLoading ? (
            <LoadingSpinner />
          ) : listQ.isError ? (
            <ErrorState onRetry={listQ.refetch} />
          ) : billings.length === 0 ? (
            <EmptyState title="Nenhuma cobrança encontrada." />
          ) : (
            <>
              {/* Desktop: tabela */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead className="bg-bg">
                    <tr>
                      <th className="table-th">Restaurante</th>
                      <th className="table-th">Tipo</th>
                      <th className="table-th">Valor</th>
                      <th className="table-th">Status</th>
                      <th className="table-th">Vencimento</th>
                      <th className="table-th">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billings.map((b) => (
                      <tr key={b._id}>
                        <td className="table-td font-medium">{b.restaurantId?.name || '—'}</td>
                        <td className="table-td capitalize text-gray-500">{b.type}</td>
                        <td className="table-td font-medium">{formatCents(b.total)}</td>
                        <td className="table-td"><Badge status={b.status} /></td>
                        <td className="table-td text-gray-400">{formatDate(b.dueDate)}</td>
                        <td className="table-td">
                          <div className="flex gap-1">
                            {b.status === 'pending' && (
                              <button title="Marcar como paga" onClick={() => setPayModal(b)} className="p-1.5 rounded-lg hover:bg-gray-100">
                                <CheckCircle2 size={15} className="text-success" />
                              </button>
                            )}
                            {b.status === 'paid' && (
                              <button title="Estornar" onClick={() => setRefundModal(b)} className="p-1.5 rounded-lg hover:bg-gray-100">
                                <RotateCcw size={15} className="text-danger" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile: lista de cards */}
              <div className="sm:hidden divide-y divide-gray-100">
                {billings.map((b) => (
                  <div key={b._id} className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-sm">{b.restaurantId?.name || '—'}</p>
                      <Badge status={b.status} />
                    </div>
                    <p className="text-xs text-gray-400 capitalize mb-2">{b.type} · vence {formatDate(b.dueDate)}</p>
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{formatCents(b.total)}</p>
                      <div className="flex gap-1">
                        {b.status === 'pending' && (
                          <button title="Marcar como paga" onClick={() => setPayModal(b)} className="p-1.5 rounded-lg hover:bg-gray-100">
                            <CheckCircle2 size={15} className="text-success" />
                          </button>
                        )}
                        {b.status === 'paid' && (
                          <button title="Estornar" onClick={() => setRefundModal(b)} className="p-1.5 rounded-lg hover:bg-gray-100">
                            <RotateCcw size={15} className="text-danger" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Pagination page={pagination?.page} pages={pagination?.pages} total={pagination?.total} onChange={(p) => setFilters((f) => ({ ...f, page: p }))} />
            </>
          )}
        </Card>
      </div>

      {/* Lançar cobrança manual */}
      <Modal open={manualOpen} onClose={() => setManualOpen(false)} title="Lançar cobrança manual">
        <form onSubmit={submitManual} className="space-y-4">
          <Select label="Restaurante" value={manualForm.restaurantId} onChange={(e) => setManualForm({ ...manualForm, restaurantId: e.target.value })} required>
            <option value="">Selecione...</option>
            {(restaurantsData?.data || []).map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}
          </Select>
          <Input label="Descrição" value={manualForm.description} onChange={(e) => setManualForm({ ...manualForm, description: e.target.value })} required />
          <Input label="Valor (R$)" placeholder="0,00" value={manualForm.amount} onChange={(e) => setManualForm({ ...manualForm, amount: e.target.value })} required />
          <Input label="Vencimento" type="date" value={manualForm.dueDate} onChange={(e) => setManualForm({ ...manualForm, dueDate: e.target.value })} />
          <Button type="submit" full loading={createManual.isPending}>Lançar cobrança</Button>
        </form>
      </Modal>

      {/* Marcar como paga */}
      <Modal open={!!payModal} onClose={() => setPayModal(null)} title="Marcar cobrança como paga" width="max-w-sm">
        <div className="space-y-4">
          <Select label="Forma de pagamento" value={payForm.paymentMethod} onChange={(e) => setPayForm({ ...payForm, paymentMethod: e.target.value })}>
            <option value="pix">Pix</option>
            <option value="credit_card">Cartão de crédito</option>
            <option value="boleto">Boleto</option>
            <option value="manual">Manual / outro</option>
          </Select>
          <Input label="ID do pagamento (Mercado Pago, opcional)" value={payForm.mpPaymentId} onChange={(e) => setPayForm({ ...payForm, mpPaymentId: e.target.value })} />
          <Button full onClick={submitMarkPaid} loading={markPaid.isPending}>Confirmar pagamento</Button>
        </div>
      </Modal>

      {/* Estornar */}
      <Modal open={!!refundModal} onClose={() => setRefundModal(null)} title="Registrar estorno" width="max-w-sm">
        <div className="space-y-4">
          <Textarea label="Motivo" value={refundReason} onChange={(e) => setRefundReason(e.target.value)} required />
          <Button full variant="danger" onClick={submitRefund} loading={refund.isPending}>Confirmar estorno</Button>
        </div>
      </Modal>
    </div>
  )
}
