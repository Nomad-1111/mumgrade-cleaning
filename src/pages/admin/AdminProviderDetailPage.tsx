import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, formatMoney, type Invoice, type Provider } from '../../lib/api'

export function AdminProviderDetailPage() {
  const { id = '' } = useParams()
  const [provider, setProvider] = useState<Provider | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [form, setForm] = useState({
    name: '',
    suburb: '',
    bio: '',
    email: '',
    phone: '',
    notes: '',
    plan: 'free',
    status: 'active',
    verified: false,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await api.adminGetProvider(id)
      setProvider(data.provider)
      setInvoices(data.invoices)
      setForm({
        name: data.provider.name,
        suburb: data.provider.suburb,
        bio: data.provider.bio,
        email: data.provider.email,
        phone: data.provider.phone || '',
        notes: data.provider.notes || '',
        plan: data.provider.plan || 'free',
        status: data.provider.status || 'active',
        verified: data.provider.verified === 1,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
      setProvider(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function onSave(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const { provider: updated } = await api.adminUpdateProvider(id, {
        ...form,
        verified: form.verified,
      })
      setProvider(updated)
      setMessage('Provider saved.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  async function revokeSessions() {
    if (!confirm('Sign this provider out of all devices?')) return
    try {
      await api.adminRevokeProviderSessions(id)
      setMessage('Sessions revoked.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not revoke sessions')
    }
  }

  if (loading) return <p className="text-charcoal/60">Loading provider…</p>
  if (!provider) {
    return (
      <div>
        <p className="text-olive">{error || 'Provider not found'}</p>
        <Link to="/admin/providers" className="mt-4 inline-block text-sage hover:text-olive">
          ← Providers
        </Link>
      </div>
    )
  }

  return (
    <div>
      <Link to="/admin/providers" className="text-sm font-medium text-sage hover:text-olive">
        ← Providers
      </Link>
      <h1 className="mt-3 font-display text-3xl font-semibold text-olive">
        {provider.name}
      </h1>
      <p className="mt-1 text-sm text-charcoal/60">{provider.id}</p>

      <form onSubmit={onSave} className="mt-8 max-w-xl space-y-4">
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Business name</span>
          <input
            className="field"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Suburb</span>
          <input
            className="field"
            value={form.suburb}
            onChange={(e) => setForm((f) => ({ ...f, suburb: e.target.value }))}
            required
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Email</span>
          <input
            type="email"
            className="field"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            required
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Phone</span>
          <input
            className="field"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Bio</span>
          <textarea
            className="field min-h-28 resize-y"
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Admin notes</span>
          <textarea
            className="field min-h-20 resize-y"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Status</span>
            <select
              className="field"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            >
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Plan</span>
            <select
              className="field"
              value={form.plan}
              onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value }))}
            >
              <option value="free">Free</option>
              <option value="pro">Pro</option>
            </select>
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.verified}
            onChange={(e) =>
              setForm((f) => ({ ...f, verified: e.target.checked }))
            }
          />
          Verified provider
        </label>

        {error && <p className="text-sm text-olive">{error}</p>}
        {message && <p className="text-sm text-sage">{message}</p>}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving}
            className="min-h-11 rounded-md bg-sage px-4 text-sm font-semibold text-white hover:bg-olive disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          <button
            type="button"
            onClick={() => void revokeSessions()}
            className="min-h-11 rounded-md border border-sand px-4 text-sm font-semibold text-olive hover:border-sage"
          >
            Revoke sessions
          </button>
          <Link
            to={`/providers/${provider.id}`}
            className="inline-flex min-h-11 items-center text-sm font-semibold text-sage hover:text-olive"
          >
            Public profile
          </Link>
        </div>
      </form>

      <section className="mt-12">
        <h2 className="font-display text-xl font-semibold text-olive">Invoices</h2>
        <ul className="mt-4 space-y-3">
          {invoices.map((inv) => (
            <li key={inv.id} className="border-b border-sand pb-3 text-sm">
              <span className="font-semibold text-charcoal">
                {formatMoney(inv.amount_cents)}
              </span>{' '}
              · {inv.status}
              {inv.description ? ` · ${inv.description}` : ''}
            </li>
          ))}
          {invoices.length === 0 && (
            <li className="text-sm text-charcoal/60">No invoices for this provider.</li>
          )}
        </ul>
        <Link
          to="/admin/billing"
          className="mt-4 inline-block text-sm font-semibold text-sage hover:text-olive"
        >
          Manage billing →
        </Link>
      </section>
    </div>
  )
}
