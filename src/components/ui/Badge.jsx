const STATUS_STYLES = {
  trial:        'bg-blue-100 text-blue-700',
  active:       'bg-success/20 text-green-700',
  past_due:     'bg-warning/20 text-yellow-700',
  suspended:    'bg-danger/20 text-red-700',
  cancelled:    'bg-surface-hover text-muted',
  info:         'bg-blue-100 text-blue-700',
  warning:      'bg-warning/20 text-yellow-700',
  urgent:       'bg-danger/20 text-red-700',
  maintenance:  'bg-surface-hover text-muted',
  // Bloqueio manual (isActive do restaurante — independente do status da assinatura)
  blocked:      'bg-danger/20 text-red-700',
  unblocked:    'bg-success/20 text-green-700',
  // Cobranças (Billing.status)
  pending:      'bg-warning/20 text-yellow-700',
  paid:         'bg-success/20 text-green-700',
  failed:       'bg-danger/20 text-red-700',
  refunded:     'bg-surface-hover text-muted',
  waived:       'bg-blue-100 text-blue-700',
}

const STATUS_LABELS = {
  trial: 'Trial', active: 'Ativa', past_due: 'Vencida',
  suspended: 'Suspensa', cancelled: 'Cancelada',
  info: 'Informação', warning: 'Atenção', urgent: 'Urgente', maintenance: 'Manutenção',
  blocked: 'Bloqueado', unblocked: 'Liberado',
  pending: 'Pendente', paid: 'Paga', failed: 'Falhou', refunded: 'Estornada', waived: 'Isenta',
}

export default function Badge({ status, label, className = '' }) {
  const style = STATUS_STYLES[status] || 'bg-surface-hover text-muted'
  const text  = label || STATUS_LABELS[status] || status

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${style} ${className}`}>
      {text}
    </span>
  )
}
