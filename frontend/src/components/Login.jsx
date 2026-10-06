import { useState } from 'react'

export default function Login({ onLogin, errorExterno }) {
  const [username, setUsername] = useState('monitor')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setCargando(true)
    const ok = await onLogin(username, password)
    setCargando(false)
    if (!ok) setError(errorExterno || 'Credenciales incorrectas')
    else setError('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <img src="/logo-puente-icon.png" alt="Logo Puente" className="w-20 h-20 object-contain mx-auto mb-3" />
          <h1 className="text-2xl font-semibold text-primary" style={{ fontFamily: 'var(--font-heading)' }}>Puente</h1>
          <p className="text-texto-secundario text-sm mt-1">Monitoreo y Evaluación</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="text-coral text-sm text-center bg-[#fff3e6] p-2 rounded animate-fade-in">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-texto mb-1" style={{ fontFamily: 'var(--font-heading)' }}>Usuario</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 border border-borde rounded-lg focus:ring-2 focus:ring-dorado focus:border-dorado outline-none transition-all"
              placeholder="monitor / gestor1 / tecnico1"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-texto mb-1" style={{ fontFamily: 'var(--font-heading)' }}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-borde rounded-lg focus:ring-2 focus:ring-dorado focus:border-dorado outline-none transition-all"
              placeholder="1234"
              required
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full py-3 bg-dorado text-primary rounded-lg font-semibold hover:bg-dorado-hover transition-colors focus:ring-2 focus:ring-dorado focus:ring-offset-2 disabled:opacity-60"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {cargando ? 'Verificando...' : 'Iniciar sesión'}
          </button>
        </form>
      </div>
    </div>
  )
}
