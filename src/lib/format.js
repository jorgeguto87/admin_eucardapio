// Helpers de formatação usados em todo o painel admin.
// Valores monetários trafegam sempre em centavos (padrão do backend).

export const formatCents = (cents = 0) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export const formatDate = (value) => {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('pt-BR')
}

export const formatDateTime = (value) => {
  if (!value) return '—'
  return new Date(value).toLocaleString('pt-BR')
}

// Converte um valor em Reais (input do usuário, ex: "99,90") para centavos (inteiro).
export const reaisToCents = (value) => {
  const normalized = String(value).replace(/\./g, '').replace(',', '.')
  const num = parseFloat(normalized)
  return Number.isFinite(num) ? Math.round(num * 100) : 0
}

// Devolve no formato brasileiro (vírgula decimal) — precisa bater com o que
// reaisToCents espera de volta. Antes devolvia com PONTO decimal (toFixed
// puro), e reaisToCents lê ponto como separador de milhar — então reabrir
// e salvar um valor já existente multiplicava ele por 100 a cada ciclo.
export const centsToReaisInput = (cents = 0) => (cents / 100).toFixed(2).replace('.', ',')

// Input datetime-local <-> ISO
export const toDateTimeLocalValue = (isoOrDate) => {
  if (!isoOrDate) return ''
  const d = new Date(isoOrDate)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// Igual ao de cima, mas só data — sem hora/minuto. Usado nos seletores de
// vencimento/trial, porque hora não faz sentido nesse contexto (confunde).
export const toDateInputValue = (isoOrDate) => {
  if (!isoOrDate) return ''
  const d = new Date(isoOrDate)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export const daysUntil = (isoDate) => {
  if (!isoDate) return null
  const diffMs = new Date(isoDate).getTime() - Date.now()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}
