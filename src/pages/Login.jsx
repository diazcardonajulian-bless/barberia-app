import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './Login.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signIn(email, password)
      navigate('/dashboard')
    } catch {
      setError('Correo o contraseña incorrectos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-brand">
        <div className="login-brand-content">
          <svg className="login-brand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M6 3v18M18 3v18M6 12h12M6 7h12M6 17h12" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h1>
            Barbería<br/>
            <span className="login-brand-accent">Premium</span>
          </h1>
          <div className="login-brand-line"></div>
          <p>Estilo, precisión y elegancia en cada corte. Tu mejor versión comienza aquí.</p>
        </div>
      </div>

      <div className="login-form-side">
        <div className="login-form-container">
          <div className="login-mobile-brand">
            <svg className="login-mobile-brand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 3v18M18 3v18M6 12h12M6 7h12M6 17h12" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h1>Barbería <span style={{ color: 'var(--accent)' }}>Premium</span></h1>
            <div className="login-mobile-brand-line"></div>
          </div>

          <div className="login-form-header">
            <h2>Acceso Staff</h2>
            <p>Ingresa tus credenciales para continuar</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="login-field">
              <label>Correo electrónico</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                required
              />
            </div>

            <div className="login-field">
              <label>Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && <div className="login-error">{error}</div>}

            <button type="submit" disabled={loading} className="login-submit">
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <a href="/" className="login-back-link">← Volver a reservar cita</a>
        </div>
      </div>
    </div>
  )
}
