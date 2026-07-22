import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api, type Provider } from '../../lib/api'

export function AdminProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load(search = q, filter = status) {
    setLoading(true)
    setError('')
    try {
      const data = await api.adminListProviders({
        q: search.trim() || undefined,
        status: filter,
      })
      setProviders(data.providers)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load providers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function onSearch(event: FormEvent) {
    event.preventDefault()
    void load()
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-olive">Providers</h1>
      <p className="mt-2 text-sm text-charcoal/70">
        View, verify, and suspend cleaners who have signed up.
      </p>

      <form
        onSubmit={onSearch}
        className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end"
      >
        <label className="block flex-1 text-sm">
          <span className="mb-1.5 block font-medium">Search</span>
          <input
            className="field"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Name, email, suburb"
          />
        </label>
        <label className="block text-sm sm:w-40">
          <span className="mb-1.5 block font-medium">Status</span>
          <select
            className="field"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </label>
        <button
          type="submit"
          className="min-h-11 rounded-md bg-sage px-4 text-sm font-semibold text-white hover:bg-olive"
        >
          Filter
        </button>
      </form>

      {error && <p className="mt-4 text-sm text-olive">{error}</p>}
      {loading && <p className="mt-6 text-charcoal/60">Loading…</p>}

      {!loading && (
        <ul className="mt-8 space-y-4">
          {providers.map((p) => (
            <li key={p.id} className="border-b border-sand pb-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                <Link
                  to={`/admin/providers/${p.id}`}
                  className="text-lg font-semibold text-charcoal hover:text-olive"
                >
                  {p.name}
                </Link>
                <span className="text-sm capitalize text-charcoal/60">
                  {p.status || 'active'}
                  {p.verified === 1 ? ' · verified' : ''}
                  {p.plan ? ` · ${p.plan}` : ''}
                </span>
              </div>
              <p className="mt-1 text-sm text-charcoal/60">
                {p.suburb} · {p.email}
              </p>
            </li>
          ))}
          {providers.length === 0 && (
            <li className="text-sm text-charcoal/60">No providers match.</li>
          )}
        </ul>
      )}
    </div>
  )
}
