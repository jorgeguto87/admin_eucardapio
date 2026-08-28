import { AlertTriangle, RotateCw } from 'lucide-react'
import Button from './Button'

export default function ErrorState({ message = 'Não foi possível carregar os dados.', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      <div className="w-12 h-12 rounded-2xl bg-danger/10 flex items-center justify-center mb-3">
        <AlertTriangle size={20} className="text-danger" />
      </div>
      <p className="font-medium text-ink text-sm">{message}</p>
      {onRetry && (
        <Button variant="ghost" className="mt-4" onClick={onRetry}>
          <RotateCw size={15} />
          Tentar novamente
        </Button>
      )}
    </div>
  )
}
