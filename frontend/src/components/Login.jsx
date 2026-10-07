import { useState } from 'react'

export default function Login({ onLogin, errorExterno }) {
  const [username, setUsername] = useState('monitor')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const [verClave, setVerClave] = useState(false)

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
          <img src="/logo-puente-icon.png" alt="Logo Puente" className="w-24 h-24 object-contain mx-auto mb-2" />
          <div className="text-4xl font-extrabold text-primary tracking-wide" style={{ fontFamily: 'var(--font-heading)' }}>puente</div>
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
              placeholder="Nombre de usuario"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-texto mb-1" style={{ fontFamily: 'var(--font-heading)' }}>Contraseña</label>
            <div className="relative">
              <input
                type={verClave ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 pr-11 border border-borde rounded-lg focus:ring-2 focus:ring-dorado focus:border-dorado outline-none transition-all"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setVerClave(v => !v)}
                title={verClave ? 'Ocultar contraseña' : 'Ver contraseña'}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-texto-secundario hover:text-primary rounded transition-colors"
              >
                {verClave ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
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
