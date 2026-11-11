const CLAVE = 'puente_tema'

export const TEMAS = ['claro', 'oscuro', 'sistema']

export const ETIQUETAS_TEMA = {
  claro: 'Claro',
  oscuro: 'Oscuro',
  sistema: 'Sistema',
}

function prefiereOscuro() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function getTema() {
  const guardado = localStorage.getItem(CLAVE)
  return TEMAS.includes(guardado) ? guardado : 'sistema'
}

export function aplicarTema(tema) {
  const oscuro = tema === 'oscuro' || (tema === 'sistema' && prefiereOscuro())
  document.documentElement.classList.toggle('dark', oscuro)
  document.documentElement.style.colorScheme = oscuro ? 'dark' : 'light'
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', oscuro ? '#111318' : '#124c91')
}

export function setTema(tema) {
  if (tema === 'sistema') localStorage.removeItem(CLAVE)
  else localStorage.setItem(CLAVE, tema)
  aplicarTema(tema)
}

// Aplica el tema guardado y sigue al sistema mientras la elección sea "sistema".
export function initTema() {
  aplicarTema(getTema())
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  const alCambiar = () => {
    if (getTema() === 'sistema') aplicarTema('sistema')
  }
  mq.addEventListener('change', alCambiar)
  return () => mq.removeEventListener('change', alCambiar)
}
