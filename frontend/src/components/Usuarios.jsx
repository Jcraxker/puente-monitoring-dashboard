import { useState, useEffect, useMemo } from 'react'
import { api } from '../api'

const ROLES = [
  { id: 'monitor', label: 'Monitor', detalle: 'Ve y administra todo el sistema' },
  { id: 'encargado', label: 'Encargado', detalle: 'Ve el proyecto y sus colaboradores' },
  { id: 'gestor', label: 'Gestor', detalle: 'Ve sus propias actividades y viáticos' },
  { id: 'tecnico', label: 'Técnico', detalle: 'Registra sus actividades' },
]

const ROL_META = {
  monitor: { label: 'Monitor', clase: 'bg-primary/10 text-acento', punto: 'bg-primary' },
  encargado: { label: 'Encargado', clase: 'bg-secondary/10 text-secondary', punto: 'bg-secondary' },
  gestor: { label: 'Gestor', clase: 'bg-fucsia-suave text-fucsia', punto: 'bg-fucsia' },
  tecnico: { label: 'Técnico', clase: 'bg-coral-suave text-coral', punto: 'bg-coral' },
}

const INPUT_CLS = 'w-full px-3 py-2.5 border border-borde rounded-lg text-sm text-texto bg-superficie placeholder:text-texto-tenue focus:ring-2 focus:ring-dorado focus:border-dorado outline-none transition-colors'
const SELECT_CLS = INPUT_CLS + ' appearance-none pr-9 cursor-pointer'
const BTN_PRIMARIO = 'inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
const BTN_SECUNDARIO = 'inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border border-borde text-texto-secundario hover:bg-superficie-hover hover:text-texto transition-colors'
const BTN_ICONO = 'w-9 h-9 inline-flex items-center justify-center rounded-lg border border-borde text-texto-secundario hover:bg-superficie-hover hover:text-texto focus-visible:ring-2 focus-visible:ring-dorado outline-none transition-colors'

const ICONOS = {
  mas: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />,
  buscar: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />,
  editar: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M4 20h4l10.5-10.5a2.5 2.5 0 00-3.536-3.536L4.5 16.5V20z" />,
  clave: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.03 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />,
  volver: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />,
  cerrar: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />,
  usuarios: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />,
  escudo: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />,
  usuario: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
}

function Icono({ nombre, clase = 'w-4 h-4' }) {
  return (
    <svg className={clase} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      {ICONOS[nombre]}
    </svg>
  )
}

function Select({ id, value, onChange, required, children, className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <select id={id} value={value} onChange={onChange} required={required} className={SELECT_CLS}>
        {children}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-texto-secundario">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </span>
    </div>
  )
}

function BadgeRol({ rol }) {
  const meta = ROL_META[rol] || { label: rol, clase: 'bg-superficie-hover text-texto-secundario', punto: 'bg-texto-tenue' }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${meta.clase}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${meta.punto}`} aria-hidden="true" />
      {meta.label}
    </span>
  )
}

function Avatar({ usuario }) {
  const meta = ROL_META[usuario.rol] || { clase: 'bg-superficie-hover text-texto-secundario' }
  return (
    <span className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${meta.clase}`} aria-hidden="true">
      {usuario.nombre.charAt(0).toUpperCase()}
    </span>
  )
}

function Switch({ activo, nombre, onCambiar }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      aria-label={`${nombre}: ${activo ? 'activo' : 'inactivo'}. Cambiar estado`}
      onClick={onCambiar}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50 focus-visible:ring-offset-2 ${
        activo ? 'bg-secondary' : 'bg-borde-fuerte'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
          activo ? 'translate-x-[18px]' : 'translate-x-[3px]'
        }`}
      />
    </button>
  )
}

function Estado({ usuario, onCambiar }) {
  return (
    <div className="flex items-center gap-2.5">
      <Switch activo={usuario.activo} nombre={usuario.nombre} onCambiar={onCambiar} />
      <span className={`text-xs font-medium ${usuario.activo ? 'text-secondary' : 'text-texto-tenue'}`}>
        {usuario.activo ? 'Activo' : 'Inactivo'}
      </span>
    </div>
  )
}

function Acciones({ usuario, onEditar, onClave, compacto = false }) {
  return (
    <div className={`flex items-center ${compacto ? 'gap-1.5' : 'justify-end gap-1.5'}`}>
      <button
        type="button"
        onClick={onEditar}
        className={BTN_ICONO}
        title={`Editar ${usuario.nombre}`}
        aria-label={`Editar ${usuario.nombre}`}
      >
        <Icono nombre="editar" />
      </button>
      <button
        type="button"
        onClick={onClave}
        className={BTN_ICONO}
        title={`Cambiar contraseña de ${usuario.nombre}`}
        aria-label={`Cambiar contraseña de ${usuario.nombre}`}
      >
        <Icono nombre="clave" />
      </button>
    </div>
  )
}

export default function Usuarios() {
  const [lista, setLista] = useState([])
  const [deptos, setDeptos] = useState([])
  const [personal, setPersonal] = useState([])
  const [cargando, setCargando] = useState(true)
  const [msg, setMsg] = useState(null)
  const [vista, setVista] = useState('lista')
  const [form, setForm] = useState({ username: '', password: '', nombre: '', rol: 'gestor', departamento_id: '', personal_id: '' })
  const [cambio, setCambio] = useState({ id: null, nombre: '', nueva: '', monitor: '' })
  const [editar, setEditar] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')

  const cargar = async () => {
    try {
      const [u, c] = await Promise.all([api.usuarios(), api.catalogos()])
      setLista(u.data || [])
      setDeptos(c.departamentos || [])
      setPersonal(c.personal || [])
    } catch (err) {
      setMsg({ tipo: 'error', texto: err.message })
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const crear = async (e) => {
    e.preventDefault()
    setGuardando(true)
    try {
      await api.crearUsuario({
        ...form,
        departamento_id: form.departamento_id ? Number(form.departamento_id) : null,
        personal_id: form.personal_id ? Number(form.personal_id) : null,
      })
      setForm({ username: '', password: '', nombre: '', rol: 'gestor', departamento_id: '', personal_id: '' })
      setMsg({ tipo: 'exito', texto: 'Usuario creado correctamente' })
      setVista('lista')
      cargar()
    } catch (err) {
      setMsg({ tipo: 'error', texto: err.message })
    } finally {
      setGuardando(false)
    }
  }

  const vinculados = new Set(lista.map(u => u.personal_id).filter(Boolean))
  const personalDisponible = (deptoId, actualId) =>
    personal.filter(p =>
      (!deptoId || String(p.departamento_id) === String(deptoId)) &&
      (!vinculados.has(p.id) || p.id === actualId)
    )

  const guardarEdicion = async (e) => {
    e.preventDefault()
    setGuardando(true)
    try {
      await api.actualizarUsuario(editar.id, {
        nombre: editar.nombre,
        rol: editar.rol,
        departamento_id: editar.departamento_id ? Number(editar.departamento_id) : null,
        personal_id: editar.personal_id ? Number(editar.personal_id) : null,
      })
      setEditar(null)
      setMsg({ tipo: 'exito', texto: 'Usuario actualizado' })
      cargar()
    } catch (err) {
      setMsg({ tipo: 'error', texto: err.message })
    } finally {
      setGuardando(false)
    }
  }

  const cambiarClave = async (e) => {
    e.preventDefault()
    setGuardando(true)
    try {
      await api.cambiarClave(cambio.id, { nueva: cambio.nueva, monitor: cambio.monitor })
      setCambio({ id: null, nombre: '', nueva: '', monitor: '' })
      setMsg({ tipo: 'exito', texto: 'Clave actualizada' })
    } catch (err) {
      setMsg({ tipo: 'error', texto: err.message })
    } finally {
      setGuardando(false)
    }
  }

  const toggle = async (u) => {
    try {
      await api.toggleUsuario(u.id)
      setMsg({ tipo: 'exito', texto: `${u.nombre} ${u.activo ? 'desactivado' : 'activado'}` })
      cargar()
    } catch (err) {
      setMsg({ tipo: 'error', texto: err.message })
    }
  }

  const activos = useMemo(() => lista.filter(u => u.activo).length, [lista])

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return lista.filter(u => {
      if (filtroEstado === 'activos' && !u.activo) return false
      if (filtroEstado === 'inactivos' && u.activo) return false
      if (!q) return true
      return [u.nombre, u.username, u.departamento, u.personal, u.rol]
        .some(v => String(v || '').toLowerCase().includes(q))
    })
  }, [lista, busqueda, filtroEstado])

  const irANuevo = () => { setMsg(null); setVista('nuevo') }
  const abrirEdicion = (u) => setEditar({ ...u, departamento_id: u.departamento_id || '', personal_id: u.personal_id || '' })
  const abrirClave = (u) => setCambio({ id: u.id, nombre: u.nombre, nueva: '', monitor: '' })
  const limpiarFiltros = () => { setBusqueda(''); setFiltroEstado('todos') }
  const hayFiltros = busqueda.trim() !== '' || filtroEstado !== 'todos'

  const mensaje = msg && (
    <div
      className={`flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${
        msg.tipo === 'exito'
          ? 'bg-exito-suave border-exito-borde text-exito'
          : 'bg-peligro-suave border-peligro-borde text-peligro'
      }`}
      role="status"
    >
      <span>{msg.texto}</span>
      <button type="button" onClick={() => setMsg(null)} className="opacity-70 hover:opacity-100 flex-shrink-0" aria-label="Cerrar aviso">
        <Icono nombre="cerrar" />
      </button>
    </div>
  )

  // ===== VISTA: NUEVO USUARIO =====
  if (vista === 'nuevo') {
    const necesitaDepto = ['encargado', 'gestor', 'tecnico'].includes(form.rol)
    const necesitaPersona = ['gestor', 'tecnico'].includes(form.rol)
    const rolActual = ROLES.find(r => r.id === form.rol)

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setVista('lista')} className={BTN_ICONO} aria-label="Volver a la lista" title="Volver">
            <Icono nombre="volver" />
          </button>
          <div>
            <h2 className="text-xl font-semibold text-texto" style={{ fontFamily: 'var(--font-heading)' }}>Nuevo usuario</h2>
            <p className="text-sm text-texto-secundario">Crea una cuenta y define qué puede ver</p>
          </div>
        </div>

        {mensaje}

        <form onSubmit={crear} className="space-y-4 max-w-3xl">
          <section className="bg-superficie rounded-xl border border-borde">
            <header className="px-5 py-3 border-b border-borde">
              <h3 className="text-sm font-semibold text-texto">Datos de acceso</h3>
              <p className="text-xs text-texto-secundario mt-0.5">Con esto la persona entra al sistema</p>
            </header>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="nuevo-nombre" className="block text-xs font-medium text-texto-secundario mb-1.5">Nombre completo</label>
                <input id="nuevo-nombre" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Ej. Juan Pérez" required className={INPUT_CLS} />
              </div>
              <div>
                <label htmlFor="nuevo-usuario" className="block text-xs font-medium text-texto-secundario mb-1.5">Usuario</label>
                <input id="nuevo-usuario" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
                  placeholder="Ej. jperez" required autoComplete="off" className={INPUT_CLS + ' font-mono'} />
                <p className="text-[11px] text-texto-tenue mt-1">Sin espacios ni acentos</p>
              </div>
              <div>
                <label htmlFor="nuevo-clave" className="block text-xs font-medium text-texto-secundario mb-1.5">Contraseña</label>
                <input id="nuevo-clave" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="Mínimo 4 caracteres" required minLength={4} autoComplete="new-password" className={INPUT_CLS} />
                <p className="text-[11px] text-texto-tenue mt-1">Se puede cambiar después</p>
              </div>
            </div>
          </section>

          <section className="bg-superficie rounded-xl border border-borde">
            <header className="px-5 py-3 border-b border-borde">
              <h3 className="text-sm font-semibold text-texto">Rol y asignación</h3>
              <p className="text-xs text-texto-secundario mt-0.5">Define el alcance de lo que puede consultar</p>
            </header>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="nuevo-rol" className="block text-xs font-medium text-texto-secundario mb-1.5">Rol</label>
                <Select id="nuevo-rol" value={form.rol}
                  onChange={e => setForm({ ...form, rol: e.target.value, departamento_id: '', personal_id: '' })}>
                  {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                </Select>
                <p className="text-[11px] text-texto-tenue mt-1">{rolActual?.detalle}</p>
              </div>
              {necesitaDepto && (
                <div>
                  <label htmlFor="nuevo-depto" className="block text-xs font-medium text-texto-secundario mb-1.5">Departamento</label>
                  <Select id="nuevo-depto" value={form.departamento_id} required
                    onChange={e => setForm({ ...form, departamento_id: e.target.value, personal_id: '' })}>
                    <option value="">Seleccionar...</option>
                    {deptos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                  </Select>
                </div>
              )}
              {necesitaPersona && (
                <div className={necesitaDepto ? '' : 'sm:col-span-2'}>
                  <label htmlFor="nuevo-persona" className="block text-xs font-medium text-texto-secundario mb-1.5">Persona de campo</label>
                  <Select id="nuevo-persona" value={form.personal_id} required
                    onChange={e => setForm({ ...form, personal_id: e.target.value })}>
                    <option value="">Seleccionar...</option>
                    {personalDisponible(form.departamento_id, null).map(p => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </Select>
                  {!form.departamento_id && <p className="text-[11px] text-texto-tenue mt-1">Elige primero el departamento</p>}
                </div>
              )}
            </div>
          </section>

          <div className="flex gap-3">
            <button type="submit" disabled={guardando} className={BTN_PRIMARIO}>
              {guardando
                ? <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                : <Icono nombre="mas" />}
              Crear usuario
            </button>
            <button type="button" onClick={() => setVista('lista')} className={BTN_SECUNDARIO}>Cancelar</button>
          </div>
        </form>
      </div>
    )
  }

  // ===== VISTA: LISTA =====
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-texto" style={{ fontFamily: 'var(--font-heading)' }}>Usuarios</h2>
          <p className="text-sm text-texto-secundario mt-0.5">
            {lista.length} {lista.length === 1 ? 'cuenta' : 'cuentas'} · {activos} {activos === 1 ? 'activa' : 'activas'} · {lista.length - activos} {lista.length - activos === 1 ? 'inactiva' : 'inactivas'}
          </p>
        </div>
        <button type="button" onClick={irANuevo} className={BTN_PRIMARIO}>
          <Icono nombre="mas" />
          Nuevo usuario
        </button>
      </div>

      {mensaje}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-texto-tenue pointer-events-none">
            <Icono nombre="buscar" />
          </span>
          <input
            type="search"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o usuario"
            aria-label="Buscar usuarios"
            className={INPUT_CLS + ' pl-9'}
          />
        </div>
        <div className="flex gap-1 p-1 bg-superficie border border-borde rounded-lg" role="group" aria-label="Filtrar por estado">
          {[
            { id: 'todos', label: 'Todos', n: lista.length },
            { id: 'activos', label: 'Activos', n: activos },
            { id: 'inactivos', label: 'Inactivos', n: lista.length - activos },
          ].map(op => (
            <button
              key={op.id}
              type="button"
              onClick={() => setFiltroEstado(op.id)}
              aria-pressed={filtroEstado === op.id}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filtroEstado === op.id ? 'bg-primary/10 text-acento' : 'text-texto-secundario hover:bg-superficie-hover hover:text-texto'
              }`}
            >
              {op.label}
              <span className="ml-1.5 text-texto-tenue">{op.n}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tabla desktop */}
      <div className="hidden md:block bg-superficie rounded-xl border border-borde overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-superficie-alt border-b border-borde">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-texto-secundario uppercase tracking-wide">Usuario</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-texto-secundario uppercase tracking-wide">Rol</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-texto-secundario uppercase tracking-wide">Departamento</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-texto-secundario uppercase tracking-wide hidden lg:table-cell">Persona</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-texto-secundario uppercase tracking-wide">Estado</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-texto-secundario uppercase tracking-wide">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borde">
            {cargando ? (
              [...Array(4)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-4 py-4" colSpan={6}>
                    <div className="h-4 bg-superficie-hover rounded w-1/3" />
                  </td>
                </tr>
              ))
            ) : filtrados.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12">
                  <div className="flex flex-col items-center text-center gap-2">
                    <span className="w-12 h-12 rounded-full bg-superficie-hover text-texto-tenue flex items-center justify-center">
                      <Icono nombre="usuarios" clase="w-6 h-6" />
                    </span>
                    <p className="text-sm font-medium text-texto">
                      {hayFiltros ? 'Ningún usuario coincide' : 'Todavía no hay usuarios'}
                    </p>
                    <p className="text-xs text-texto-secundario">
                      {hayFiltros ? 'Probá con otro término o quitá los filtros' : 'Creá la primera cuenta para empezar'}
                    </p>
                    {hayFiltros && (
                      <button type="button" onClick={limpiarFiltros} className="mt-1 text-xs font-medium text-acento hover:underline">
                        Limpiar filtros
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : filtrados.map(u => (
              <tr key={u.id} className="hover:bg-superficie-hover transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar usuario={u} />
                    <div className="min-w-0">
                      <p className="font-medium text-texto truncate">{u.nombre}</p>
                      <p className="font-mono text-[11px] text-texto-secundario truncate">@{u.username}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3"><BadgeRol rol={u.rol} /></td>
                <td className="px-4 py-3 text-texto">{u.departamento || <span className="text-texto-tenue">—</span>}</td>
                <td className="px-4 py-3 text-texto hidden lg:table-cell">{u.personal || <span className="text-texto-tenue">—</span>}</td>
                <td className="px-4 py-3"><Estado usuario={u} onCambiar={() => toggle(u)} /></td>
                <td className="px-4 py-3">
                  <Acciones usuario={u} onEditar={() => abrirEdicion(u)} onClave={() => abrirClave(u)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tarjetas móvil */}
      <div className="md:hidden space-y-3">
        {cargando ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="bg-superficie rounded-xl border border-borde p-4 animate-pulse">
              <div className="h-4 bg-superficie-hover rounded w-2/3 mb-2" />
              <div className="h-3 bg-superficie-hover rounded w-1/3" />
            </div>
          ))
        ) : filtrados.length === 0 ? (
          <div className="bg-superficie rounded-xl border border-borde px-4 py-10 text-center">
            <span className="w-12 h-12 mx-auto mb-2 rounded-full bg-superficie-hover text-texto-tenue flex items-center justify-center">
              <Icono nombre="usuarios" clase="w-6 h-6" />
            </span>
            <p className="text-sm font-medium text-texto">{hayFiltros ? 'Ningún usuario coincide' : 'Todavía no hay usuarios'}</p>
            <p className="text-xs text-texto-secundario mt-1">
              {hayFiltros ? 'Probá con otro término o quitá los filtros' : 'Creá la primera cuenta para empezar'}
            </p>
            {hayFiltros && (
              <button type="button" onClick={limpiarFiltros} className="mt-2 text-xs font-medium text-acento hover:underline">
                Limpiar filtros
              </button>
            )}
          </div>
        ) : filtrados.map(u => (
          <div key={u.id} className="bg-superficie rounded-xl border border-borde p-4">
            <div className="flex items-start gap-3">
              <Avatar usuario={u} />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-texto truncate">{u.nombre}</p>
                <p className="font-mono text-[11px] text-texto-secundario truncate">@{u.username}</p>
              </div>
              <BadgeRol rol={u.rol} />
            </div>
            <dl className="mt-3 space-y-1 text-xs">
              <div className="flex justify-between gap-3">
                <dt className="text-texto-secundario">Departamento</dt>
                <dd className="text-texto text-right">{u.departamento || '—'}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-texto-secundario">Persona</dt>
                <dd className="text-texto text-right">{u.personal || '—'}</dd>
              </div>
            </dl>
            <div className="mt-3 pt-3 border-t border-borde flex items-center justify-between">
              <Estado usuario={u} onCambiar={() => toggle(u)} />
              <Acciones usuario={u} onEditar={() => abrirEdicion(u)} onClave={() => abrirClave(u)} compacto />
            </div>
          </div>
        ))}
      </div>

      {/* Modal: editar */}
      {editar && editar.id && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setEditar(null)}>
          <div
            className="bg-superficie rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-editar"
          >
            <div className="flex items-start gap-3 px-5 py-4 border-b border-borde">
              <span className="w-9 h-9 rounded-lg bg-primary/10 text-acento flex items-center justify-center flex-shrink-0">
                <Icono nombre="editar" clase="w-5 h-5" />
              </span>
              <div className="min-w-0">
                <h3 id="titulo-editar" className="font-semibold text-texto" style={{ fontFamily: 'var(--font-heading)' }}>Editar usuario</h3>
                <p className="text-xs text-texto-secundario font-mono truncate">@{editar.username}</p>
              </div>
              <button type="button" onClick={() => setEditar(null)} className="ml-auto p-1.5 text-texto-secundario hover:text-texto rounded-lg" aria-label="Cerrar">
                <Icono nombre="cerrar" />
              </button>
            </div>
            <form onSubmit={guardarEdicion} className="p-5 space-y-4">
              <div>
                <label htmlFor="editar-nombre" className="block text-xs font-medium text-texto-secundario mb-1.5">Nombre completo</label>
                <input id="editar-nombre" value={editar.nombre || ''} onChange={e => setEditar({ ...editar, nombre: e.target.value })}
                  required className={INPUT_CLS} />
              </div>
              <div>
                <label htmlFor="editar-rol" className="block text-xs font-medium text-texto-secundario mb-1.5">Rol</label>
                <Select id="editar-rol" value={editar.rol} onChange={e => setEditar({ ...editar, rol: e.target.value, departamento_id: '', personal_id: '' })}>
                  {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                </Select>
                <p className="text-[11px] text-texto-tenue mt-1">{ROLES.find(r => r.id === editar.rol)?.detalle}</p>
              </div>
              {['encargado', 'gestor', 'tecnico'].includes(editar.rol) && (
                <div>
                  <label htmlFor="editar-depto" className="block text-xs font-medium text-texto-secundario mb-1.5">Departamento</label>
                  <Select id="editar-depto" value={editar.departamento_id || ''} required
                    onChange={e => setEditar({ ...editar, departamento_id: e.target.value, personal_id: '' })}>
                    <option value="">Seleccionar...</option>
                    {deptos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                  </Select>
                </div>
              )}
              {['gestor', 'tecnico'].includes(editar.rol) && (
                <div>
                  <label htmlFor="editar-persona" className="block text-xs font-medium text-texto-secundario mb-1.5">Persona de campo</label>
                  <Select id="editar-persona" value={editar.personal_id || ''} required
                    onChange={e => setEditar({ ...editar, personal_id: e.target.value })}>
                    <option value="">Seleccionar...</option>
                    {personalDisponible(editar.departamento_id, editar.personal_id).map(p => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </Select>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setEditar(null)} className={BTN_SECUNDARIO}>Cancelar</button>
                <button type="submit" disabled={guardando} className={BTN_PRIMARIO}>
                  {guardando ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: cambiar clave */}
      {cambio.id && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setCambio({ id: null, nombre: '', nueva: '', monitor: '' })}>
          <div
            className="bg-superficie rounded-xl w-full max-w-md shadow-xl"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-clave"
          >
            <div className="flex items-start gap-3 px-5 py-4 border-b border-borde">
              <span className="w-9 h-9 rounded-lg bg-dorado/15 text-dorado-hover flex items-center justify-center flex-shrink-0">
                <Icono nombre="clave" clase="w-5 h-5" />
              </span>
              <div className="min-w-0">
                <h3 id="titulo-clave" className="font-semibold text-texto" style={{ fontFamily: 'var(--font-heading)' }}>Cambiar contraseña</h3>
                <p className="text-xs text-texto-secundario truncate">{cambio.nombre}</p>
              </div>
              <button type="button" onClick={() => setCambio({ id: null, nombre: '', nueva: '', monitor: '' })} className="ml-auto p-1.5 text-texto-secundario hover:text-texto rounded-lg" aria-label="Cerrar">
                <Icono nombre="cerrar" />
              </button>
            </div>
            <form onSubmit={cambiarClave} className="p-5 space-y-4">
              <div>
                <label htmlFor="clave-nueva" className="block text-xs font-medium text-texto-secundario mb-1.5">Nueva contraseña</label>
                <input id="clave-nueva" type="password" value={cambio.nueva} onChange={e => setCambio({ ...cambio, nueva: e.target.value })}
                  placeholder="Mínimo 4 caracteres" required minLength={4} autoComplete="new-password" className={INPUT_CLS} />
              </div>
              <div>
                <label htmlFor="clave-monitor" className="block text-xs font-medium text-texto-secundario mb-1.5">Tu contraseña</label>
                <input id="clave-monitor" type="password" value={cambio.monitor} onChange={e => setCambio({ ...cambio, monitor: e.target.value })}
                  required autoComplete="current-password" className={INPUT_CLS} />
              </div>
              <div className="flex items-start gap-2 rounded-lg bg-aviso-suave border border-aviso-borde px-3 py-2 text-xs text-aviso">
                <span className="flex-shrink-0 mt-0.5"><Icono nombre="escudo" clase="w-3.5 h-3.5" /></span>
                <span>La contraseña del monitor autoriza el cambio. La persona no recibe ningún correo.</span>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setCambio({ id: null, nombre: '', nueva: '', monitor: '' })} className={BTN_SECUNDARIO}>Cancelar</button>
                <button type="submit" disabled={guardando} className={BTN_PRIMARIO}>
                  {guardando ? 'Guardando...' : 'Cambiar contraseña'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
