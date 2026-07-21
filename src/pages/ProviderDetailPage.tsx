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
        <Link to="/providers" className="mt-4 inline-block text-sage hover:text-olive">
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
      <p className="mt-8 text-base leading-relaxed text-charcoal/80">
        {provider.bio}
      </p>
      <div className="mt-10 space-y-2 border-t border-sand pt-8 text-sm text-charcoal/70 break-words">
        <p>
          <span className="font-medium text-charcoal">Email:</span>{' '}
          <a href={`mailto:${provider.email}`} className="hover:text-olive">
            {provider.email}
          </a>
        </p>
        {provider.phone && (
          <p>
            <span className="font-medium text-charcoal">Phone:</span>{' '}
            <a href={`tel:${provider.phone}`} className="hover:text-olive">
              {provider.phone}
            </a>
          </p>
        )}
      </div>
      <Link
        to="/post-job"
        className="mt-10 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-sage px-5 text-base font-semibold text-white transition-colors hover:bg-olive sm:w-auto sm:text-sm"
      >
        Request a quote
      </Link>
    </div>
  )
}
