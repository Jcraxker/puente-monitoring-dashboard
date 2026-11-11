import { useState, useRef, useEffect, useCallback } from 'react'
import Actividades from './Actividades'
import KPIs from './KPIs'
import Viaticos from './Viaticos'
import Sync from './Sync'
import Usuarios from './Usuarios'
import { getTema, setTema as guardarTema, TEMAS, ETIQUETAS_TEMA } from '../theme'
import './Dashboard.css'

const ICONOS_TEMA = {
  claro: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path strokeLinecap="round" d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
    </svg>
  ),
  oscuro: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />
    </svg>
  ),
  sistema: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="2.5" y="4" width="19" height="13" rx="2" />
      <path strokeLinecap="round" d="M8 21h8M12 17v4" />
    </svg>
  ),
}

const MENU_ITEMS = [
  {
    id: 'actividades',
    label: 'Actividades',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    id: 'kpis',
    label: 'KPIs',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    id: 'viaticos',
    label: 'Viáticos',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    id: 'sync',
    label: 'Sincronizar',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
  },
  {
    id: 'usuarios',
    label: 'Usuarios',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
]

const ROL_PERMISOS = {
  monitor: ['actividades', 'kpis', 'viaticos', 'sync', 'usuarios'],
  encargado: ['actividades', 'kpis', 'viaticos'],
  gestor: ['actividades', 'viaticos'],
  tecnico: ['actividades'],
}

export default function Dashboard({ usuario, onLogout }) {
  const [activeTab, setActiveTab] = useState('actividades')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [tema, setTemaActual] = useState(getTema)
  const sidebarRef = useRef(null)
  const timeoutRef = useRef(null)

  const permisos = ROL_PERMISOS[usuario.rol] || []

  const cambiarTema = useCallback((nuevo) => {
    guardarTema(nuevo)
    setTemaActual(nuevo)
  }, [])

  const ciclarTema = useCallback(() => {
    const i = TEMAS.indexOf(tema)
    cambiarTema(TEMAS[(i + 1) % TEMAS.length])
  }, [tema, cambiarTema])

  const selectTab = useCallback((id) => {
    setActiveTab(id)
    setMobileOpen(false)
    setExpanded(false)
  }, [])

  // Desktop: click outside para cerrar
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        setExpanded(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Desktop: hover con delay
  const handleMouseEnter = useCallback(() => {
    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setExpanded(true), 120)
  }, [])

  const handleMouseLeave = useCallback(() => {
    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setExpanded(false), 180)
  }, [])

  useEffect(() => () => clearTimeout(timeoutRef.current), [])

  // Bloquear scroll del body cuando el drawer móvil está abierto
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const renderContent = () => {
    switch (activeTab) {
      case 'kpis': return <KPIs usuario={usuario} />
      case 'viaticos': return <Viaticos usuario={usuario} />
      case 'sync': return <Sync usuario={usuario} />
      case 'usuarios': return <Usuarios />
      default: return <Actividades usuario={usuario} />
    }
  }

  return (
    <div className="min-h-screen bg-superficie-alt">
      {/* ===== OVERLAY MÓVIL ===== */}
      <div
        className={`sidebar-overlay lg:hidden ${mobileOpen ? 'sidebar-overlay--visible' : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* ===== SIDEBAR ===== */}
      <aside
        ref={sidebarRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`sidebar fixed inset-y-0 left-0 z-40 bg-superficie border-r border-borde ${
          mobileOpen ? 'sidebar--mobile-open' : ''
        } ${expanded ? 'sidebar--expanded' : ''}`}
      >
        <div className="flex flex-col h-full pt-14 lg:pt-0">
          {/* Header */}
          <div className="sidebar__header p-4 bg-primary flex-shrink-0">
            <div className="flex items-center gap-3">
              <img src="/logo-puente-icon.png" alt="Logo Puente" className="w-10 h-10 object-contain flex-shrink-0" />
              <div className="sidebar__label whitespace-nowrap overflow-hidden">
                <h1 className="text-lg font-semibold text-white" style={{ fontFamily: 'var(--font-heading)' }}>Puente</h1>
                <p className="text-[10px] text-white/70 -mt-0.5">Fundación Puente</p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
            {permisos.map((itemId) => {
              const item = MENU_ITEMS.find(m => m.id === itemId)
              if (!item) return null
              return (
                <button
                  key={item.id}
                  onClick={() => selectTab(item.id)}
                  className={`nav-btn w-full text-left py-2.5 rounded-lg text-sm font-medium flex items-center gap-3 px-3 ${
                    activeTab === item.id
                      ? 'bg-primary/10 text-acento'
                      : 'text-texto-secundario hover:bg-superficie-hover'
                  }`}
                >
                  <span className="flex-shrink-0 w-10 flex justify-center">{item.icon}</span>
                  <span className="sidebar__label whitespace-nowrap">{item.label}</span>
                </button>
              )
            })}
          </nav>

          {/* Usuario + logout */}
          <div className="sidebar__footer-full p-4 border-t border-borde flex-shrink-0">
            <div className="flex items-center justify-between text-xs mb-3">
              <span className="font-medium text-texto truncate">{usuario.nombre}</span>
              <span className="px-2 py-0.5 bg-superficie-alt text-texto-secundario rounded capitalize flex-shrink-0 ml-2">{usuario.rol}</span>
            </div>
            <div className="flex gap-1 p-1 mb-3 bg-superficie-alt border border-borde rounded-lg" role="group" aria-label="Tema de la interfaz">
              {TEMAS.map((opcion) => (
                <button
                  key={opcion}
                  onClick={() => cambiarTema(opcion)}
                  aria-pressed={tema === opcion}
                  title={ETIQUETAS_TEMA[opcion]}
                  className={`flex-1 flex items-center justify-center py-1.5 rounded-md transition-colors ${
                    tema === opcion
                      ? 'bg-superficie text-acento shadow-sm'
                      : 'text-texto-secundario hover:text-texto'
                  }`}
                >
                  {ICONOS_TEMA[opcion]}
                </button>
              ))}
            </div>
            <button
              onClick={onLogout}
              className="w-full px-3 py-2 text-sm text-coral hover:bg-coral-suave rounded-lg flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="sidebar__label whitespace-nowrap">Cerrar sesión</span>
            </button>
          </div>
          {/* Mini footer colapsado */}
          <div className="sidebar__footer-mini p-2 border-t border-borde flex-shrink-0 flex-col items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-primary/10 text-acento text-xs font-bold flex items-center justify-center" title={`${usuario.nombre} (${usuario.rol})`}>
              {usuario.nombre.charAt(0).toUpperCase()}
            </span>
            <button
              onClick={ciclarTema}
              title={`Tema: ${ETIQUETAS_TEMA[tema]}`}
              aria-label={`Tema: ${ETIQUETAS_TEMA[tema]}. Cambiar tema`}
              className="p-2 text-texto-secundario hover:text-acento hover:bg-superficie-hover rounded-lg"
            >
              {ICONOS_TEMA[tema]}
            </button>
            <button
              onClick={onLogout}
              title="Cerrar sesión"
              className="p-2 text-coral hover:bg-coral-suave rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* ===== CONTENIDO ===== */}
      <div className="min-h-screen flex flex-col lg:pl-16">
        {/* Header móvil — profesional Puente */}
        <header className="mobile-header sticky top-0 z-50 lg:hidden">
          <div className="flex items-center h-14 px-4">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 -ml-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
            <div className="flex items-center gap-2.5 ml-2">
              <img src="/logo-puente-icon.png" alt="" className="w-7 h-7 object-contain" />
              <span className="text-base font-semibold text-white" style={{ fontFamily: 'var(--font-heading)' }}>Puente</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>

        <footer className="p-4 lg:p-8 text-center border-t border-borde">
          <p className="text-xs text-texto-secundario">
            Diseñado por <span className="font-semibold text-texto">Jack Fallas</span> — github: <a href="https://github.com/JCraxker" target="_blank" rel="noopener noreferrer" className="text-acento hover:underline">JCraxker</a> — contacto: <a href="mailto:jack.a.fallas@gmail.com" className="text-acento hover:underline">jack.a.fallas@gmail.com</a>
          </p>
        </footer>
      </div>
    </div>
  )
}
