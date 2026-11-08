import { useEffect, useState, type FormEvent } from 'react'
import './App.css'

type User = { id: number; name: string; email: string; role: string }
type Device = { id: string; device_name: string; platform: string; enrollment_status: string; last_seen_at: string | null }
type ApiError = { message?: string; errors?: Record<string, string[]> }
class RequestError extends Error { readonly status: number; constructor(message: string, status: number) { super(message); this.status = status } }

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (options.method && options.method !== 'GET') {
    const csrf = await fetch('/api/v1/csrf', { headers: { Accept: 'application/json' } })
    if (!csrf.ok) throw new Error('Could not initialize the session.')
    const token: { csrf_token: string } = await csrf.json()
    headers['X-CSRF-TOKEN'] = token.csrf_token
    headers['Content-Type'] = 'application/json'
  }
  const response = await fetch('/api/v1' + path, { ...options, headers })
  if (!response.ok) {
    const body: ApiError = await response.json().catch(() => ({}))
    throw new RequestError(Object.values(body.errors ?? {}).flat().join(' ') || body.message || 'Request failed.', response.status)
  }
  return response.json() as Promise<T>
}

type Challenge = { id: string; token: string; expires_at: string; enrollment_available: boolean }

type Telemetry = { battery_percentage: number | null; charging: boolean | null; storage_total: number | null; storage_available: number | null; network_type: string | null; recorded_at: string }

function DeviceCard({ device, onRevoked }: { device: Device; onRevoked: () => void }) {
  const [history, setHistory] = useState<Telemetry[] | null>(null)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  async function showHealth() {
    setBusy(true); setMessage('')
    try { const result = await api<{ data: Telemetry[] }>('/devices/' + device.id + '/telemetry'); setHistory(result.data) }
    catch (e) { setMessage(e instanceof Error ? e.message : 'Unable to load health reports.') }
    finally { setBusy(false) }
  }
  async function revoke() {
    if (!window.confirm('Revoke access for ' + device.device_name + '?')) return
    setBusy(true); setMessage('')
    try { await api('/devices/' + device.id + '/revoke', { method: 'POST' }); onRevoked() }
    catch (e) { setMessage(e instanceof Error ? e.message : 'Unable to revoke device.') }
    finally { setBusy(false) }
  }
  const latest = history?.[0]
  return <article className="card"><span className="icon">◇</span><h2>{device.device_name}</h2><p>{device.platform} · {device.enrollment_status}</p><p>Last seen: {device.last_seen_at ? new Date(device.last_seen_at).toLocaleString() : 'Never reported'}</p>
    <div className="device-actions"><button className="secondary" onClick={showHealth} disabled={busy}>View latest health</button>{device.enrollment_status !== 'revoked' && <button className="secondary" onClick={revoke} disabled={busy}>Revoke access</button>}</div>
    {history && (latest ? <div className="health"><p>Reported: {new Date(latest.recorded_at).toLocaleString()}</p><p>Battery: {latest.battery_percentage == null ? 'Not reported' : latest.battery_percentage + '%'}{latest.charging == null ? '' : latest.charging ? ' · charging' : ' · not charging'}</p><p>Storage available: {latest.storage_available == null ? 'Not reported' : (latest.storage_available / 1073741824).toFixed(1) + ' GiB'}</p><p>Network: {latest.network_type ?? 'Not reported'}</p></div> : <p>No health reports have been received.</p>)}
    {message && <p className="error" role="alert">{message}</p>}</article>
}

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [devices, setDevices] = useState<Device[] | null>(null)
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [register, setRegister] = useState(false)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')

  useEffect(() => { api<{ user: User }>('/auth/me').then(result => setUser(result.user)).catch(e => { if (!(e instanceof RequestError && e.status === 401)) setError('Unable to connect to XennGuard. Check that the API server is running.') }).finally(() => setLoading(false)) }, [])
  useEffect(() => {
    if (!user) return
    api<{ data: Device[] }>('/devices').then(result => setDevices(result.data)).catch(e => setError(e instanceof Error ? e.message : 'Unable to load devices.'))
  }, [user])

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('')
    try {
      const body = register ? { name, email, password, password_confirmation: confirmation } : { email, password }
      const result = await api<{ user: User }>('/auth/' + (register ? 'register' : 'login'), { method: 'POST', body: JSON.stringify(body) })
      setUser(result.user); setPassword(''); setConfirmation('')
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to sign in.') } finally { setBusy(false) }
  }
  async function logout() {
    setBusy(true); setError('')
    try { await api('/auth/logout', { method: 'POST' }); setUser(null); setDevices(null); setChallenge(null) }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to sign out.') }
    finally { setBusy(false) }
  }
  async function newChallenge() {
    setBusy(true); setError('')
    try { setChallenge(await api<Challenge>('/devices/enrollment-challenges', { method: 'POST' })) }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to create challenge.') }
    finally { setBusy(false) }
  }
  async function cancelChallenge() {
    if (!challenge) return
    setBusy(true); setError('')
    try { await api('/devices/enrollment-challenges/' + challenge.id, { method: 'DELETE' }); setChallenge(null) }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to revoke challenge.') }
    finally { setBusy(false) }
  }
  return <main className={user ? 'app-shell' : 'auth-shell'}>
    {loading ? <div className="loading-screen" role="status"><img src="/xennguard-icon.jpg" alt="" /><span>Loading XennGuard…</span></div> : user ? <>
      <header className="app-header"><div className="brand"><img className="mark" src="/xennguard-icon.jpg" alt="" /><span>XennGuard</span></div><div className="header-right"><span className="preview-label"><i /> DEVELOPMENT PREVIEW</span><button className="signout" onClick={logout} disabled={busy}>Sign out <span aria-hidden="true">↗</span></button></div></header>
      <div className="dashboard"><div className="dashboard-intro"><div><p className="eyebrow"><span className="eyebrow-dot" /> YOUR SPACE</p><h1>Good to see you, <span>{user.name}.</span></h1><p className="intro">A little more peace of mind, all in one place.</p></div><div className="account-pill"><span>{user.name.trim().slice(0, 1).toUpperCase()}</span><div><strong>{user.name}</strong><small>{user.email}</small></div></div></div>
      {error && <p className="error banner-error" role="alert">{error}</p>}
      <div className="dashboard-grid"><section className="devices"><div className="section-heading"><div><p className="eyebrow">YOUR CONNECTIONS</p><h2>Devices <span className="count">{devices === null ? '—' : devices.length}</span></h2></div><span className="section-note">Only devices you own</span></div>{devices === null ? <div className="empty" role="status">{error ? 'Devices could not be loaded.' : 'Loading your devices…'}</div> : devices.length === 0 ? <div className="empty empty-state"><div className="empty-icon" aria-hidden="true">⌁</div><h3>Your space is ready.</h3><p>When device enrollment is available, your connected devices will appear here.</p><span className="coming-pill">Enrollment in development</span></div> : <div className="grid">{devices.map(device => <DeviceCard key={device.id} device={device} onRevoked={() => setDevices(current => current?.map(item => item.id === device.id ? { ...item, enrollment_status: 'revoked' } : item) ?? null)} />)}</div>}</section>
      <div className="side-column"><section className="enroll"><div className="side-icon" aria-hidden="true">＋</div><p className="eyebrow">GET CONNECTED</p><h2>Device enrollment</h2><p>Connect a device with its owner’s approval. The Android app requires a trusted HTTPS server.</p>{!challenge ? <button className="secondary" disabled={busy} onClick={newChallenge}>Create enrollment challenge <span aria-hidden="true">↗</span></button> : <div className="challenge"><p><strong>{challenge.enrollment_available ? 'Experimental enrollment is enabled.' : 'Enrollment is disabled on this server.'}</strong> This code expires {new Date(challenge.expires_at).toLocaleString()}. Share it only with the device owner.</p><label>Challenge ID<input readOnly value={challenge.id} /></label><label>Challenge secret<input readOnly value={challenge.token} /></label><button className="secondary" disabled={busy} onClick={cancelChallenge}>Cancel challenge</button></div>}</section>
      <aside className="privacy-note"><span className="privacy-icon" aria-hidden="true">✳</span><div><strong>Made for care, built on consent.</strong><p>Remote assistance, recovery and MFA are still in development.</p></div></aside></div></div>
      <footer><span>© XennGuard</span><span>Development preview</span></footer></div>
    </> : <div className="auth-layout"><section className="auth-story"><div className="story-top"><div className="brand light"><img className="mark" src="/xennguard-icon.jpg" alt="" /><span>XennGuard</span></div><span className="story-edition">FAMILY DEVICE CARE <span> / </span> 01</span></div><div className="story-content"><p className="story-overline"><span /> CLOSER, EVEN FROM AFAR</p><h1>Care is always<br /><em>within reach.</em></h1><p>A thoughtful way to stay connected to the devices and people that matter most.</p></div><div className="story-art" aria-hidden="true"><img src="/xennguard-icon.jpg" alt="" /></div><div className="story-bottom"><div><span className="orbit">✳</span><p>For the people<br /><strong>you look out for.</strong></p></div><span>DESIGNED FOR CONNECTION&nbsp; ↗</span></div></section>
    <section className="auth-main"><div className="auth-main-top"><span>YOUR SPACE, MADE SIMPLE</span><span className="preview-label"><i /> DEVELOPMENT PREVIEW</span></div><div className="auth-card"><div className="auth-icon" aria-hidden="true">✳</div><p className="eyebrow">WELCOME TO XENNGUARD</p><h2>{register ? 'Create your account.' : 'Welcome back.'}</h2><p className="auth-description">{register ? 'A little setup now, more peace of mind later.' : 'Sign in to keep the important things close.'}</p><form onSubmit={submit}>
      {register && <label>Full name<input value={name} onChange={e => setName(e.target.value)} autoComplete="name" required maxLength={100} placeholder="Your name" /></label>}
      <label>Email address<input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required placeholder="you@example.com" /></label>
      <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete={register ? 'new-password' : 'current-password'} required minLength={register ? 12 : undefined} placeholder={register ? 'At least 12 characters' : 'Enter your password'} /></label>
      {register && <label>Confirm password<input type="password" value={confirmation} onChange={e => setConfirmation(e.target.value)} autoComplete="new-password" required minLength={12} placeholder="Repeat your password" /></label>}
      {error && <p className="error" role="alert">{error}</p>}<button className="primary" disabled={busy}><span>{busy ? 'Please wait…' : register ? 'Create account' : 'Sign in'}</span><span aria-hidden="true">↗</span></button></form>
      <div className="auth-switch"><span>{register ? 'Already have an account?' : 'New to XennGuard?'}</span><button className="link" onClick={() => { setRegister(!register); setError('') }}>{register ? 'Sign in' : 'Create an account'} <span aria-hidden="true">→</span></button></div></div><div className="auth-footer"><span>© XennGuard</span><span>Thoughtful technology for everyday life.</span></div></section></div>}
  </main>
}
export default App
