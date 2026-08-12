import { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, RefreshCw } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ErrorState from '../../components/ui/ErrorState'
import useAdminAuthStore from '../../stores/adminAuthStore'
import { useAdminSettings, useUpdateSettings, useMpStatus } from '../../hooks/useAdminSettings'

export default function AdminSettingsPage() {
  const hasPermission = useAdminAuthStore((s) => s.hasPermission)
  // O backend exige a permissão "managePlans" para editar /api/admin/settings
  // (não existe uma permissão dedicada "manageSettings" — comportamento do backend atual).
  const canEdit = hasPermission('managePlans')

  const { data, isLoading, isError, refetch } = useAdminSettings()
  const updateSettings = useUpdateSettings()
  const mpStatus = useMpStatus()
  const [form, setForm] = useState(null)

  useEffect(() => {
    if (data) {
      setForm({
        supportEmail: data.supportEmail || '',
        supportWhatsapp: data.supportWhatsapp || '',
      })
    }
  }, [data])

  if (isLoading || !form) return <LoadingSpinner />
  if (isError) return <div className="p-8"><ErrorState onRetry={refetch} /></div>

  const handleSubmit = async (e) => {
    e.preventDefault()
    await updateSettings.mutateAsync(form)
  }

  return (
    <div>
      <PageHeader title="Configurações globais" subtitle="Parâmetros gerais da plataforma" />

      <div className="p-4 sm:p-8 max-w-2xl">
        {!canEdit && (
          <div className="mb-4 text-xs text-warning bg-warning/10 rounded-xl px-4 py-3">
            Sua conta não possui a permissão <code>managePlans</code>, exigida pelo backend para alterar
            estas configurações. Os campos abaixo estão disponíveis apenas para consulta.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-sm">Mercado Pago</h3>
              <button
                type="button"
                onClick={() => mpStatus.refetch()}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
                title="Testar conexão novamente"
              >
                <RefreshCw size={14} className={mpStatus.isFetching ? 'animate-spin' : ''} />
              </button>
            </div>
            <p className="text-xs text-gray-400 mb-4">
              Conta usada para cobrar a mensalidade dos restaurantes (diferente da conta de
              cada restaurante, que é conectada por eles via OAuth para receber os próprios pedidos).
            </p>

            {mpStatus.isLoading ? (
              <div className="flex items-center gap-2 text-gray-400 text-sm py-2">
                <RefreshCw size={14} className="animate-spin" /> Testando conexão...
              </div>
            ) : mpStatus.data?.connected ? (
              <div className="flex items-start gap-3">
                <CheckCircle2 size={20} className="text-success flex-shrink-0 mt-0.5" />
                <div>
                  <Badge status="unblocked" label="Conectado" />
                  {mpStatus.data.account?.email && (
                    <p className="text-xs text-gray-500 mt-2">
                      Conta: {mpStatus.data.account.email}
                      {mpStatus.data.account.nickname ? ` (${mpStatus.data.account.nickname})` : ''}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <XCircle size={20} className="text-danger flex-shrink-0 mt-0.5" />
                <div>
                  <Badge status="blocked" label="Não conectado" />
                  <p className="text-xs text-gray-500 mt-2">
                    {mpStatus.data?.configured
                      ? 'Token configurado no .env, mas o Mercado Pago recusou a conexão (token inválido, revogado ou expirado).'
                      : 'Nenhum token configurado ainda.'}
                    {' '}Configure <code>MP_PLATFORM_ACCESS_TOKEN</code> no <code>.env</code> da VPS
                    e reinicie o PM2 — não há mais campo editável aqui por segurança.
                  </p>
                </div>
              </div>
            )}
          </Card>

          <Card>
            <h3 className="font-semibold text-sm mb-4">Suporte</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="E-mail de suporte" type="email" disabled={!canEdit}
                value={form.supportEmail}
                onChange={(e) => setForm({ ...form, supportEmail: e.target.value })}
              />
              <Input
                label="WhatsApp de suporte" disabled={!canEdit}
                value={form.supportWhatsapp}
                onChange={(e) => setForm({ ...form, supportWhatsapp: e.target.value })}
              />
            </div>
          </Card>

          {canEdit && <Button type="submit" loading={updateSettings.isPending}>Salvar configurações</Button>}
        </form>

        <p className="text-xs text-gray-400 mt-6">
          Trial, carência e aviso de vencimento agora são configurados por plano, na página
          <strong> Config. do plano</strong>.
        </p>
      </div>
    </div>
  )
}
