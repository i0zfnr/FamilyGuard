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

  useEffect(() => { api<{ user: User }>('/auth/me').then(result => setUser(result.user)).catch(e => { if (!(e instanceof RequestError && e.status === 401)) setError('Unable to connect to FamilyGuard. Check that the API server is running.') }).finally(() => setLoading(false)) }, [])
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
  return <main className="shell">
    <header><div className="brand"><span className="mark">F</span><span>FamilyGuard<small>DEVICE MANAGEMENT</small></span></div><span className="badge">EARLY DEVELOPMENT</span></header>
    {loading ? <p className="notice" role="status">Loading account…</p> : user ? <>
      <section className="hero compact"><p className="eyebrow">YOUR FAMILY, CONNECTED</p><h1>Welcome back,<br /><span>{user.name}.</span></h1><p className="intro">Your account is signed in. Devices shown here belong to this account.</p><button className="secondary" onClick={logout} disabled={busy}>Sign out</button></section>
      {error && <p className="error" role="alert">{error}</p>}
      <section className="devices"><div><p className="eyebrow">YOUR DEVICES</p><h2>Registered devices</h2></div>{devices === null ? <p className="empty" role="status">{error ? 'Devices could not be loaded.' : 'Loading devices…'}</p> : devices.length === 0 ? <p className="empty">No devices are registered. Secure enrollment is still in development.</p> : <div className="grid">{devices.map(device => <DeviceCard key={device.id} device={device} onRevoked={() => setDevices(current => current?.map(item => item.id === device.id ? { ...item, enrollment_status: 'revoked' } : item) ?? null)} />)}</div>}</section>
      <section className="enroll"><h2>Device enrollment</h2><p>Only enroll a device with its owner's approval. The Android app requires a trusted HTTPS server.</p>
        {!challenge ? <button className="secondary" disabled={busy} onClick={newChallenge}>Create enrollment challenge</button> : <div className="challenge"><p><strong>{challenge.enrollment_available ? 'Experimental enrollment is enabled.' : 'Enrollment is disabled on this server.'}</strong> This code expires {new Date(challenge.expires_at).toLocaleString()}. Share it only with the device owner.</p><label>Challenge ID<input readOnly value={challenge.id} /></label><label>Challenge secret<input readOnly value={challenge.token} /></label><button className="secondary" disabled={busy} onClick={cancelChallenge}>Cancel challenge</button></div>}
      </section>
      <aside><strong>Remote assistance is not available yet.</strong> Device enrollment, MFA, recovery and remote access are still being built.</aside>
    </> : <div className="auth-layout"><section className="hero"><p className="eyebrow">YOUR FAMILY, CONNECTED</p><h1>Care for the devices<br /><span>that matter.</span></h1><p className="intro">A secure space for managing your family’s devices and providing assistance with their consent.</p></section><section className="auth-card"><h2>{register ? 'Create an account' : 'Welcome back'}</h2><p>{register ? 'Start with a device owner account.' : 'Sign in to your FamilyGuard account.'}</p><form onSubmit={submit}>
      {register && <label>Name<input value={name} onChange={e => setName(e.target.value)} autoComplete="name" required maxLength={100} /></label>}
      <label>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required /></label>
      <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete={register ? 'new-password' : 'current-password'} required minLength={register ? 12 : undefined} /></label>
      {register && <label>Confirm password<input type="password" value={confirmation} onChange={e => setConfirmation(e.target.value)} autoComplete="new-password" required minLength={12} /></label>}
      {error && <p className="error" role="alert">{error}</p>}<button disabled={busy}>{busy ? 'Please wait…' : register ? 'Create account' : 'Sign in'}</button></form>
      <button className="link" onClick={() => { setRegister(!register); setError('') }}>{register ? 'Already have an account? Sign in' : 'Create an account'}</button></section></div>}
    <footer>FamilyGuard <span>·</span> Local development preview</footer>
  </main>
}
export default App
