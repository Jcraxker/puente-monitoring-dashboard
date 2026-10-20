import { useState, useEffect } from 'react'
import { api } from '../api'

export default function Sync({ usuario }) {
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState(null)
  const [stats, setStats] = useState(null)
  const [logs, setLogs] = useState([])
  const [confirmarFull, setConfirmarFull] = useState(false)
  const [estadoSync, setEstadoSync] = useState('idle') // 'idle' | 'syncing' | 'exito' | 'error'
  const esMonitor = usuario?.rol === 'monitor'

  useEffect(() => {
    api.syncEstado()
      .then(e => {
        if (e.lastSync) setLastSync(new Date(e.lastSync))
        setStats(e)
      })
      .catch(() => {})
  }, [])

  const handleSync = async (full = false) => {
    if (!esMonitor) return
    setSyncing(true)
    setEstadoSync('syncing')
    setLogs([full ? 'Resincronización total desde KoBoToolbox...' : 'Iniciando sincronización con KoBoToolbox...'])
    try {
      const r = await api.sync(full)
      if (r.sinCambios) {
        setLogs(prev => [...prev, 'Sin cambios: KoBo y BD tienen el mismo total.'])
      } else {
        setLogs(prev => [...prev,
          `Registros recibidos: ${r.total}`,
          `Actividades: ${r.actividades} (upsert)`,
          `Permisos: ${r.permisos} (upsert)`,
          `Sincronización completada.`,
        ])
      }
      setEstadoSync('exito')
      const e = await api.syncEstado()
      if (e.lastSync) setLastSync(new Date(e.lastSync))
      setStats(e)
    } catch (err) {
      setLogs(prev => [...prev, `Error: ${err.message}`])
      setEstadoSync('error')
    }
    setSyncing(false)
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* ===== HEADER ===== */}
      <div className="text-center">
        <h2 className="text-xl font-semibold text-texto" style={{ fontFamily: 'var(--font-heading)' }}>Sincronización KoBoToolbox</h2>
        <p className="text-sm text-texto-secundario mt-1">Importa actividades y permisos desde KoBo a la base de datos</p>
      </div>

      {/* ===== STATS CENTRADOS ===== */}
      <div className="bg-white rounded-xl border border-borde p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Última sync */}
          <div className="flex flex-col items-center text-center p-3">
            <span className="w-10 h-10 flex items-center justify-center mb-2 text-primary">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            <p className="text-xs text-texto-secundario font-medium">Última sincronización</p>
            <p className="text-sm font-semibold text-texto mt-0.5">
              {lastSync ? lastSync.toLocaleString() : 'Nunca'}
            </p>
          </div>

          {/* Proyecto */}
          <div className="flex flex-col items-center text-center p-3">
            <span className="w-10 h-10 flex items-center justify-center mb-2 text-primary">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375" />
              </svg>
            </span>
            <p className="text-xs text-texto-secundario font-medium">Proyecto KoBo</p>
            <p className="text-xs font-mono font-semibold text-texto mt-0.5">aLRi3VTf…6duP</p>
          </div>

          {/* Estado */}
          <div className="flex flex-col items-center text-center p-3">
            <span className="w-10 h-10 flex items-center justify-center mb-2 text-primary">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            <p className="text-xs text-texto-secundario font-medium">Estado</p>
            {estadoSync === 'syncing' && (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mt-1.5 bg-primary text-white shadow-sm">
                <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Sincronizando
              </span>
            )}
            {estadoSync === 'exito' && (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mt-1.5 bg-secondary text-white shadow-sm">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Sincronizado
              </span>
            )}
            {estadoSync === 'error' && (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mt-1.5 bg-red-500 text-white shadow-sm">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Error
              </span>
            )}
            {estadoSync === 'idle' && (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mt-1.5 bg-gray-100 text-gray-600">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {lastSync ? 'Listo' : 'Sin sincronizar'}
              </span>
            )}
          </div>
        </div>

        {/* ===== ACCIONES CENTRADAS ===== */}
        <div className="mt-5 pt-5 border-t border-borde">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
            {/* Botón principal */}
            <button
              onClick={() => handleSync(false)}
              disabled={syncing || !esMonitor}
              title={esMonitor ? 'Traer solo lo nuevo desde KoBoToolbox' : 'Solo el monitor puede sincronizar'}
              className="group flex flex-col items-center justify-center gap-3 px-6 py-7 bg-primary text-white rounded-xl font-medium hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-lg active:scale-[0.97]"
            >
              <svg className={`w-10 h-10 transition-transform duration-500 ${syncing ? 'animate-spin' : 'group-hover:rotate-90'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              <span className="text-base font-semibold">{syncing ? 'Sincronizando...' : 'Sincronizar'}</span>
              <span className="text-xs text-white/70 -mt-1">{syncing ? 'Espera a que termine' : 'Traer solo lo nuevo'}</span>
            </button>

            {/* Botón secundario */}
            <button
              onClick={() => setConfirmarFull(true)}
              disabled={syncing || !esMonitor}
              title="Recarga completa: útil si se editaron registros viejos en KoBo"
              className="group flex flex-col items-center justify-center gap-3 px-6 py-7 bg-white border-2 border-borde text-texto rounded-xl font-medium hover:border-dorado hover:bg-dorado/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.97]"
            >
              <svg className="w-10 h-10 text-dorado-hover transition-transform duration-500 group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              <span className="text-base font-semibold">Resincronizar todo</span>
              <span className="text-xs text-texto-secundario -mt-1">Recarga completa</span>
            </button>
          </div>

          {!esMonitor && (
            <p className="text-xs text-coral bg-coral/10 border border-coral/20 rounded-lg px-3 py-2 mt-3 text-center">
              Solo el monitor puede ejecutar la sincronización.
            </p>
          )}
        </div>

        {/* ===== LOGS ===== */}
        <div className="mt-5 pt-5 border-t border-borde">
          <div className="bg-fondo-gris rounded-lg p-4 max-h-48 overflow-y-auto font-mono text-xs text-texto">
            {logs.length === 0 ? (
              <div className="text-center py-4">
                <svg className="w-8 h-8 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 9h3m5 0h3m-6 4h3m-6 4h3M3 17l2 2 4-4m0 0l2-2 4 4m-6-6l2 2 4-4" />
                </svg>
                <p className="text-gray-400">Presiona "Sincronizar" para iniciar...</p>
              </div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="py-1 border-b border-borde last:border-0 flex items-center gap-2">
                  <span className="text-primary">›</span>
                  <span>{log}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ===== INFO STATS ===== */}
      {stats && (
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 flex items-center justify-center bg-primary/10 text-primary rounded-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
            </span>
            <span className="text-texto-secundario"><span className="font-bold text-texto">{stats.actividades.toLocaleString()}</span> actividades</span>
          </div>
          <div className="hidden sm:block w-px h-4 bg-borde"></div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 flex items-center justify-center bg-secondary/10 text-secondary rounded-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </span>
            <span className="text-texto-secundario"><span className="font-bold text-texto">{stats.permisos}</span> permisos</span>
          </div>
          <div className="hidden sm:block w-px h-4 bg-borde"></div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 flex items-center justify-center bg-dorado/15 text-dorado-hover rounded-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </span>
            <span className="text-texto-secundario"><span className="font-bold text-texto">{stats.personal}</span> personas</span>
          </div>
        </div>
      )}

      {/* ===== MODAL CONFIRMACIÓN ===== */}
      {confirmarFull && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setConfirmarFull(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-4">
              <span className="w-12 h-12 flex items-center justify-center bg-dorado/15 text-dorado-hover rounded-xl flex-shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
              </span>
              <div>
                <h3 className="font-semibold text-texto" style={{ fontFamily: 'var(--font-heading)' }}>Resincronizar todo</h3>
                <p className="text-sm text-texto-secundario">Confirmación requerida</p>
              </div>
            </div>
            <p className="text-sm text-texto leading-relaxed">
              Se descargará <strong>todo</strong> desde KoBoToolbox nuevamente, incluyendo registros antiguos.
              Esto puede tardar <strong>varios minutos</strong>.
            </p>
            <div className="bg-fondo-gris rounded-lg p-3 text-xs text-texto-secundario">
              <p>Última sincronización: <span className="font-medium text-texto">{lastSync ? lastSync.toLocaleString() : 'Nunca'}</span></p>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setConfirmarFull(false)}
                className="px-5 py-2.5 text-sm border border-borde rounded-lg hover:bg-fondo-gris text-texto-secundario font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => { setConfirmarFull(false); handleSync(true) }}
                className="px-5 py-2.5 text-sm bg-dorado text-texto rounded-lg hover:bg-dorado-hover font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Sincronizar todo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
