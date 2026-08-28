import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Store, TrendingUp, Ban, Clock, AlertTriangle, XCircle,
  Wallet, TrendingDown, UserPlus, CalendarClock, Receipt, Lock,
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import StatCard from '../../components/ui/StatCard'
import { SkeletonCards } from '../../components/ui/Skeleton'
import ErrorState from '../../components/ui/ErrorState'
import EmptyState from '../../components/ui/EmptyState'
import useAdminAuthStore from '../../stores/adminAuthStore'
import { useAdminRestaurantsSummary, useAdminRestaurants } from '../../hooks/useAdminRestaurants'
import { useBillingSummary, useAdminBillings } from '../../hooks/useAdminBilling'
import { useAdminSettings } from '../../hooks/useAdminSettings'
import { formatCents, formatDate } from '../../lib/format'

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const hasPermission = useAdminAuthStore((s) => s.hasPermission)
  const canViewBilling = hasPermission('manageBilling')

  const summaryQ  = useAdminRestaurantsSummary()
  const blockedQ  = useAdminRestaurants({ isActive: false, limit: 1 })
  const sampleQ   = useAdminRestaurants({ limit: 100 }) // amostra p/ métricas derivadas (novos, vencendo, previsto)
  const settingsQ = useAdminSettings()

  const billingSummaryQ = useBillingSummary()
  const pendingBillingQ = useAdminBillings({ status: 'pending', limit: 1 })

  const isLoading = summaryQ.isLoading || blockedQ.isLoading || sampleQ.isLoading
    || (canViewBilling && (billingSummaryQ.isLoading || pendingBillingQ.isLoading))

  const hasError = summaryQ.isError || blockedQ.isError || sampleQ.isError

  const derived = useMemo(() => {
    const restaurants = sampleQ.data?.data || []
    const sampleTotal = sampleQ.data?.pagination?.total || restaurants.length
    const sampled = restaurants.length < sampleTotal

    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear  = now.getFullYear()
    const newThisMonth = restaurants.filter((r) => {
      const d = new Date(r.createdAt)
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear
    }).length

    const reminderDays = settingsQ.data?.renewalReminderDays ?? 7
    const reminderLimit = new Date(now.getTime() + reminderDays * 24 * 60 * 60 * 1000)
    const expiringSoon = restaurants.filter((r) => {
      if (r.subscription?.status !== 'active') return false
      const next = r.subscription?.nextBillingDate
      return next && new Date(next) <= reminderLimit && new Date(next) >= now
    }).length

    const forecastCents = restaurants
      .filter((r) => ['active', 'trial'].includes(r.subscription?.status))
      .reduce((sum, r) => sum + (r.subscription?.price || 0), 0)

    return { newThisMonth, expiringSoon, forecastCents, sampled }
  }, [sampleQ.data, settingsQ.data])

  if (hasError) {
    return (
      <div>
        <PageHeader title="Visão geral" subtitle="Resumo da plataforma" />
        <div className="p-4 sm:p-8">
          <ErrorState onRetry={() => { summaryQ.refetch(); blockedQ.refetch(); sampleQ.refetch() }} />
        </div>
      </div>
    )
  }

  const totals = summaryQ.data?.totals || {}
  const recentRestaurants = summaryQ.data?.recentRestaurants || []
  const monthlyRevenue = billingSummaryQ.data?.monthlyRevenue || []
  const currentMonthRevenue = monthlyRevenue[monthlyRevenue.length - 1]?.revenue || 0
  const maxRevenue = Math.max(1, ...monthlyRevenue.map((m) => m.revenue))

  const restaurantMetrics = [
    { label: 'Restaurantes cadastrados', value: totals.restaurants ?? '—', icon: Store, color: 'text-ink' },
    { label: 'Restaurantes ativos',      value: totals.active ?? '—',      icon: TrendingUp, color: 'text-success' },
    { label: 'Em trial',                 value: totals.trial ?? '—',       icon: Clock, color: 'text-blue-600' },
    { label: 'Suspensos',                value: totals.suspended ?? '—',   icon: AlertTriangle, color: 'text-warning' },
    { label: 'Bloqueados',               value: blockedQ.data?.pagination?.total ?? '—', icon: Lock, color: 'text-danger', hint: 'isActive = false' },
    { label: 'Cancelados',               value: totals.cancelled ?? '—',   icon: XCircle, color: 'text-muted' },
    { label: 'Vencidos (past due)',      value: totals.pastDue ?? '—',     icon: Ban, color: 'text-danger' },
    {
      label: 'Novos restaurantes (mês)',
      value: derived.newThisMonth,
      icon: UserPlus,
      color: 'text-primary',
      hint: derived.sampled ? 'estimado (amostra)' : 'no mês atual',
    },
    {
      label: 'Assinaturas vencendo',
      value: derived.expiringSoon,
      icon: CalendarClock,
      color: 'text-warning',
      hint: `próx. ${settingsQ.data?.renewalReminderDays ?? 7} dias`,
    },
  ]

  const financialMetrics = canViewBilling ? [
    { label: 'Faturamento mensal', value: formatCents(currentMonthRevenue), icon: Wallet, color: 'text-success', hint: 'mês corrente (pago)' },
    { label: 'Faturamento previsto', value: formatCents(derived.forecastCents), icon: TrendingDown, color: 'text-blue-600', hint: derived.sampled ? 'estimado (amostra)' : 'base ativa + trial' },
    { label: 'Cobranças pendentes', value: pendingBillingQ.data?.pagination?.total ?? '—', icon: Receipt, color: 'text-warning' },
  ] : []

  return (
    <div>
      <PageHeader title="Visão geral" subtitle="Resumo da plataforma" />

      <div className="p-4 sm:p-8">
        {isLoading ? (
          <SkeletonCards count={8} />
        ) : (
          <>
            <h2 className="text-xs font-semibold uppercase text-muted mb-3">Restaurantes</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {restaurantMetrics.map((m) => <StatCard key={m.label} {...m} />)}
            </div>

            {canViewBilling ? (
              <>
                <h2 className="text-xs font-semibold uppercase text-muted mb-3">Financeiro</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                  {financialMetrics.map((m) => <StatCard key={m.label} {...m} />)}
                </div>

                {monthlyRevenue.length > 0 && (
                  <Card className="mb-8">
                    <h3 className="font-semibold text-sm mb-4">Receita — últimos meses</h3>
                    <div className="flex items-end gap-2 h-32">
                      {monthlyRevenue.map((m) => (
                        <div key={`${m._id.year}-${m._id.month}`} className="flex-1 flex flex-col items-center gap-1">
                          <div
                            className="w-full bg-primary/80 rounded-t-md"
                            style={{ height: `${Math.max(4, (m.revenue / maxRevenue) * 100)}%` }}
                            title={formatCents(m.revenue)}
                          />
                          <span className="text-[10px] text-muted">{m._id.month}/{String(m._id.year).slice(2)}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </>
            ) : (
              <p className="text-xs text-muted mb-8">
                Indicadores financeiros ocultos — sua conta não possui a permissão <code>manageBilling</code>.
              </p>
            )}

            <Card className="!p-0 overflow-hidden">
              <h2 className="font-semibold text-sm px-5 pt-5 pb-2">Restaurantes recentes</h2>
              {recentRestaurants.length === 0 ? (
                <EmptyState title="Nenhum restaurante cadastrado ainda." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[480px]">
                    <thead>
                      <tr>
                        <th className="table-th">Nome</th>
                        <th className="table-th">Status</th>
                        <th className="table-th">Cadastro</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentRestaurants.map((r) => (
                        <tr key={r._id} className="cursor-pointer hover:bg-bg/50" onClick={() => navigate(`/restaurants/${r._id}`)}>
                          <td className="table-td font-medium">{r.name}</td>
                          <td className="table-td"><Badge status={r.subscription?.status} /></td>
                          <td className="table-td text-muted">{formatDate(r.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
