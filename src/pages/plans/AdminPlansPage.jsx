import { useState, useEffect } from 'react'
import { Save, BarChart2 } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Modal from '../../components/ui/Modal'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ErrorState from '../../components/ui/ErrorState'
import {
  useAdminPlans, useCreatePlan, useUpdatePlan, usePlanStats,
} from '../../hooks/useAdminPlans'
import { reaisToCents, centsToReaisInput, formatCents } from '../../lib/format'

// Existe hoje um único plano na plataforma: o Beta. Esta tela não cria/lista
// múltiplos planos — só configura os valores e prazos desse plano único.
// O nome é fixo (não editável) — se um dia existir mais de um plano, essa
// tela precisa virar uma lista de novo (mexe no código nessa hora).
const BETA_SLUG = 'beta'
const BETA_NAME = 'Beta'

const emptyForm = () => ({
  description: '',
  monthlyPrice: '0,00', setupFee: '0,00',
  annualDiscountPercent: 0, trialDays: 14,
  gracePeriodDays: 3, renewalReminderDays: 7,
  limits: { maxUsers: -1, maxProducts: -1, maxWhatsappDevices: -1 },
})

// Mesmo cálculo do backend (plan.model.js) — só pra mostrar o valor em
// tempo real enquanto o admin digita. O valor de verdade é sempre
// recalculado no servidor ao salvar, isso aqui é só preview.
const computeAnnualPriceCents = (monthlyPriceReais, setupFeeReais, discountPercent) => {
  const monthlyCents = reaisToCents(monthlyPriceReais) || 0
  const setupCents   = reaisToCents(setupFeeReais) || 0
  const base = setupCents + monthlyCents * 11
  const discount = (Number(discountPercent) || 0) / 100
  return Math.round(base * (1 - discount))
}

export default function AdminPlansPage() {
  const { data: plans, isLoading, isError, refetch } = useAdminPlans({ includeInactive: true })
  const createPlan = useCreatePlan()
  const updatePlan = useUpdatePlan()

  const betaPlan = plans?.find((p) => p.slug === BETA_SLUG)

  const [form, setForm] = useState(emptyForm())
  const [statsOpen, setStatsOpen] = useState(false)
  const statsQ = usePlanStats(betaPlan?._id)

  useEffect(() => {
    if (betaPlan) {
      setForm({
        description: betaPlan.description || '',
        monthlyPrice: centsToReaisInput(betaPlan.monthlyPrice),
        setupFee:     centsToReaisInput(betaPlan.setupFee),
        annualDiscountPercent: betaPlan.annualDiscountPercent,
        trialDays:    betaPlan.trialDays,
        gracePeriodDays: betaPlan.gracePeriodDays ?? 3,
        renewalReminderDays: betaPlan.renewalReminderDays ?? 7,
        limits:   { ...betaPlan.limits },
      })
    }
  }, [betaPlan])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      name: BETA_NAME,
      description: form.description,
      slug: BETA_SLUG,
      isPublic: true,
      displayOrder: 0,
      monthlyPrice: reaisToCents(form.monthlyPrice),
      setupFee:     reaisToCents(form.setupFee),
      annualDiscountPercent: Number(form.annualDiscountPercent),
      trialDays:    Number(form.trialDays),
      gracePeriodDays: Number(form.gracePeriodDays),
      renewalReminderDays: Number(form.renewalReminderDays),
      limits: {
        maxUsers:           Number(form.limits.maxUsers),
        maxProducts:        Number(form.limits.maxProducts),
        maxWhatsappDevices: Number(form.limits.maxWhatsappDevices),
      },
      // Mantém o que já estiver salvo (não removido, só não é mais editável
      // por aqui já que só há um plano — evita perder dados existentes).
      features: betaPlan?.features || {},
    }

    if (betaPlan) {
      await updatePlan.mutateAsync({ id: betaPlan._id, ...payload })
    } else {
      await createPlan.mutateAsync(payload)
    }
  }

  const isSaving = createPlan.isPending || updatePlan.isPending

  return (
    <div>
      <PageHeader
        title="Configurações do plano"
        subtitle="Plano Beta — único plano ativo na plataforma"
        action={
          betaPlan && (
            <Button variant="ghost" onClick={() => setStatsOpen(true)}>
              <BarChart2 size={16} />
              Ver assinantes
            </Button>
          )
        }
      />

      <div className="p-4 sm:p-8 max-w-2xl">
        {isLoading ? (
          <LoadingSpinner />
        ) : isError ? (
          <ErrorState onRetry={refetch} />
        ) : (
          <Card>
            {!betaPlan && (
              <p className="text-sm text-muted mb-4 bg-primary/5 rounded-xl p-3">
                O plano Beta ainda não foi configurado — preencha os valores abaixo para criá-lo.
              </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Nome do plano</label>
                <input className="input bg-surface-subtle text-muted" value={BETA_NAME} disabled readOnly />
                <p className="text-xs text-muted mt-1">Fixo — só existe o plano Beta no momento.</p>
              </div>

              <Textarea label="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

              <div className="grid grid-cols-2 gap-3">
                <Input label="Preço mensal (R$)" placeholder="0,00" value={form.monthlyPrice} onChange={(e) => setForm({ ...form, monthlyPrice: e.target.value })} required />
                <Input label="Taxa de adesão (R$)" placeholder="0,00" value={form.setupFee} onChange={(e) => setForm({ ...form, setupFee: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input label="Desconto anual (%)" type="number" min={0} max={100} value={form.annualDiscountPercent} onChange={(e) => setForm({ ...form, annualDiscountPercent: e.target.value })} />
                <div>
                  <label className="label">Preço anual (calculado)</label>
                  <div className="input bg-surface-subtle text-muted flex items-center">
                    {formatCents(computeAnnualPriceCents(form.monthlyPrice, form.setupFee, form.annualDiscountPercent))}
                  </div>
                  <p className="text-xs text-muted mt-1">Adesão + 11 mensalidades, com o desconto acima.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input label="Dias de trial (prazo gratuito)" type="number" min={0} value={form.trialDays} onChange={(e) => setForm({ ...form, trialDays: e.target.value })} />
                <Input label="Dias de carência" type="number" min={0} max={30} value={form.gracePeriodDays} onChange={(e) => setForm({ ...form, gracePeriodDays: e.target.value })} />
                <Input label="Dias para aviso de vencimento" type="number" min={0} max={30} value={form.renewalReminderDays} onChange={(e) => setForm({ ...form, renewalReminderDays: e.target.value })} />
              </div>

              <Button type="submit" full loading={isSaving}>
                <Save size={16} />
                {betaPlan ? 'Salvar alterações' : 'Criar plano Beta'}
              </Button>
            </form>
          </Card>
        )}
      </div>

      <Modal open={statsOpen} onClose={() => setStatsOpen(false)} title="Assinantes por status" width="max-w-sm">
        {statsQ.isLoading ? (
          <LoadingSpinner />
        ) : (
          <ul className="space-y-2 text-sm">
            {Object.entries(statsQ.data || {}).length === 0 ? (
              <p className="text-muted text-sm">Nenhum assinante neste plano ainda.</p>
            ) : (
              Object.entries(statsQ.data).map(([status, count]) => (
                <li key={status} className="flex items-center justify-between">
                  <Badge status={status} />
                  <span className="font-semibold">{count}</span>
                </li>
              ))
            )}
          </ul>
        )}
      </Modal>
    </div>
  )
}
