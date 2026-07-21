import { useEffect, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, formatMoney, type Job, type Quote } from '../lib/api'

export function JobDetailPage() {
  const { id = '' } = useParams()
  const [job, setJob] = useState<Job | null>(null)
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const [jobRes, quotesRes] = await Promise.all([
          api.getJob(id),
          api.listQuotes(id),
        ])
        if (cancelled) return
        setJob(jobRes.job)
        setQuotes(quotesRes.quotes)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load job')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) {
    return <PageShell>Loading job…</PageShell>
  }

  if (error || !job) {
    return (
      <PageShell>
        <p className="text-olive">{error || 'Job not found'}</p>
        <p className="mt-2 text-sm text-charcoal/60">
          API needs Cloudflare Pages + D1. Use <code>npm run db:migrate</code>{' '}
          then <code>npm run dev:cf</code>.
        </p>
        <Link to="/post-job" className="mt-4 inline-block text-sage hover:text-olive">
          Post another job
        </Link>
      </PageShell>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-sm font-medium uppercase tracking-[0.16em] text-sage">
        Job {job.id}
      </p>
      <h1 className="mt-2 break-words font-display text-3xl font-semibold text-olive sm:text-4xl">
        {job.service_type}
      </h1>
      <p className="mt-2 text-charcoal/70">
        {job.suburb} · Status:{' '}
        <span className="font-medium capitalize text-charcoal">{job.status}</span>
      </p>

      <div className="mt-8 space-y-3 border-t border-sand pt-8">
        <p className="text-sm leading-relaxed text-charcoal/80">{job.description}</p>
        <p className="text-sm text-charcoal/60">
          Posted by {job.customer_name}
        </p>
      </div>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-semibold text-olive">
          Quotes ({quotes.length})
        </h2>
        {quotes.length === 0 ? (
          <p className="mt-4 text-sm text-charcoal/70">
            No quotes yet. Providers nearby will appear here when they respond.
          </p>
        ) : (
          <ul className="mt-6 space-y-4">
            {quotes.map((quote) => (
              <li
                key={quote.id}
                className="border-b border-sand pb-4 last:border-0"
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-baseline sm:justify-between sm:gap-2">
                  <Link
                    to={`/providers/${quote.provider_id}`}
                    className="text-lg font-semibold text-charcoal hover:text-olive"
                  >
                    {quote.provider_name ?? quote.provider_id}
                  </Link>
                  <span className="font-display text-xl font-semibold text-sage">
                    {formatMoney(quote.amount_cents)}
                  </span>
                </div>
                {quote.message && (
                  <p className="mt-2 text-sm text-charcoal/70">{quote.message}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">{children}</div>
  )
}
