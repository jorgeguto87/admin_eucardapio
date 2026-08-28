import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import useThemeStore from './stores/themeStore'

// Aplica o tema ANTES do React montar a árvore — evita um "flash" da
// cor errada na primeira pintura da tela
useThemeStore.getState().aplicarTema()

// Reconfere a cada minuto — só importa de verdade no modo automático,
// pra trocar sozinho quando cruzar o horário configurado, sem precisar
// recarregar a página
setInterval(() => useThemeStore.getState().aplicarTema(), 60 * 1000)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
