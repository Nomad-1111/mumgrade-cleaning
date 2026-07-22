import { useEffect, useState, type FormEvent } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import {
  api,
  getStoredAdminSecret,
  setStoredAdminSecret,
} from '../lib/api'

const navClass = ({ isActive }: { isActive: boolean }) =>
  [
    'block rounded-md px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-sand/70 text-olive'
      : 'text-charcoal/75 hover:bg-sand/40 hover:text-olive',
  ].join(' ')

const links = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/providers', label: 'Providers', end: false },
  { to: '/admin/training', label: 'Training', end: false },
  { to: '/admin/billing', label: 'Billing', end: false },
]

export function AdminLayout() {
  const [secret, setSecret] = useState(getStoredAdminSecret())
  const [unlocked, setUnlocked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function checkAccess() {
    setLoading(true)
    setError('')
    try {
      await api.adminOverview()
      setUnlocked(true)
    } catch (err) {
      setUnlocked(false)
      setError(err instanceof Error ? err.message : 'Unauthorized')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void checkAccess()
  }, [])

  function unlock(event: FormEvent) {
    event.preventDefault()
    setStoredAdminSecret(secret.trim())
    void checkAccess()
  }

  if (loading && !unlocked) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <p className="text-charcoal/60">Checking admin access…</p>
      </div>
    )
  }

  if (!unlocked) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <h1 className="font-display text-3xl font-semibold text-olive">
          Admin console
        </h1>
        <p className="mt-3 text-sm text-charcoal/70">
          Production uses Cloudflare Access. Locally, enter the admin secret.
        </p>
        <form onSubmit={unlock} className="mt-8 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Admin secret</span>
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="field"
              autoComplete="current-password"
            />
          </label>
          {error && <p className="text-sm text-olive break-words">{error}</p>}
          <button
            type="submit"
            className="min-h-11 rounded-md bg-sage px-5 text-sm font-semibold text-white hover:bg-olive"
          >
            Unlock
          </button>
        </form>
        <p className="mt-6 text-xs text-charcoal/50">
          Local default: <code>dev-admin-secret</code>
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-cream">
      <header className="border-b border-sand bg-cream/95 pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <img src="/brand/logo.png" alt="" className="h-9 w-9 object-contain" />
            <div>
              <p className="font-display text-lg font-semibold text-olive">
                Mum Grade Admin
              </p>
              <p className="text-[0.65rem] uppercase tracking-[0.16em] text-charcoal/45">
                Console
              </p>
            </div>
          </div>
          <Link to="/" className="text-sm font-medium text-sage hover:text-olive">
            View site
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[12rem_1fr]">
        <nav className="flex flex-row flex-wrap gap-1 lg:flex-col" aria-label="Admin">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={navClass}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <main className="min-w-0 pb-[env(safe-area-inset-bottom)]">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
