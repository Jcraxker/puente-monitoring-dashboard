// Cliente API (same-origin: el backend sirve API + frontend estatico).
const TOKEN_KEY = 'puente_token'
const USER_KEY = 'puente_user'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function getUser() {
  const raw = localStorage.getItem(USER_KEY)
  return raw ? JSON.parse(raw) : null
}

async function request(path, { method = 'GET', body = null } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  })
  if (res.status === 401) {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    window.location.reload()
    throw new Error('Sesion vencida')
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Error de red')
  return data
}

export const api = {
  login: (username, password) => request('/auth/login', { method: 'POST', body: { username, password } }),
  me: () => request('/auth/me'),
  actividades: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    ).toString()
    return request(`/actividades${qs ? `?${qs}` : ''}`)
  },
  actividad: (id) => request(`/actividades/${id}`),
  anularActividad: (id) => request(`/actividades/${id}/anular`, { method: 'PUT' }),
  viaticos: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    ).toString()
    return request(`/viaticos${qs ? `?${qs}` : ''}`)
  },
  syncEstado: () => request('/sync/estado'),
  sync: (full = false) => request(`/sync${full ? '?full=1' : ''}`, { method: 'POST' }),
  kpis: () => request('/kpis'),
  correlativo: (serie) => request('/correlativos/siguiente', { method: 'POST', body: { serie } }),
  catalogos: () => request('/catalogos'),
  registros: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    ).toString()
    return request(`/registros${qs ? `?${qs}` : ''}`)
  },
  saveSession: ({ token, user }) => {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  },
  clearSession: () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  },
}
