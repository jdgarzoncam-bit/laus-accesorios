import { useEffect, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, Sprout, X } from 'lucide-react'
import { authClient } from './neon'

type Props = { children: ReactNode; onClose: () => void }

export default function AuthGate({ children, onClose }: Props) {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [authorization, setAuthorization] = useState<'checking' | 'allowed' | 'denied'>('checking')

  const adminSessionUrl = import.meta.env.VITE_ADMIN_SESSION_CHECK_URL as string | undefined

  useEffect(() => {
    let active = true
    const initialize = async () => {
      try {
        const current = await authClient?.getSession()
        if (!active) return
        const nextSession = current?.data?.session ? current.data : null
        setSession(nextSession)
        if (!nextSession || !adminSessionUrl) {
          setAuthorization('denied')
          return
        }
        const response = await fetch(adminSessionUrl, { method: 'GET', credentials: 'include', headers: { Accept: 'application/json' } })
        const result = response.ok ? await response.json() : null
        if (active) setAuthorization(result?.authorized === true ? 'allowed' : 'denied')
      } catch {
        if (active) setAuthorization('denied')
      } finally {
        if (active) setLoading(false)
      }
    }
    void initialize()
    return () => { active = false }
  }, [adminSessionUrl])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!authClient) {
      setError('Falta configurar VITE_NEON_AUTH_URL en el entorno QA.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const result = await authClient.signIn.email({ email, password })
      if (result.error) throw new Error(result.error.message || 'No fue posible iniciar sesión.')
      const current = await authClient.getSession()
      const nextSession = current.data?.session ? current.data : null
      setSession(nextSession)
      if (!nextSession || !adminSessionUrl) {
        setAuthorization('denied')
        return
      }
      const response = await fetch(adminSessionUrl, { method: 'GET', credentials: 'include', headers: { Accept: 'application/json' } })
      const authorizationResult = response.ok ? await response.json() : null
      setAuthorization(authorizationResult?.authorized === true ? 'allowed' : 'denied')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error. Intenta nuevamente.')
      setAuthorization('denied')
    } finally {
      setBusy(false)
    }
  }

  const signOut = async () => {
    await authClient?.signOut()
    setSession(null)
    setAuthorization('denied')
  }

  if (loading || authorization === 'checking') {
    return <div className="auth-screen"><div className="auth-card"><Sprout /><p>Verificando acceso seguro…</p></div></div>
  }

  if (session && authorization === 'allowed') return <>{children}</>

  if (session) {
    return <div className="auth-screen"><section className="auth-card auth-pending">
      <button className="auth-close" onClick={onClose} aria-label="Cerrar"><X /></button>
      <Sprout className="auth-brand-icon" /><span className="auth-kicker">LAU'S STUDIO</span>
      <h1>Acceso no autorizado</h1>
      <p>La sesión existe, pero el servidor no ha confirmado permisos administrativos. El panel permanece bloqueado hasta validar tu rol.</p>
      <button className="auth-submit" onClick={() => { void signOut() }}>Cerrar sesión <ArrowRight size={17} /></button>
    </section></div>
  }

  return <div className="auth-screen"><section className="auth-card">
    <button className="auth-close" onClick={onClose} aria-label="Cerrar"><X /></button>
    <div className="auth-topline"><span>LAU'S · ACCESO PRIVADO</span></div>
    <Sprout className="auth-brand-icon" />
    <span className="auth-kicker">ESPACIO PRIVADO DE ADMINISTRACIÓN</span>
    <h1>Log in</h1>
    <p className="auth-subtitle">Ingresa con una cuenta previamente autorizada.</p>
    <form onSubmit={submit}>
      <label className="auth-field"><Mail size={17} /><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Correo electrónico" required autoComplete="email" /></label>
      <label className="auth-field"><LockKeyhole size={17} /><input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Contraseña" required autoComplete="current-password" /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Mostrar u ocultar contraseña">{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></label>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <button className="auth-submit" disabled={busy}>{busy ? 'Verificando…' : 'Ingresar'} <ArrowRight size={18} /></button>
    </form>
    <p className="auth-footnote">Registro público deshabilitado. El alta de administradores se hará mediante un proceso privado controlado desde backend.</p>
  </section></div>
}
