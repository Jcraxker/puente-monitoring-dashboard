import React, { useState, useMemo, useEffect } from 'react'
import { api, getToken } from '../api'

const DEPARTAMENTOS_FALLBACK = ['Chimaltenango']
const COMUNIDADES_FALLBACK = {
  Chimaltenango: ['Chimixayá', 'Chuatacaj 1', 'Motagua', 'Oficina PQL', 'Pacul', 'Paneyá', 'Panimacac', 'Panimasiguan', 'Paruxeché', 'Paxcabalche', 'San Antonio Palopó', 'Sarajmac', 'Xepalamá', 'Xequechelaj'],
}

const PERSONAL_FALLBACK = [
  { nombre: 'Jonathan Cuxil', rol: 'Técnico SEA', departamento: 'Chimaltenango' },
  { nombre: 'Cristian Sanic', rol: 'Técnico SEA', departamento: 'Chimaltenango' },
  { nombre: 'Wendy Esquit', rol: 'Técnico SEA', departamento: 'Chimaltenango' },
  { nombre: 'Leandro Chutá', rol: 'Técnico SEA', departamento: 'Chimaltenango' },
  { nombre: 'Rosa Sirin', rol: 'Gestor Comunitario', departamento: 'Chimaltenango' },
  { nombre: 'Maria Sanic', rol: 'Gestor Comunitario', departamento: 'Chimaltenango' },
  { nombre: 'Vilma Sisimit', rol: 'Gestor Comunitario', departamento: 'Chimaltenango' },
  { nombre: 'Jennifer Morales', rol: 'Gestor Comunitario', departamento: 'Chimaltenango' },
  { nombre: 'Jessica Tepáz', rol: 'Gestor Comunitario', departamento: 'Chimaltenango' },
  { nombre: 'Leimy Jutzuy', rol: 'Gestor Comunitario', departamento: 'Chimaltenango' },
]

function formatFecha(fecha) {
  const d = new Date(fecha + 'T00:00:00')
  return d.toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function formatFechaCorta(fecha) {
  const d = new Date(fecha + 'T00:00:00')
  return d.toLocaleDateString('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function toISO(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dia}`
}

const DIAS_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

function mapearRegistro(r) {
  const fecha = typeof r.fecha === 'string' ? r.fecha.slice(0, 10) : toISO(new Date(r.fecha))
  const dia = DIAS_ES[new Date(fecha + 'T00:00:00').getDay()] || ''
  const horario = r.hora_entrada && r.hora_salida
    ? `${String(r.hora_entrada).slice(0, 5)} - ${String(r.hora_salida).slice(0, 5)}`
    : '-'
  const fotos = []
  if (r.foto1) fotos.push(`/api/actividades/${r.id}/foto/1`)
  if (r.foto2) fotos.push(`/api/actividades/${r.id}/foto/2`)
  return {
    id: `${r.tipo_registro}-${r.id}`,
    fecha, dia,
    personal: r.personal || 'Sin asignar',
    rol: r.rol === 'tecnico' ? 'Técnico SEA' : 'Gestor Comunitario',
    zona: '',
    departamento: r.departamento || '',
    comunidad: r.comunidad || '—',
    actividad: r.actividad || '—',
    resumen: r.resumen || '—',
    horario,
    transporte: r.transporte || (r.tipo_registro === 'Permiso' ? '-' : '—'),
    viatico: Number(r.viatico) || 0,
    kilometraje: r.kilometraje != null ? Number(r.kilometraje) : null,
    dificultad: r.dificultad || null,
    solucion: r.solucion || null,
    coincidePlanificacion: r.coincide_planificacion === 's' ? true : r.coincide_planificacion === 'n' ? false : null,
    observaciones: r.observaciones || null,
    fotos,
    beneficiarios: null,
    tipoRegistro: r.tipo_registro,
    entregables: [],
    detalleCampo: {
      comunidades: r.comunidades_caracterizadas || null,
      famVisitadas: Number(r.familias_visitadas) || 0,
      famCaracterizadas: Number(r.familias_caracterizadas) || 0,
      famInscritas: Number(r.familias_inscritas) || 0,
      eduInscritas: Number(r.educadoras_inscritas) || 0,
      eduCapacitadas: Number(r.educadoras_capacitadas) || 0,
      eduAcompanadas: Number(r.educadoras_acompanadas) || 0,
      participantes: Number(r.participantes_visitados) || 0,
      nombres: r.nombres_participantes || null,
    },
  }
}

function parseISO(v) {
  if (!v) return null
  const [y, m, d] = v.split('-').map(Number)
  return { y, m, d }
}

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

function diasEnMes(m, y) {
  return new Date(y, m, 0).getDate()
}

function SelectorRango({ inicio, fin, onChangeInicio, onChangeFin }) {
  const hoy = new Date()
  const pIni = parseISO(inicio)
  const pFin = parseISO(fin)
  const [vista, setVista] = useState(() => {
    const p = pIni || pFin
    return p ? { y: p.y, m: p.m } : { y: hoy.getFullYear(), m: hoy.getMonth() + 1 }
  })
  const [paso, setPaso] = useState('inicio')
  // Sincroniza la navegación del calendario cuando el rango cambia desde fuera (p.ej. preset)
  // `set-state-in-effect` se desactiva globalmente: este es el caso de uso válido (sincronizar con prop externa)
  useEffect(() => {
    const target = inicio || fin
    if (!target) return
    const [y, m] = target.split('-').map(Number)
    if (y !== vista.y || m !== vista.m) {
      setVista({ y, m })
    }
  }, [inicio, fin, vista.y, vista.m])
  const nDias = diasEnMes(vista.m, vista.y)
  const primerDia = new Date(vista.y, vista.m - 1, 1).getDay()
  const enRango = (fechaStr) => {
    if (!inicio || !fin) return false
    return fechaStr >= inicio && fechaStr <= fin
  }
  const esFin = (fechaStr) => fin === fechaStr
  const esIni = (fechaStr) => inicio === fechaStr
  const texto = inicio && fin
    ? `Del ${parseISO(inicio).d} de ${MESES[parseISO(inicio).m - 1]} al ${parseISO(fin).d} de ${MESES[parseISO(fin).m - 1]}`
    : inicio
      ? 'Selecciona la fecha final'
      : 'Selecciona la fecha de inicio'
  const navCls = "w-9 h-9 flex items-center justify-center rounded-md border border-borde bg-white text-texto-secundario hover:bg-fondo-gris text-lg leading-none"
  return (
    <div>
      <div className="text-sm font-medium text-texto capitalize mb-2">{texto}</div>
      <div className="px-3 py-3 border border-borde rounded-xl bg-white shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <button type="button" className={navCls} onClick={() => setVista(v => (v.m === 1 ? { y: v.y - 1, m: 12 } : { y: v.y, m: v.m - 1 }))}>‹</button>
          <div className="text-sm font-semibold text-texto capitalize">
            {MESES[vista.m - 1]} {vista.y}
          </div>
          <button type="button" className={navCls} onClick={() => setVista(v => (v.m === 12 ? { y: v.y + 1, m: 1 } : { y: v.y, m: v.m + 1 }))}>›</button>
        </div>
        <div className="grid grid-cols-7 gap-0.5 text-center text-xs text-texto-secundario mb-1">
          {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, i) => <div key={i} className="py-0.5">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {Array.from({ length: primerDia }).map((_, i) => <div key={`b${i}`} />)}
          {Array.from({ length: nDias }, (_, i) => i + 1).map(dia => {
            const fechaStr = `${vista.y}-${String(vista.m).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
            const esHoy = vista.y === hoy.getFullYear() && vista.m === hoy.getMonth() + 1 && dia === hoy.getDate()
            const esInicioDia = esIni(fechaStr)
            const esFinDia = esFin(fechaStr)
            const enMedio = enRango(fechaStr) && !esInicioDia && !esFinDia
            let btnCls = "flex items-center justify-center text-sm cursor-pointer transition-colors w-10 h-10"
            if (esInicioDia || esFinDia) {
              btnCls += ' bg-primary text-white font-semibold rounded-full shadow-sm'
            } else if (enMedio) {
              btnCls += ' bg-primary/20 text-primary rounded-none'
              if (paso === 'fin') btnCls += ' font-medium'
            } else {
              btnCls += ' text-texto hover:bg-fondo-gris rounded-full'
            }
            if (esHoy && !esInicioDia && !esFinDia) btnCls += ' ring-1 ring-primary ring-inset'
            return (
              <button
                key={dia}
                type="button"
                className={btnCls}
                onClick={() => {
                  if (paso === 'inicio') {
                    onChangeInicio(fechaStr)
                    onChangeFin('')
                    setPaso('fin')
                  } else {
                    if (fechaStr < inicio) { onChangeFin(inicio); onChangeInicio(fechaStr) }
                    else { onChangeFin(fechaStr) }
                    setPaso('inicio')
                  }
                }}
              >
                {dia}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function presets() {
  const hoy = new Date()
  const hace7 = new Date(hoy)
  hace7.setDate(hoy.getDate() - 6)
  const hace15 = new Date(hoy)
  hace15.setDate(hoy.getDate() - 14)
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  return [
    { id: 'hoy', label: 'Hoy', desde: toISO(hoy), hasta: toISO(hoy) },
    { id: '7dias', label: '7 días', desde: toISO(hace7), hasta: toISO(hoy) },
    { id: '15dias', label: '15 días', desde: toISO(hace15), hasta: toISO(hoy) },
    { id: 'mes', label: 'Este mes', desde: toISO(inicioMes), hasta: toISO(hoy) },
  ]
}

export default function Actividades({ usuario }) {
  const deptoFijo = usuario.rol === 'encargado' ? (usuario.departamento || '') : ''
  const [search, setSearch] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroDepartamento, setFiltroDepartamento] = useState(deptoFijo)
  const [filtroPersonal, setFiltroPersonal] = useState('')
  const [filtroComunidad, setFiltroComunidad] = useState('')
  const [filtroFechaInicio, setFiltroFechaInicio] = useState('')
  const [filtroFechaFin, setFiltroFechaFin] = useState('')
  const [showCalendario, setShowCalendario] = useState(false)
  const [presetSeleccionado, setPresetSeleccionado] = useState('')
  const [page, setPage] = useState(1)
  const [expandedId, setExpandedId] = useState(null)
  const [datos, setDatos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState('')
  const [cats, setCats] = useState(null)
  const ITEMS_PER_PAGE = 5

  useEffect(() => {
    let vivo = true
    async function cargarTodo() {
      try {
        const [c, primero] = await Promise.all([
          api.catalogos(),
          api.registros({ limit: 1000, page: 1 }),
        ])
        if (!vivo) return
        setCats(c)
        let todos = primero.data
        const total = primero.total
        const resto = []
        for (let p = 2; (p - 1) * 1000 < total; p++) {
          resto.push(api.registros({ limit: 1000, page: p }))
        }
        const mas = await Promise.all(resto)
        for (const r of mas) todos = todos.concat(r.data)
        if (!vivo) return
        setDatos(todos.map(mapearRegistro))
      } catch (err) {
        if (vivo) setErrorCarga(err.message)
      } finally {
        if (vivo) setCargando(false)
      }
    }
    cargarTodo()
    return () => { vivo = false }
  }, [])

  const PERSONAL = useMemo(() => {
    if (!cats) return PERSONAL_FALLBACK
    return cats.personal.map(p => ({
      nombre: p.nombre,
      rol: p.tipo === 'tecnico' ? 'Técnico SEA' : 'Gestor Comunitario',
      departamento: p.departamento,
    }))
  }, [cats])

  const COMUNIDADES_POR_DEPTO = useMemo(() => {
    if (!cats) return COMUNIDADES_FALLBACK
    const m = {}
    for (const c of cats.comunidades) {
      if (!c.total || c.total <= 0) continue
      const dep = c.departamento || 'Chimaltenango'
      if (!m[dep]) m[dep] = []
      m[dep].push(c.nombre)
    }
    return m
  }, [cats])

  const DEPARTAMENTOS = useMemo(() => {
    if (!cats) return DEPARTAMENTOS_FALLBACK
    return cats.departamentos.map(d => d.nombre)
  }, [cats])

  const baseData = useMemo(() => {
    let data = datos
    if (usuario.rol === 'gestor' || usuario.rol === 'tecnico') {
      data = data.filter(a => a.personal === usuario.nombre)
    }
    return data
  }, [datos, usuario.rol, usuario.nombre])

  const filtered = useMemo(() => {
    return baseData.filter(a => {
      const matchSearch = !search || Object.values(a).some(v => v && String(v).toLowerCase().includes(search.toLowerCase()))
      const matchTipo = !filtroTipo || a.tipoRegistro === filtroTipo
      const matchDepartamento = !filtroDepartamento || a.departamento === filtroDepartamento
      const matchPersonal = !filtroPersonal || a.personal === filtroPersonal
      const matchComunidad = !filtroComunidad || a.comunidad === filtroComunidad
      const rangoValido = !filtroFechaInicio || !filtroFechaFin || filtroFechaInicio <= filtroFechaFin
      const matchFecha = !rangoValido
        ? true
        : (!filtroFechaInicio || a.fecha >= filtroFechaInicio) && (!filtroFechaFin || a.fecha <= filtroFechaFin)
      return matchSearch && matchTipo && matchDepartamento && matchPersonal && matchComunidad && matchFecha
    })
  }, [baseData, search, filtroTipo, filtroDepartamento, filtroPersonal, filtroComunidad, filtroFechaInicio, filtroFechaFin])

  const paginated = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE
    return filtered.slice(start, start + ITEMS_PER_PAGE)
  }, [filtered, page])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)

  const comunidadesFiltradas = useMemo(() => {
    if (!filtroDepartamento) return Object.values(COMUNIDADES_POR_DEPTO).flat()
    return COMUNIDADES_POR_DEPTO[filtroDepartamento] || []
  }, [filtroDepartamento])

  const personalFiltrado = useMemo(() => {
    if (!filtroDepartamento) return PERSONAL
    return PERSONAL.filter(p => p.departamento === filtroDepartamento)
  }, [filtroDepartamento])

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const renderEntregables = (entregables) => {
    if (!entregables || entregables.length === 0) return <span className="text-texto-secundario text-sm">Sin entregables</span>
    return (
      <div className="space-y-1">
        {entregables.map((e, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className={`w-4 h-4 rounded ${e.cumplido ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className={e.cumplido ? 'text-green-700' : 'text-red-700'}>
              {e.nombre} <span className="text-texto-secundario">(máx: {formatFechaCorta(e.fechaMaxima)})</span>
            </span>
          </div>
        ))}
      </div>
    )
  }

  const renderFotos = (fotos) => {
    const validFotos = fotos?.filter(f => f) || []
    if (validFotos.length === 0) return <span className="text-texto-secundario text-sm">Sin fotos</span>
    const abrirFoto = async (url) => {
      try {
        const res = await fetch(url, { headers: { Authorization: `Bearer ${getToken()}` } })
        if (!res.ok) throw new Error()
        const blob = await res.blob()
        window.open(URL.createObjectURL(blob), '_blank')
      } catch {
        alert('No se pudo abrir la foto')
      }
    }
    return (
      <div className="flex gap-2">
        {validFotos.map((foto, i) => (
          <button key={i} onClick={() => abrirFoto(foto)} className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors">
            Foto {i + 1}
          </button>
        ))}
      </div>
    )
  }

  const renderField = (label, value, condition = true) => {
    if (!condition || value === null || value === undefined || value === '' || value === '-') return null
    return (
      <div className="flex flex-col sm:flex-row gap-1 sm:gap-4 py-1 border-b border-[#d6d6d6] last:border-0">
        <span className="text-xs text-texto-secundario font-medium w-full sm:w-32 flex-shrink-0">{label}:</span>
        <span className="text-sm text-texto flex-1">{value}</span>
      </div>
    )
  }

  const tieneDetalleCampo = (item) => {
    const d = item.detalleCampo
    if (!d) return false
    return d.comunidades || d.nombres || d.famVisitadas > 0 || d.famCaracterizadas > 0 ||
      d.famInscritas > 0 || d.eduInscritas > 0 || d.eduCapacitadas > 0 ||
      d.eduAcompanadas > 0 || d.participantes > 0
  }

  const renderContador = (label, value) => {
    if (!value || value <= 0) return null
    return (
      <div className="bg-fondo-gris rounded-lg px-3 py-2 text-center">
        <div className="text-lg font-bold text-primary">{value}</div>
        <div className="text-[11px] text-texto-secundario leading-tight">{label}</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-texto" style={{ fontFamily: 'var(--font-heading)' }}>Actividades</h2>
        <p className="text-sm text-texto-secundario">
          {cargando ? 'Cargando registros...' : `${filtered.length} registros ${baseData.length !== filtered.length ? `(de ${baseData.length} totales)` : ''}`}
        </p>
      </div>

      {errorCarga && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          No se pudieron cargar los datos: {errorCarga}
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-lg border border-borde border-t-2 border-t-dorado p-4 space-y-4">
        {/* Buscador — ancho completo */}
        <div className="relative">
          <label className="block text-xs font-medium text-texto-secundario mb-1">Buscar</label>
          <div className="relative">
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-texto-secundario" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Buscar por actividad, personal, comunidad, departamento..."
              className="w-full pl-9 pr-4 py-2 border border-borde rounded-lg focus:ring-2 focus:ring-dorado focus:border-dorado outline-none text-sm"
            />
          </div>
        </div>

        {/* Filtros — grid responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-texto-secundario mb-1">Tipo</label>
            <select
              value={filtroTipo}
              onChange={(e) => { setFiltroTipo(e.target.value); setPage(1) }}
              className="w-full px-3 py-2 border border-borde rounded-lg focus:ring-2 focus:ring-dorado focus:border-dorado outline-none text-sm bg-white"
            >
              <option value="">Todos</option>
              <option value="Actividad">Actividad</option>
              <option value="Permiso">Permiso</option>
            </select>
          </div>

          {usuario.rol === 'monitor' && (
            <>
              <div>
                <label className="block text-xs font-medium text-texto-secundario mb-1">Departamento</label>
                <select
                  value={filtroDepartamento}
                  onChange={(e) => {
                    setFiltroDepartamento(e.target.value)
                    setFiltroComunidad('')
                    setFiltroPersonal('')
                    setPage(1)
                  }}
                  className="w-full px-3 py-2 border border-borde rounded-lg focus:ring-2 focus:ring-dorado focus:border-dorado outline-none text-sm bg-white"
                >
                  <option value="">Todos</option>
                  {DEPARTAMENTOS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-texto-secundario mb-1">Comunidad</label>
                <select
                  value={filtroComunidad}
                  onChange={(e) => { setFiltroComunidad(e.target.value); setPage(1) }}
                  className="w-full px-3 py-2 border border-borde rounded-lg focus:ring-2 focus:ring-dorado focus:border-dorado outline-none text-sm bg-white"
                >
                  <option value="">Todas</option>
                  {comunidadesFiltradas.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-texto-secundario mb-1">Personal</label>
                <select
                  value={filtroPersonal}
                  onChange={(e) => { setFiltroPersonal(e.target.value); setPage(1) }}
                  className="w-full px-3 py-2 border border-borde rounded-lg focus:ring-2 focus:ring-dorado focus:border-dorado outline-none text-sm bg-white"
                >
                  <option value="">Todos</option>
                  {['Técnico SEA', 'Gestor Comunitario'].map(rol => {
                    const grupo = personalFiltrado.filter(p => p.rol === rol)
                    if (grupo.length === 0) return null
                    return (
                      <optgroup key={rol} label={rol}>
                        {grupo.map(p => (
                          <option key={p.nombre} value={p.nombre}>{p.nombre}</option>
                        ))}
                      </optgroup>
                    )
                  })}
                </select>
              </div>

              <div className="sm:col-span-2 lg:col-span-2">
                <label className="block text-xs font-medium text-texto-secundario mb-1">Rango de fechas</label>
                <div className="flex flex-wrap items-center gap-1.5">
                  {presets().map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => { setPresetSeleccionado(p.id); setFiltroFechaInicio(p.desde); setFiltroFechaFin(p.hasta); setShowCalendario(false); setPage(1) }}
                      className={`px-2.5 py-1 rounded-md text-xs border transition-colors ${
                        presetSeleccionado === p.id
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white text-texto-secundario border-borde hover:bg-fondo-gris'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => { setShowCalendario(!showCalendario); setPresetSeleccionado('') }}
                    className={`px-2.5 py-1 rounded-md text-xs border flex items-center gap-1 transition-colors ${
                  showCalendario
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-texto-secundario border-borde hover:bg-fondo-gris'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Personalizado
              </button>
              {(filtroFechaInicio || filtroFechaFin) && (
                <button
                  type="button"
                  onClick={() => { setFiltroFechaInicio(''); setFiltroFechaFin(''); setPresetSeleccionado(''); setShowCalendario(false); setPage(1) }}
                  className="px-2.5 py-1 rounded-md text-xs border border-borde bg-white text-texto-secundario hover:bg-fondo-gris"
                >
                  Limpiar
                </button>
              )}
            </div>

            {showCalendario && (
              <div className="mt-2 p-2 border border-borde rounded-lg bg-fondo-gris max-w-xs">
                <SelectorRango
                  inicio={filtroFechaInicio}
                  fin={filtroFechaFin}
                  onChangeInicio={(v) => { setFiltroFechaInicio(v); setPage(1) }}
                  onChangeFin={(v) => { setFiltroFechaFin(v); setPage(1) }}
                />
              </div>
            )}
          </div>
            </>
          )}
        </div>
      </div>

      {/* Tabla — Desktop (≥768px) */}
      <div className="hidden md:block bg-white rounded-lg border border-borde">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-fondo-gris border-b border-borde">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-texto-secundario uppercase tracking-wider">Día</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-texto-secundario uppercase tracking-wider">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-texto-secundario uppercase tracking-wider">Personal</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-texto-secundario uppercase tracking-wider">Localidad</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-texto-secundario uppercase tracking-wider">Comunidad</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-texto-secundario uppercase tracking-wider">Actividad</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-texto-secundario uppercase tracking-wider">Viático</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-texto-secundario uppercase tracking-wider">Tipo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d6d6d6]">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-texto-secundario">No hay actividades</td>
                </tr>
              ) : (
                paginated.map((item) => (
                  <React.Fragment key={item.id}>
                    <tr
                      className={`hover:bg-fondo-gris cursor-pointer transition-colors ${item.tipoRegistro === 'Permiso' ? 'bg-red-50' : ''} ${expandedId === item.id ? 'bg-blue-50' : ''}`}
                      onClick={() => toggleExpand(item.id)}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-texto">{item.dia}</td>
                      <td className="px-4 py-3 text-sm text-texto">{formatFechaCorta(item.fecha)}</td>
                      <td className="px-4 py-3 text-sm text-texto">{item.personal}</td>
                      <td className="px-4 py-3 text-sm text-texto">{item.departamento}</td>
                      <td className="px-4 py-3 text-sm text-texto">{item.comunidad}</td>
                      <td className="px-4 py-3 text-sm text-texto max-w-xs truncate" title={item.actividad}>{item.actividad}</td>
                      <td className="px-4 py-3 text-center text-sm font-medium text-primary">Q{item.viatico.toLocaleString()}</td>
                      <td className="px-4 py-3 text-center">
                        {item.tipoRegistro === 'Permiso' ? (
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-[#fff3e6] text-coral">Permiso</span>
                        ) : (
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-[#f0e6f6] text-fucsia">Actividad</span>
                        )}
                      </td>
                    </tr>
                    {expandedId === item.id && (
                      <tr className="bg-fondo-gris border-t-2 border-primary">
                        <td colSpan={8} className="px-4 py-4">
                          <div className="p-4 bg-white rounded-lg border border-borde space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                              <div className="space-y-1">
                                {renderField('Día', item.dia)}
                                {renderField('Fecha', formatFecha(item.fecha))}
                                {renderField('Localidad', item.departamento)}
                                {renderField('Comunidad', item.comunidad)}
                                {renderField('Personal', item.personal)}
                                {renderField('Rol', item.rol)}
                                {renderField('Tipo', item.tipoRegistro)}
                              </div>
                              <div className="space-y-1">
                                {renderField('Horario', item.horario)}
                                {renderField('Transporte', item.transporte)}
                                {renderField('Kilometraje', `${item.kilometraje} km`, item.transporte === 'Vehículo propio' && item.kilometraje)}
                                {renderField('Viático', `Q${item.viatico.toLocaleString()}`)}
                                {renderField('Coincide con planificación', item.coincidePlanificacion === true ? 'Sí' : item.coincidePlanificacion === false ? 'No' : 'N/A', item.coincidePlanificacion !== null)}
                              </div>
                            </div>

                            {item.resumen && (
                              <div>
                                <span className="text-xs text-texto-secundario font-medium">Resumen de actividad:</span>
                                <p className="text-sm text-texto mt-1 leading-relaxed">{item.resumen}</p>
                              </div>
                            )}

                            {(item.dificultad || item.solucion) && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                                {renderField('Dificultad', item.dificultad, item.dificultad)}
                                {renderField('Solución', item.solucion, item.solucion)}
                              </div>
                            )}

                            {tieneDetalleCampo(item) && (
                              <div>
                                <span className="text-xs text-texto-secundario font-medium">Detalle de campo:</span>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
                                  {renderContador('Fam. visitadas', item.detalleCampo.famVisitadas)}
                                  {renderContador('Fam. caracterizadas', item.detalleCampo.famCaracterizadas)}
                                  {renderContador('Fam. inscritas', item.detalleCampo.famInscritas)}
                                  {renderContador('Edu. inscritas', item.detalleCampo.eduInscritas)}
                                  {renderContador('Edu. capacitadas', item.detalleCampo.eduCapacitadas)}
                                  {renderContador('Edu. acompañadas', item.detalleCampo.eduAcompanadas)}
                                  {renderContador('Participantes', item.detalleCampo.participantes)}
                                </div>
                                {item.detalleCampo.comunidades && (
                                  <p className="text-sm text-texto mt-2">Comunidades caracterizadas: {item.detalleCampo.comunidades}</p>
                                )}
                                {item.detalleCampo.nombres && (
                                  <p className="text-sm text-texto-secundario mt-1">Participantes: {item.detalleCampo.nombres}</p>
                                )}
                              </div>
                            )}

                            {item.observaciones && (
                              <div>
                                <span className="text-xs text-texto-secundario font-medium">Observaciones:</span>
                                <p className="text-sm text-texto mt-1">{item.observaciones}</p>
                              </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 pt-2 border-t border-[#d6d6d6]">
                              <div>
                                <span className="text-xs text-texto-secundario font-medium">Entregables:</span>
                                <div className="mt-1">{renderEntregables(item.entregables)}</div>
                              </div>
                              <div>
                                <span className="text-xs text-texto-secundario font-medium">Fotos:</span>
                                <div className="mt-1">{renderFotos(item.fotos)}</div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación desktop */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-borde flex items-center justify-between">
            <p className="text-sm text-texto-secundario">Página {page} de {totalPages} — {filtered.length} resultados</p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 text-sm border border-borde rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-fondo-gris transition-colors">Anterior</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 text-sm border border-borde rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-fondo-gris transition-colors">Siguiente</button>
            </div>
          </div>
        )}
      </div>

      {/* Cards — Móvil (<768px) */}
      <div className="md:hidden space-y-3">
        {paginated.length === 0 ? (
          <div className="bg-white rounded-lg border border-borde px-4 py-12 text-center text-texto-secundario">
            No hay actividades
          </div>
        ) : (
          paginated.map((item) => (
            <div
              key={item.id}
              onClick={() => toggleExpand(item.id)}
              className={`bg-white rounded-lg border cursor-pointer transition-colors ${
                item.tipoRegistro === 'Permiso' ? 'border-red-200 bg-red-50' : 'border-borde'
              } ${expandedId === item.id ? 'ring-2 ring-primary border-primary' : ''}`}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-texto">{item.dia}</span>
                    <span className="text-xs text-texto-secundario">{formatFechaCorta(item.fecha)}</span>
                  </div>
                  {item.tipoRegistro === 'Permiso' ? (
                    <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-[#fff3e6] text-coral">Permiso</span>
                  ) : (
                    <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-[#f0e6f6] text-fucsia">Actividad</span>
                  )}
                </div>
                <p className="text-sm text-texto font-medium mb-1">{item.personal}</p>
                <p className="text-xs text-texto-secundario mb-2">{item.comunidad}</p>
                <p className="text-sm text-texto line-clamp-2 mb-2">{item.actividad}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-primary">Q{item.viatico.toLocaleString()}</span>
                  <svg className={`w-4 h-4 text-texto-secundario transition-transform ${expandedId === item.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {expandedId === item.id && (
                <div className="px-4 pb-4 pt-2 border-t border-[#d6d6d6] space-y-2">
                  {renderField('Fecha completa', formatFecha(item.fecha))}
                  {renderField('Localidad', item.departamento)}
                  {renderField('Rol', item.rol)}
                  {renderField('Horario', item.horario)}
                  {renderField('Transporte', item.transporte)}
                  {renderField('Kilometraje', `${item.kilometraje} km`, item.transporte === 'Vehículo propio' && item.kilometraje)}
                  {renderField('Resumen', item.resumen, true)}
                  {renderField('Dificultad', item.dificultad, item.dificultad)}
                  {renderField('Solución', item.solucion, item.solucion)}
                  {tieneDetalleCampo(item) && (
                    <div className="pt-1">
                      <span className="text-xs text-texto-secundario font-medium">Detalle de campo:</span>
                      <div className="grid grid-cols-3 gap-1.5 mt-1">
                        {renderContador('Fam. visitadas', item.detalleCampo.famVisitadas)}
                        {renderContador('Fam. caracterizadas', item.detalleCampo.famCaracterizadas)}
                        {renderContador('Fam. inscritas', item.detalleCampo.famInscritas)}
                        {renderContador('Edu. inscritas', item.detalleCampo.eduInscritas)}
                        {renderContador('Edu. capacitadas', item.detalleCampo.eduCapacitadas)}
                        {renderContador('Edu. acompañadas', item.detalleCampo.eduAcompanadas)}
                        {renderContador('Participantes', item.detalleCampo.participantes)}
                      </div>
                    </div>
                  )}
                  {renderField('Coincide con planificación', item.coincidePlanificacion === true ? 'Sí' : item.coincidePlanificacion === false ? 'No' : 'N/A', item.coincidePlanificacion !== null)}
                  {renderField('Observaciones', item.observaciones, item.observaciones)}
                  <div>
                    <span className="text-xs text-texto-secundario font-medium">Entregables:</span>
                    <div className="mt-1">{renderEntregables(item.entregables)}</div>
                  </div>
                  <div>
                    <span className="text-xs text-texto-secundario font-medium">Fotos:</span>
                    <div className="mt-1">{renderFotos(item.fotos)}</div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}

        {/* Paginación móvil */}
        {totalPages > 1 && (
          <div className="px-1 py-3 flex items-center justify-between">
            <p className="text-xs text-texto-secundario">{page}/{totalPages} — {filtered.length} res.</p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-xs border border-borde rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-fondo-gris transition-colors">Ant.</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 text-xs border border-borde rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-fondo-gris transition-colors">Sig.</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}