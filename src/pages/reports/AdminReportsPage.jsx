import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import StatCard from '../../components/ui/StatCard'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ErrorState from '../../components/ui/ErrorState'
import useAdminAuthStore from '../../stores/adminAuthStore'
import { useAdminRestaurantsSummary, useAdminRestaurants } from '../../hooks/useAdminRestaurants'
import { useBillingSummary } from '../../hooks/useAdminBilling'
import { formatCents } from '../../lib/format'
import { UserPlus, DollarSign, Clock, XCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react'

const MONTH_ABBR = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

// Variação percentual entre dois valores, formatada com seta/cor.
function ChangeBadge({ current, previous }) {
  if (!previous) return <span className="text-xs text-muted">sem base de comparação</span>
  const pct = Math.round(((current - previous) / previous) * 100)
  if (pct === 0) return <span className="text-xs text-muted flex items-center gap-1"><Minus size={12} /> igual ao período anterior</span>
  const up = pct > 0
  const Icon = up ? TrendingUp : TrendingDown
  return (
    <span className={`text-xs flex items-center gap-1 ${up ? 'text-success' : 'text-danger'}`}>
      <Icon size={12} /> {up ? '+' : ''}{pct}% vs. período anterior
    </span>
  )
}

export default function AdminReportsPage() {
  const hasPermission = useAdminAuthStore((s) => s.hasPermission)
  const canViewBilling = hasPermission('manageBilling')

  const summaryQ = useAdminRestaurantsSummary()
  const sampleQ  = useAdminRestaurants({ limit: 100 })
  const billingSummaryQ = useBillingSummary()

  if (summaryQ.isLoading || sampleQ.isLoading) return <LoadingSpinner />
  if (summaryQ.isError) return <div className="p-8"><ErrorState onRetry={summaryQ.refetch} /></div>

  const totals = summaryQ.data?.totals || {}
  const restaurants = sampleQ.data?.data || []
  const sampled = restaurants.length < (sampleQ.data?.pagination?.total || 0)

  const now = new Date()
  const newThisMonth = restaurants.filter((r) => {
    const d = new Date(r.createdAt)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  // Conversão Trial -> Pago: aproximação a partir dos totais agregados do backend,
  // já que não existe um evento de "conversão" registrado historicamente.
  const convertedBase = (totals.active || 0) + (totals.pastDue || 0) + (totals.suspended || 0) + (totals.cancelled || 0)
  const conversionRate = convertedBase > 0
    ? Math.round(((totals.active || 0) / convertedBase) * 100)
    : null

  const monthlyRevenue = billingSummaryQ.data?.monthlyRevenue || []
  const yearlyRevenue  = billingSummaryQ.data?.yearlyRevenue || []
  const total          = billingSummaryQ.data?.total || {}
  const currentMonth   = billingSummaryQ.data?.currentMonth || { revenue: 0 }

  // Últimos 12 meses (o backend já manda até 24, corta pra exibição)
  const chartData = monthlyRevenue.slice(-12).map((m) => ({
    label: `${MONTH_ABBR[m._id.month - 1]}/${String(m._id.year).slice(2)}`,
    receita: m.revenue / 100,
    revenueCents: m.revenue,
  }))

  // Mês atual vs mês anterior
  const thisMonthKey = { year: now.getFullYear(), month: now.getMonth() + 1 }
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthKey = { year: lastMonthDate.getFullYear(), month: lastMonthDate.getMonth() + 1 }
  const lastMonthEntry = monthlyRevenue.find((m) => m._id.year === lastMonthKey.year && m._id.month === lastMonthKey.month)

  // Ano atual vs ano anterior
  const thisYearEntry = yearlyRevenue.find((y) => y._id === now.getFullYear())
  const lastYearEntry = yearlyRevenue.find((y) => y._id === now.getFullYear() - 1)

  return (
    <div>
      <PageHeader title="Relatórios" subtitle="Comparativos e tendências da plataforma" />

      <div className="p-4 sm:p-8 space-y-8">
        <div>
          <h2 className="text-xs font-semibold uppercase text-muted mb-3">Aquisição</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <StatCard label="Novos restaurantes (mês)" value={newThisMonth} icon={UserPlus} color="text-primary" hint={sampled ? 'estimado (amostra)' : undefined} />
            <StatCard label="Em trial" value={totals.trial ?? 0} icon={Clock} color="text-blue-600" />
            <StatCard label="Cancelamentos" value={totals.cancelled ?? 0} icon={XCircle} color="text-muted" />
            <StatCard
              label="Conversão trial → pago"
              value={conversionRate !== null ? `${conversionRate}%` : '—'}
              icon={TrendingUp}
              color="text-success"
              hint="aproximado (agregado atual)"
            />
          </div>
        </div>

        {canViewBilling ? (
          <div>
            <h2 className="text-xs font-semibold uppercase text-muted mb-3">Receita — comparativos</h2>
            {billingSummaryQ.isLoading ? (
              <LoadingSpinner />
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                  <Card>
                    <p className="text-xs text-muted mb-1">Mês atual vs. mês anterior</p>
                    <p className="text-xl font-bold text-ink mb-1">{formatCents(currentMonth.revenue)}</p>
                    <ChangeBadge current={currentMonth.revenue} previous={lastMonthEntry?.revenue} />
                  </Card>
                  <Card>
                    <p className="text-xs text-muted mb-1">Ano atual vs. ano anterior</p>
                    <p className="text-xl font-bold text-ink mb-1">{formatCents(thisYearEntry?.revenue || 0)}</p>
                    <ChangeBadge current={thisYearEntry?.revenue || 0} previous={lastYearEntry?.revenue} />
                  </Card>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
                  <StatCard label="Receita total (histórico)" value={formatCents(total.totalRevenue)} icon={DollarSign} color="text-success" />
                  <StatCard label="Cobranças pagas" value={total.count ?? 0} icon={DollarSign} color="text-ink" />
                  <StatCard label="Ticket médio" value={formatCents(total.avgTicket)} icon={DollarSign} color="text-primary" />
                </div>

                {chartData.length > 0 && (
                  <Card>
                    <h3 className="font-semibold text-sm mb-4">Receita mensal (últimos 12 meses)</h3>
                    <div className="w-full" style={{ height: 280 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${v}`} width={60} />
                          <Tooltip formatter={(_, __, props) => formatCents(props.payload.revenueCents)} labelFormatter={(l) => l} />
                          <Bar dataKey="receita" fill="#f97316" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                )}

                {yearlyRevenue.length > 1 && (
                  <Card className="mt-4">
                    <h3 className="font-semibold text-sm mb-4">Receita por ano</h3>
                    <div className="space-y-2">
                      {yearlyRevenue.map((y) => (
                        <div key={y._id} className="flex items-center justify-between text-sm">
                          <span className="text-muted">{y._id}</span>
                          <span className="font-medium">{formatCents(y.revenue)} · {y.count} cobranças</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted">
            Indicadores de receita ocultos — sua conta não possui a permissão <code>manageBilling</code>.
          </p>
        )}
      </div>
    </div>
  )
}
