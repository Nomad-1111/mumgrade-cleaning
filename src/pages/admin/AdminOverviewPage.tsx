import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, formatMoney, type AdminOverview } from '../../lib/api'

export function AdminOverviewPage() {
  const [data, setData] = useState<AdminOverview | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const overview = await api.adminOverview()
        if (!cancelled) setData(overview)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) return <p className="text-charcoal/60">Loading overview…</p>
  if (error || !data) {
    return <p className="text-olive">{error || 'Unavailable'}</p>
  }

  const { stats } = data
  const cards = [
    { label: 'Providers', value: stats.providersTotal, hint: `${stats.providersActive} active` },
    { label: 'Verified', value: stats.providersVerified, hint: 'Active & verified' },
    { label: 'Open jobs', value: stats.jobsOpen, hint: 'Marketplace' },
    { label: 'Training videos', value: stats.videos, hint: 'Library' },
    { label: 'Unpaid invoices', value: stats.invoicesUnpaid, hint: 'Draft + sent' },
  ]

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-olive">Overview</h1>
      <p className="mt-2 text-sm text-charcoal/70">
        Snapshot of providers, jobs, training, and billing.
      </p>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <li key={card.label} className="border border-sand bg-white/60 px-4 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-charcoal/50">
              {card.label}
            </p>
            <p className="mt-2 font-display text-3xl font-semibold text-olive">
              {card.value}
            </p>
            <p className="mt-1 text-sm text-charcoal/60">{card.hint}</p>
          </li>
        ))}
      </ul>

      <div className="mt-12 grid gap-10 lg:grid-cols-2">
        <section>
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="font-display text-xl font-semibold text-olive">
              Recent providers
            </h2>
            <Link to="/admin/providers" className="text-sm font-semibold text-sage hover:text-olive">
              View all
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {data.recentProviders.map((p) => (
              <li key={p.id} className="border-b border-sand pb-3">
                <Link
                  to={`/admin/providers/${p.id}`}
                  className="font-semibold text-charcoal hover:text-olive"
                >
                  {p.name}
                </Link>
                <p className="text-sm text-charcoal/60">
                  {p.suburb} · {p.status || 'active'}
                  {p.verified === 1 ? ' · verified' : ''}
                </p>
              </li>
            ))}
            {data.recentProviders.length === 0 && (
              <li className="text-sm text-charcoal/60">No providers yet.</li>
            )}
          </ul>
        </section>

        <section>
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="font-display text-xl font-semibold text-olive">
              Recent invoices
            </h2>
            <Link to="/admin/billing" className="text-sm font-semibold text-sage hover:text-olive">
              Billing
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {data.recentInvoices.map((inv) => (
              <li key={inv.id} className="border-b border-sand pb-3">
                <p className="font-semibold text-charcoal">
                  {inv.provider_name || inv.provider_id}
                </p>
                <p className="text-sm text-charcoal/60">
                  {formatMoney(inv.amount_cents)} · {inv.status}
                </p>
              </li>
            ))}
            {data.recentInvoices.length === 0 && (
              <li className="text-sm text-charcoal/60">No invoices yet.</li>
            )}
          </ul>
        </section>
      </div>
    </div>
  )
}
