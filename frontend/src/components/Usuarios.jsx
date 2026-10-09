import { useState, useEffect } from 'react'
import { api } from '../api'

const ROLES = [
  { id: 'monitor', label: 'Monitor (todo)' },
  { id: 'encargado', label: 'Encargado (proyecto)' },
  { id: 'gestor', label: 'Gestor (propio)' },
  { id: 'tecnico', label: 'Técnico (propio)' },
]

export default function Usuarios() {
  const [lista, setLista] = useState([])
  const [deptos, setDeptos] = useState([])
  const [personal, setPersonal] = useState([])
  const [cargando, setCargando] = useState(true)
  const [msg, setMsg] = useState(null)
  const [form, setForm] = useState({ username: '', password: '', nombre: '', rol: 'gestor', departamento_id: '', personal_id: '' })
  const [cambio, setCambio] = useState({ id: null, nombre: '', nueva: '', monitor: '' })
  const [editar, setEditar] = useState(null)

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
    try {
      await api.crearUsuario({
        ...form,
        departamento_id: form.departamento_id ? Number(form.departamento_id) : null,
        personal_id: form.personal_id ? Number(form.personal_id) : null,
      })
      setForm({ username: '', password: '', nombre: '', rol: 'gestor', departamento_id: '', personal_id: '' })
      setMsg({ tipo: 'exito', texto: 'Usuario creado' })
      cargar()
    } catch (err) {
      setMsg({ tipo: 'error', texto: err.message })
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
    }
  }

  const cambiarClave = async (e) => {
    e.preventDefault()
    try {
      await api.cambiarClave(cambio.id, { nueva: cambio.nueva, monitor: cambio.monitor })
      setCambio({ id: null, nombre: '', nueva: '', monitor: '' })
      setMsg({ tipo: 'exito', texto: 'Clave actualizada' })
    } catch (err) {
      setMsg({ tipo: 'error', texto: err.message })
    }
  }

  const toggle = async (u) => {
    try {
      await api.toggleUsuario(u.id)
      cargar()
    } catch (err) {
      setMsg({ tipo: 'error', texto: err.message })
    }
  }

  const necesitaDepto = ['encargado', 'gestor', 'tecnico'].includes(form.rol)
  const necesitaPersona = ['gestor', 'tecnico'].includes(form.rol)

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-texto" style={{ fontFamily: 'var(--font-heading)' }}>Usuarios</h2>
      {msg && (
        <div className={`text-sm rounded-lg px-4 py-3 ${msg.tipo === 'exito' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {msg.texto}
        </div>
      )}

      <div className="bg-white rounded-lg border border-borde p-5">
        <h3 className="text-sm font-semibold text-texto mb-3">Crear usuario</h3>
        <form onSubmit={crear} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre completo" required
            className="px-3 py-2 border border-borde rounded-lg focus:ring-2 focus:ring-dorado outline-none text-sm" />
          <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="Usuario (login)" required
            className="px-3 py-2 border border-borde rounded-lg focus:ring-2 focus:ring-dorado outline-none text-sm" />
          <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Clave (mín. 4)" required minLength={4}
            className="px-3 py-2 border border-borde rounded-lg focus:ring-2 focus:ring-dorado outline-none text-sm" />
          <select value={form.rol} onChange={e => setForm({ ...form, rol: e.target.value, departamento_id: '', personal_id: '' })}
            className="px-3 py-2 border border-borde rounded-lg focus:ring-2 focus:ring-dorado outline-none text-sm bg-white">
            {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
          {necesitaDepto && (
            <select value={form.departamento_id} onChange={e => setForm({ ...form, departamento_id: e.target.value, personal_id: '' })} required
              className="px-3 py-2 border border-borde rounded-lg focus:ring-2 focus:ring-dorado outline-none text-sm bg-white">
              <option value="">Departamento...</option>
              {deptos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
            </select>
          )}
          {necesitaPersona && (
            <select value={form.personal_id} onChange={e => setForm({ ...form, personal_id: e.target.value })} required
              className="px-3 py-2 border border-borde rounded-lg focus:ring-2 focus:ring-dorado outline-none text-sm bg-white">
              <option value="">Persona de campo...</option>
              {personalDisponible(form.departamento_id, null).map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          )}
          <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover text-sm font-medium transition-colors">
            Crear
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg border border-borde overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-fondo-gris border-b border-borde">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-texto-secundario uppercase">Usuario</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-texto-secundario uppercase">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-texto-secundario uppercase">Rol</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-texto-secundario uppercase">Proyecto</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-texto-secundario uppercase">Persona</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-texto-secundario uppercase">Estado</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-texto-secundario uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cargando ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-texto-secundario">Cargando...</td></tr>
              ) : lista.map(u => (
                <tr key={u.id} className={!u.activo ? 'opacity-50' : ''}>
                  <td className="px-4 py-3 font-mono text-xs">{u.username}</td>
                  <td className="px-4 py-3">{u.nombre}</td>
                  <td className="px-4 py-3 capitalize">{u.rol}</td>
                  <td className="px-4 py-3">{u.departamento || '—'}</td>
                  <td className="px-4 py-3">{u.personal || <span className="text-texto-secundario">—</span>}</td>
                  <td className="px-4 py-3">{u.activo ? 'Activo' : 'Inactivo'}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button onClick={() => setEditar({ ...u, departamento_id: u.departamento_id || '', personal_id: u.personal_id || '' })}
                      className="text-xs text-primary hover:underline mr-3">Editar</button>
                    <button onClick={() => setCambio({ id: u.id, nombre: u.nombre, nueva: '', monitor: '' })}
                      className="text-xs text-primary hover:underline mr-3">Clave</button>
                    <button onClick={() => toggle(u)}
                      className="text-xs text-coral hover:underline">{u.activo ? 'Desactivar' : 'Activar'}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editar && editar.id && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setEditar(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-sm space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-texto">Editar {editar.username}</h3>
            <form onSubmit={guardarEdicion} className="space-y-3">
              <input value={editar.nombre || ''} onChange={e => setEditar({ ...editar, nombre: e.target.value })}
                placeholder="Nombre completo" required
                className="w-full px-3 py-2 border border-borde rounded-lg focus:ring-2 focus:ring-dorado outline-none text-sm" />
              <select value={editar.rol} onChange={e => setEditar({ ...editar, rol: e.target.value, departamento_id: '', personal_id: '' })}
                className="w-full px-3 py-2 border border-borde rounded-lg focus:ring-2 focus:ring-dorado outline-none text-sm bg-white">
                {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
              {['encargado', 'gestor', 'tecnico'].includes(editar.rol) && (
                <select value={editar.departamento_id || ''} onChange={e => setEditar({ ...editar, departamento_id: e.target.value, personal_id: '' })} required
                  className="w-full px-3 py-2 border border-borde rounded-lg focus:ring-2 focus:ring-dorado outline-none text-sm bg-white">
                  <option value="">Departamento...</option>
                  {deptos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                </select>
              )}
              {['gestor', 'tecnico'].includes(editar.rol) && (
                <select value={editar.personal_id || ''} onChange={e => setEditar({ ...editar, personal_id: e.target.value })} required
                  className="w-full px-3 py-2 border border-borde rounded-lg focus:ring-2 focus:ring-dorado outline-none text-sm bg-white">
                  <option value="">Persona de campo...</option>
                  {personalDisponible(editar.departamento_id, editar.personal_id).map(p => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              )}
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setEditar(null)}
                  className="px-4 py-2 text-sm border border-borde rounded-lg hover:bg-fondo-gris">Cancelar</button>
                <button className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-hover">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {cambio.id && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setCambio({ id: null, nombre: '', nueva: '', monitor: '' })}>
          <div className="bg-white rounded-xl p-6 w-full max-w-sm space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-texto">Cambiar clave de {cambio.nombre}</h3>
            <form onSubmit={cambiarClave} className="space-y-3">
              <input type="password" value={cambio.nueva} onChange={e => setCambio({ ...cambio, nueva: e.target.value })}
                placeholder="Nueva clave (mín. 4)" required minLength={4}
                className="w-full px-3 py-2 border border-borde rounded-lg focus:ring-2 focus:ring-dorado outline-none text-sm" />
              <input type="password" value={cambio.monitor} onChange={e => setCambio({ ...cambio, monitor: e.target.value })}
                placeholder="Tu clave (monitor, autoriza)" required
                className="w-full px-3 py-2 border border-borde rounded-lg focus:ring-2 focus:ring-dorado outline-none text-sm" />
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setCambio({ id: null, nombre: '', nueva: '', monitor: '' })}
                  className="px-4 py-2 text-sm border border-borde rounded-lg hover:bg-fondo-gris">Cancelar</button>
                <button className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-hover">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
