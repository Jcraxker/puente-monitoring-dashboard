import { useState, useEffect } from 'react'
import { api } from '../api'

export default function KPIs({ usuario }) {
  const esMonitor = usuario?.rol === 'monitor'
  const deptoFijo = usuario?.rol === 'encargado' ? (usuario.departamento || '') : ''
  const [filtroProyecto, setFiltroProyecto] = useState('todos')
  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(true)

  // departamento_id segun filtro (se resuelve con catalogos una vez)
  const [deptos, setDeptos] = useState([])

  useEffect(() => {
    let vivo = true
    api.catalogos().then(c => { if (vivo) setDeptos(c.departamentos || []) }).catch(() => {})
    return () => { vivo = false }
  }, [])

  useEffect(() => {
    let vivo = true
    setCargando(true)
    const nombreDepto = !esMonitor ? deptoFijo : (filtroProyecto === 'todos' ? '' : filtroProyecto)
    const dep = deptos.find(d => d.nombre === nombreDepto)
    const params = dep ? { departamento_id: dep.id } : {}
    // encargado sin depto resuelto aun: esperar catalogos
    if (!esMonitor && !deptos.length) return
    api.kpis(params).then(d => { if (vivo) setDatos(d) }).catch(() => {})
      .finally(() => { if (vivo) setCargando(false) })
    return () => { vivo = false }
  }, [esMonitor, deptoFijo, filtroProyecto, deptos])

  const kpis = datos ? [
    { label: 'Total Actividades', value: String(datos.actividades), change: `${datos.permisos} permisos`, trend: 'up' },
    { label: 'Total Viáticos', value: `Q${Number(datos.viaticosTotal).toLocaleString()}`, change: 'gasto declarado', trend: 'neutral' },
    { label: 'Personal Activo', value: String(datos.personal), change: 'técnicos + gestores', trend: 'neutral' },
    { label: 'Comunidades Atendidas', value: String(datos.comunidades), change: 'ubicaciones distintas', trend: 'neutral' },
  ] : []

  const maxPersonal = datos && datos.porPersonal.length ? datos.porPersonal[0].total : 1

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <h2 className="text-xl font-semibold text-texto" style={{ fontFamily: 'var(--font-heading)' }}>Indicadores Clave (KPIs)</h2>
        {esMonitor ? (
          <select
            value={filtroProyecto}
            onChange={(e) => setFiltroProyecto(e.target.value)}
            className="sm:ml-auto px-3 py-2 border border-borde rounded-lg focus:ring-2 focus:ring-dorado focus:border-dorado outline-none text-sm bg-white"
          >
            <option value="todos">Todos los proyectos</option>
            <option value="Chimaltenango">Chimaltenango</option>
            <option value="Alta Verapaz">Alta Verapaz</option>
          </select>
        ) : (
          <span className="sm:ml-auto text-sm text-texto-secundario">Proyecto: <span className="font-medium text-texto">{deptoFijo || '—'}</span></span>
        )}
      </div>
      {cargando && <p className="text-sm text-texto-secundario">Cargando indicadores...</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <div key={kpi.label} className={`animate-scale-in delay-${index * 50} bg-white rounded-lg border border-borde p-5 transition-shadow duration-200 hover:shadow-md`}>
            <div className="flex items-center justify-between">
              <p className="text-sm text-texto-secundario font-medium">{kpi.label}</p>
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-fondo-gris text-texto-secundario">
                {kpi.change}
              </span>
            </div>
            <p className="text-3xl font-bold text-primary mt-2" style={{ fontFamily: 'var(--font-heading)' }}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-borde p-5">
        <h3 className="text-lg font-medium text-texto mb-4" style={{ fontFamily: 'var(--font-heading)' }}>Actividades por Personal</h3>
        <div className="space-y-3">
          {(datos?.porPersonal || []).map((t) => (
            <div key={t.nombre} className="flex items-center gap-3">
              <div className="w-32 text-sm font-medium text-texto truncate">{t.nombre}</div>
              <div className="flex-1 h-3 bg-fondo-gris rounded-full overflow-hidden flex">
                <div className="h-full bg-primary rounded-full" style={{ width: `${(t.total / maxPersonal) * 100}%` }} />
              </div>
              <div className="w-24 text-sm text-texto-secundario text-right">{t.total}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-borde p-5">
        <h3 className="text-lg font-medium text-texto mb-4" style={{ fontFamily: 'var(--font-heading)' }}>Actividades por Comunidad</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(datos?.porComunidad || []).map((z) => (
            <div key={z.comunidad} className="p-4 bg-fondo-gris rounded-lg">
              <p className="text-lg font-semibold text-primary truncate" style={{ fontFamily: 'var(--font-heading)' }}>{z.comunidad}</p>
              <p className="text-2xl font-bold text-texto mt-1" style={{ fontFamily: 'var(--font-heading)' }}>{z.total}</p>
              <p className="text-sm text-texto-secundario">actividades</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
