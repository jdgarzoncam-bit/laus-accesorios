import { useEffect, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, Sprout, X } from 'lucide-react'
import { authClient } from './neon'

const BOOTSTRAP_EMAIL = 'jdgarzoncam@gmail.com'\ntype Props = { children: ReactNode; onClose: () => void }

export default function AuthGate({ children, onClose }: Props) {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')\n  const isBootstrapEmail = email.trim().toLowerCase() === BOOTSTRAP_EMAIL

  useEffect(() => {
    let active = true
    authClient?.getSession().then(({ data }: any) => { if (active) setSession(data?.session ? data : null) }).catch(() => {})
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!authClient) { setError('Falta configurar VITE_NEON_AUTH_URL en el entorno QA.'); return }
    setBusy(true); setError(''); setMessage('')
    try {
      const result = mode === 'login'
        ? await authClient.signIn.email({ email, password })
        : await authClient.signUp.email({ email, password, name })
      if (result.error) throw new Error(result.error.message || 'No fue posible completar la solicitud.')
      const current = await authClient.getSession()
      setSession(current.data?.session ? current.data : null)
      if (mode === 'signup') setMessage('Cuenta creada. Verifica tu correo. Después asignaremos el rol administrador principal y cerraremos el registro público.')
    } catch (err) { setError(err instanceof Error ? err.message : 'Ocurrió un error. Intenta nuevamente.') }
    finally { setBusy(false) }
  }

  const user = session?.user
  const roles = typeof user?.role === 'string' ? user.role.split(',').map((r: string) => r.trim()) : Array.isArray(user?.role) ? user.role : []
  const isAdmin = roles.includes('admin') || roles.includes('owner')

  if (loading) return <div className="auth-screen"><div className="auth-card"><Sprout/><p>Preparando tu espacio seguro…</p></div></div>
  if (user && isAdmin) return <>{children}</>
  if (user && !isAdmin) return <div className="auth-screen"><section className="auth-card auth-pending"><button className="auth-close" onClick={onClose} aria-label="Cerrar"><X/></button><Sprout className="auth-brand-icon"/><span className="auth-kicker">LAU'S STUDIO</span><h1>Solicitud recibida</h1><p>Tu cuenta está creada, pero todavía no tiene autorización administrativa. Solo las tres cuentas aprobadas pueden entrar al panel.</p><button className="auth-submit" onClick={async()=>{await authClient?.signOut();setSession(null)}}>Cerrar sesión <ArrowRight size={17}/></button></section></div>

  return <div className="auth-screen">
    <section className="auth-card">
      <button className="auth-close" onClick={onClose} aria-label="Cerrar"><X/></button>
      <div className="auth-topline"><span>CLOUD NINE · LAU'S</span><button onClick={()=>{setMode(mode==='login'?'signup':'login');setError('');setMessage('')}}>{mode==='login'?'Sign Up':'Log in'}</button></div>
      <Sprout className="auth-brand-icon"/>
      <span className="auth-kicker">ESPACIO PRIVADO DE ADMINISTRACIÓN</span>
      <h1>{mode==='login'?'Log in':'Create account'}</h1>
      <p className="auth-subtitle">{mode==='login'?'Qué bueno tenerte de vuelta.':'Crea tu cuenta autorizada para LAU’S STUDIO.'}</p>
      <form onSubmit={submit}>
        {mode==='signup'&&<label className="auth-field"><Sprout size={17}/><input value={name} onChange={e=>setName(e.target.value)} placeholder="Nombre" required autoComplete="name"/></label>}
        <label className="auth-field"><Mail size={17}/><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="E-mail address" required autoComplete="email"/></label>
        <label className="auth-field"><LockKeyhole size={17}/><input type={showPassword?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" required minLength={8} autoComplete={mode==='login'?'current-password':'new-password'}/><button type="button" onClick={()=>setShowPassword(!showPassword)} aria-label="Mostrar u ocultar contraseña">{showPassword?<EyeOff size={17}/>:<Eye size={17}/>}</button></label>
        {mode==='signup' && !isBootstrapEmail && <p className="auth-error">El primer registro está reservado para jdgarzoncam@gmail.com.</p>}{error&&<p className="auth-error" role="alert">{error}</p>}{message&&<p className="auth-message">{message}</p>}
        <button className="auth-submit" disabled={busy || (mode==='signup' && !isBootstrapEmail)}>{busy?'Un momento…':mode==='login'?'Ingresar':'Crear cuenta'} <ArrowRight size={18}/></button>
      </form>
      <p className="auth-footnote">Acceso limitado a un máximo de tres administradores autorizados.</p>
      <button className="auth-switch" onClick={()=>{setMode(mode==='login'?'signup':'login');setError('');setMessage('')}}>{mode==='login'?'¿Primera vez? Crear cuenta':'¿Ya tienes cuenta? Log in'}</button>
    </section>
  </div>
}
