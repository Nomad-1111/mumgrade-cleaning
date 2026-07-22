import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, formatMoney, type Job, type Quote } from '../lib/api'
import { useAuth } from '../lib/auth'

export function JobDetailPage() {
  const { id = '' } = useParams()
  const { provider } = useAuth()
  const [job, setJob] = useState<Job | null>(null)
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [quoteError, setQuoteError] = useState('')
  const [quoteMessage, setQuoteMessage] = useState('')
  const [submittingQuote, setSubmittingQuote] = useState(false)
  const [quoteForm, setQuoteForm] = useState({ amount: '', message: '' })

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [jobRes, quotesRes] = await Promise.all([
        api.getJob(id),
        api.listQuotes(id),
      ])
      setJob(jobRes.job)
      setQuotes(quotesRes.quotes)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load job')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    async function run() {
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

    void run()
    return () => {
      cancelled = true
    }
  }, [id])

  async function onSubmitQuote(event: FormEvent) {
    event.preventDefault()
    if (!provider) return
    const dollars = Number(quoteForm.amount)
    if (!Number.isFinite(dollars) || dollars <= 0) {
      setQuoteError('Enter a valid quote amount.')
      return
    }

    setSubmittingQuote(true)
    setQuoteError('')
    setQuoteMessage('')
    try {
      await api.createQuote(id, {
        amount_cents: Math.round(dollars * 100),
        message: quoteForm.message.trim(),
      })
      setQuoteForm({ amount: '', message: '' })
      setQuoteMessage('Quote sent.')
      await load()
    } catch (err) {
      setQuoteError(err instanceof Error ? err.message : 'Could not send quote')
    } finally {
      setSubmittingQuote(false)
    }
  }

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
        <Link
          to={provider ? '/provider/jobs' : '/post-job'}
          className="mt-4 inline-block text-sage hover:text-olive"
        >
          {provider ? 'Back to jobs' : 'Post another job'}
        </Link>
      </PageShell>
    )
  }

  const alreadyQuoted = Boolean(
    provider && quotes.some((q) => q.provider_id === provider.id),
  )

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      {provider && (
        <Link
          to="/provider/jobs"
          className="text-sm font-medium text-sage hover:text-olive"
        >
          ← Back to jobs
        </Link>
      )}
      <p className="mt-4 text-sm font-medium uppercase tracking-[0.16em] text-sage">
        Job {job.id}
      </p>
      <h1 className="mt-2 break-words font-display text-3xl font-semibold text-olive sm:text-4xl">
        {job.service_type}
      </h1>
      <p className="mt-2 text-charcoal/70">
        {job.suburb} · Status:{' '}
        <span className="font-medium capitalize text-charcoal">{job.status}</span>
        {job.invited_provider_id === provider?.id ? ' · Sent to you' : ''}
      </p>

      <div className="mt-8 space-y-3 border-t border-sand pt-8">
        <p className="text-sm leading-relaxed text-charcoal/80">{job.description}</p>
        <p className="text-sm text-charcoal/60">
          Posted by {job.customer_name}
        </p>
      </div>

      {provider && job.status === 'open' && (
        <section className="mt-12 border-t border-sand pt-8">
          <h2 className="font-display text-2xl font-semibold text-olive">
            Send a quote
          </h2>
          {alreadyQuoted ? (
            <p className="mt-4 text-sm text-charcoal/70">
              You have already quoted on this job.
            </p>
          ) : (
            <form onSubmit={onSubmitQuote} className="mt-4 max-w-md space-y-4">
              <label className="block text-sm">
                <span className="font-medium text-charcoal">Amount (AUD)</span>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  className="mt-1 w-full rounded-md border border-sand bg-white px-3 py-2.5 text-base"
                  value={quoteForm.amount}
                  onChange={(e) =>
                    setQuoteForm((f) => ({ ...f, amount: e.target.value }))
                  }
                  placeholder="180"
                  required
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-charcoal">Message</span>
                <textarea
                  className="mt-1 w-full rounded-md border border-sand bg-white px-3 py-2.5 text-base"
                  rows={3}
                  value={quoteForm.message}
                  onChange={(e) =>
                    setQuoteForm((f) => ({ ...f, message: e.target.value }))
                  }
                  placeholder="What’s included, timing, products…"
                />
              </label>
              {quoteError && <p className="text-sm text-olive">{quoteError}</p>}
              {quoteMessage && (
                <p className="text-sm text-sage">{quoteMessage}</p>
              )}
              <button
                type="submit"
                disabled={submittingQuote}
                className="rounded-md bg-sage px-4 py-2.5 text-sm font-semibold text-white hover:bg-olive disabled:opacity-60"
              >
                {submittingQuote ? 'Sending…' : 'Submit quote'}
              </button>
            </form>
          )}
        </section>
      )}

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
