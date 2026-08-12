import { Link } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-center px-4">
      <AlertCircle size={32} className="text-gray-300" />
      <h1 className="font-semibold text-secondary">Página não encontrada</h1>
      <p className="text-sm text-gray-400">O recurso que você procura não existe ou foi removido.</p>
      <Link to="/" className="btn-primary mt-2">Voltar ao início</Link>
    </div>
  )
}
