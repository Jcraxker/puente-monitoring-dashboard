import { useState } from 'react'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import { api, getUser } from './api'
import './App.css'

function App() {
  const [usuario, setUsuario] = useState(() => getUser())
  const [loginError, setLoginError] = useState('')

  const login = async (username, password) => {
    try {
      const { token, user } = await api.login(username, password)
      api.saveSession({ token, user })
      setUsuario(user)
      setLoginError('')
      return true
    } catch (err) {
      setLoginError(err.message)
      return false
    }
  }

  const logout = () => {
    api.clearSession()
    setUsuario(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {usuario
        ? <Dashboard usuario={usuario} onLogout={logout} />
        : <Login onLogin={login} errorExterno={loginError} />}
    </div>
  )
}

export default App
