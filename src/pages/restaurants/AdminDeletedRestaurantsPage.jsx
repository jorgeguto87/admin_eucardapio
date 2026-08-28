import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ErrorState from '../../components/ui/ErrorState'
import EmptyState from '../../components/ui/EmptyState'
import { useDeletedRestaurants } from '../../hooks/useAdminRestaurants'
import { formatCents, formatDateTime } from '../../lib/format'

const BILLING_STATUS_LABELS = {
  pending:   'Pendente',
  paid:      'Pago',
  failed:    'Falhou',
  refunded:  'Estornado',
  cancelled: 'Cancelado',
  waived:    'Dispensado',
}

export default function AdminDeletedRestaurantsPage() {
  const navigate = useNavigate()
  const { data, isLoading, isError, refetch } = useDeletedRestaurants()

  return (
    <div>
      <PageHeader
        title="Restaurantes excluídos"
        subtitle="Histórico permanente de cobranças, mesmo após a exclusão do restaurante"
        action={
          <Button variant="ghost" onClick={() => navigate('/restaurants')}>
            <ArrowLeft size={16} />
            Voltar
          </Button>
        }
      />

      <div className="p-4 sm:p-8">
        {isLoading ? (
          <LoadingSpinner />
        ) : isError ? (
          <ErrorState onRetry={refetch} />
        ) : !data || data.length === 0 ? (
          <EmptyState title="Nenhum restaurante excluído ainda" />
        ) : (
          <div className="space-y-4">
            {data.map((d) => (
              <Card key={d._id}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-ink">{d.name || '(sem nome)'}</p>
                    <p className="text-xs text-muted">{d.email}{d.phone ? ` · ${d.phone}` : ''}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted">Excluído em</p>
                    <p className="text-sm font-medium">{formatDateTime(d.deletedAt)}</p>
                  </div>
                </div>

                <div className="text-xs text-muted bg-bg rounded-lg p-2 mb-3">
                  <span className="font-medium">Por:</span> {d.deletedBy || '—'}
                  {d.reason && <> · <span className="font-medium">Motivo:</span> {d.reason}</>}
                </div>

                <p className="text-xs font-semibold text-muted mb-2">Histórico de cobranças</p>
                {!d.billingHistory || d.billingHistory.length === 0 ? (
                  <p className="text-xs text-muted py-2">Nenhuma cobrança registrada.</p>
                ) : (
                  <div className="space-y-1.5">
                    {d.billingHistory.map((b) => (
                      <div key={b._id} className="flex items-center justify-between py-1.5 border-b border-muted-border last:border-0">
                        <div>
                          <p className="text-sm font-medium">{formatCents(b.total)}</p>
                          <p className="text-xs text-muted">{formatDateTime(b.createdAt)} · {b.snapshot?.planName || '—'}</p>
                        </div>
                        <Badge status={b.status} label={BILLING_STATUS_LABELS[b.status] || b.status} />
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
