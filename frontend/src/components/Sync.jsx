import { useState, useEffect } from 'react'
import { api } from '../api'

export default function Sync({ usuario }) {
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState(null)
  const [stats, setStats] = useState(null)
  const [logs, setLogs] = useState([])
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
      const e = await api.syncEstado()
      if (e.lastSync) setLastSync(new Date(e.lastSync))
      setStats(e)
    } catch (err) {
      setLogs(prev => [...prev, `Error: ${err.message}`])
    }
    setSyncing(false)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-texto" style={{ fontFamily: 'var(--font-heading)' }}>Sincronización KoBoToolbox</h2>

      <div className="bg-white rounded-lg border border-borde p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-texto-secundario">Última sincronización</p>
            <p className="font-medium text-texto">
              {lastSync ? lastSync.toLocaleString() : 'Nunca'}
            </p>
          </div>
          <div>
            <p className="text-sm text-texto-secundario">Proyecto KoBo</p>
            <p className="font-medium text-texto font-mono text-sm">aLRi3VTfPcJDq248br6duP</p>
          </div>
          <div>
            <p className="text-sm text-texto-secundario">Estado</p>
            <p className="font-medium text-texto">
              <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${
                syncing ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
              }`}>
                {syncing ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Sincronizando...
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Listo
                  </>
                )}
              </span>
            </p>
          </div>
        </div>

        <button
          onClick={() => handleSync(false)}
          disabled={syncing || !esMonitor}
          title={esMonitor ? '' : 'Solo el monitor puede sincronizar'}
          className="w-full sm:w-auto px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {syncing ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              Sincronizando...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Sincronizar ahora
            </>
          )}
        </button>
        <button
          onClick={() => { if (window.confirm('Traer TODO de nuevo desde KoBo (tarda unos minutos)?')) handleSync(true) }}
          disabled={syncing || !esMonitor}
          title="Recarga completa: útil si se editaron registros viejos en KoBo"
          className="w-full sm:w-auto px-6 py-3 bg-white border border-borde text-texto rounded-lg font-medium hover:bg-fondo-gris disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Resincronizar todo
        </button>

        <div className="bg-fondo-gris rounded-lg p-4 max-h-64 overflow-y-auto font-mono text-xs text-texto">
          {logs.length === 0 ? (
            <span className="text-gray-400">Presiona "Sincronizar ahora" para iniciar...</span>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="py-0.5 border-b border-borde last:border-0">{log}</div>
            ))
          )}
        </div>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-sm text-primary space-y-2">
        <p><strong>Sincronización:</strong> Este botón llama a <code>POST /api/sync</code> del backend, que descarga de KoBoToolbox solo lo nuevo desde la última ejecución y lo guarda con <em>upsert</em> por ID.</p>
        {stats && (
          <p><strong>En base de datos:</strong> {stats.actividades} actividades · {stats.permisos} permisos · {stats.personal} personas</p>
        )}
        {!esMonitor && <p>Solo el monitor puede ejecutar la sincronización.</p>}
      </div>
    </div>
  )
}