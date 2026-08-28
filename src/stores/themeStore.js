import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Horário padrão do modo automático — fora dessa janela é claro, dentro
// dela é escuro. Início pode ser maior que fim (ex: 18 às 6) — significa
// "vira a noite", tratado corretamente em calcularTemaAtivo().
const HORA_INICIO_ESCURO_PADRAO = 18
const HORA_FIM_ESCURO_PADRAO = 6

function calcularTemaAtivo(mode, horaInicio, horaFim) {
  if (mode === 'light') return 'light'
  if (mode === 'dark') return 'dark'

  // mode === 'auto' — calcula com base na hora atual
  const horaAtual = new Date().getHours()
  const escuroVirandoNoite = horaInicio > horaFim // ex: 18 > 6
  const dentroDaJanelaEscura = escuroVirandoNoite
    ? (horaAtual >= horaInicio || horaAtual < horaFim)
    : (horaAtual >= horaInicio && horaAtual < horaFim)

  return dentroDaJanelaEscura ? 'dark' : 'light'
}

const useThemeStore = create(
  persist(
    (set, get) => ({
      mode: 'light', // 'light' | 'dark' | 'auto' — escolha do usuário
      horaInicioEscuro: HORA_INICIO_ESCURO_PADRAO,
      horaFimEscuro: HORA_FIM_ESCURO_PADRAO,

      setMode: (mode) => {
        set({ mode })
        get().aplicarTema()
      },

      setJanelaAutomatica: (horaInicioEscuro, horaFimEscuro) => {
        set({ horaInicioEscuro, horaFimEscuro })
        get().aplicarTema()
      },

      // Calcula o tema ativo agora e aplica no <html> — chamado na
      // inicialização, sempre que o usuário muda a escolha, e a cada
      // minuto (só importa de verdade quando mode === 'auto')
      aplicarTema: () => {
        const { mode, horaInicioEscuro, horaFimEscuro } = get()
        const temaAtivo = calcularTemaAtivo(mode, horaInicioEscuro, horaFimEscuro)
        document.documentElement.setAttribute('data-theme', temaAtivo)
      },
    }),
    { name: 'admin-theme-storage' }
  )
)

export default useThemeStore
