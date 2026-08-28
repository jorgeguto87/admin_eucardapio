import Modal from './Modal'
import Button from './Button'

export default function ConfirmModal({
  open, onClose, onConfirm, title = 'Confirmar ação', description,
  confirmLabel = 'Confirmar', variant = 'primary', loading = false,
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} width="max-w-sm">
      {description && <div className="text-sm text-muted mb-5">{description}</div>}
      <div className="flex gap-2">
        <Button variant="ghost" full onClick={onClose} disabled={loading}>Cancelar</Button>
        <Button variant={variant} full onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
      </div>
    </Modal>
  )
}
