import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Soup } from 'lucide-react'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import useAdminAuthStore from '../../stores/adminAuthStore'

export default function AdminLoginPage() {
  const navigate  = useNavigate()
  const login     = useAdminAuthStore((s) => s.login)
  const isLoading = useAdminAuthStore((s) => s.isLoading)

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const result = await login({ email, password })
    if (result.ok) navigate('/', { replace: true })
    else setError(result.message)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mb-3">
            <Soup size={28} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">Painel ADM<br />Eu Cardápio</h1>
          <p className="text-white/50 text-sm mt-1">Acesso restrito à equipe da plataforma</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface rounded-2xl p-6 space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
          />
          <Input
            label="Senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />

          {error && <p className="text-danger text-sm bg-danger/10 rounded-xl px-4 py-3">{error}</p>}

          <Button type="submit" full loading={isLoading}>Entrar</Button>
        </form>
      </div>
    </div>
  )
}
