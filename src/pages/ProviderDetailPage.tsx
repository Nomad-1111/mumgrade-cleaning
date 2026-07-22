import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, type Provider } from '../lib/api'

export function ProviderDetailPage() {
  const { id = '' } = useParams()
  const [provider, setProvider] = useState<Provider | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const data = await api.getProvider(id)
        if (!cancelled) setProvider(data.provider)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Provider not found')
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
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">Loading…</div>
    )
  }

  if (error || !provider) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <p className="text-olive">{error || 'Provider not found'}</p>
        <Link
          to="/providers"
          className="mt-4 inline-block text-sage hover:text-olive"
        >
          Back to providers
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <Link
        to="/providers"
        className="text-sm font-medium text-charcoal/60 hover:text-olive"
      >
        ← All providers
      </Link>
      <div className="mt-4 flex flex-wrap items-baseline gap-3">
        <h1 className="break-words font-display text-3xl font-semibold text-olive sm:text-4xl">
          {provider.name}
        </h1>
        {provider.verified === 1 && (
          <span className="text-xs font-semibold uppercase tracking-wide text-sage">
            Verified
          </span>
        )}
      </div>
      <p className="mt-2 text-charcoal/70">{provider.suburb}</p>

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-sage">
          About
        </h2>
        <p className="mt-3 whitespace-pre-wrap text-base leading-relaxed text-charcoal/80">
          {provider.bio?.trim() || 'No bio provided yet.'}
        </p>
      </section>

      <section className="mt-10 border-t border-sand pt-8">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-sage">
          Contact details
        </h2>
        <dl className="mt-4 space-y-3 text-sm text-charcoal/80 break-words">
          <div>
            <dt className="font-medium text-charcoal">Email</dt>
            <dd className="mt-1">
              <a href={`mailto:${provider.email}`} className="hover:text-olive">
                {provider.email}
              </a>
            </dd>
          </div>
          <div>
            <dt className="font-medium text-charcoal">Phone</dt>
            <dd className="mt-1">
              {provider.phone ? (
                <a href={`tel:${provider.phone}`} className="hover:text-olive">
                  {provider.phone}
                </a>
              ) : (
                'Not provided'
              )}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-charcoal">Suburb</dt>
            <dd className="mt-1">{provider.suburb}</dd>
          </div>
        </dl>
      </section>

      <Link
        to="/post-job"
        className="mt-10 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-sage px-5 text-base font-semibold text-white transition-colors hover:bg-olive sm:w-auto sm:text-sm"
      >
        Request a quote
      </Link>
    </div>
  )
}
