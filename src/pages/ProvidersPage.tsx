import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  SuburbPicker,
  suburbNameFromValue,
} from '../components/SuburbPicker'
import { api, type Provider } from '../lib/api'

export function ProvidersPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const suburbFilter = searchParams.get('suburb') ?? ''
  const [suburb, setSuburb] = useState(suburbFilter)
  const [providers, setProviders] = useState<Provider[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    setSuburb(suburbFilter)
  }, [suburbFilter])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const data = await api.listProviders(
          suburbFilter ? suburbNameFromValue(suburbFilter) : undefined,
        )
        if (!cancelled) setProviders(data.providers)
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : 'Failed to load providers'
          if (
            message.includes('Failed to fetch') ||
            message.includes('502') ||
            message.includes('ECONNREFUSED')
          ) {
            setError(
              'API is not running. Keep `npm run dev` open, and in another terminal run `npm run dev:api` (or use `npm run dev:full`).',
            )
          } else {
            setError(message)
          }
          setProviders([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [suburbFilter, reloadToken])

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="font-display text-3xl font-semibold text-olive sm:text-4xl md:text-5xl">
        Find cleaners
      </h1>
      <p className="mt-3 max-w-2xl text-charcoal/70">
        Browse local cleaning providers. Filter by suburb to narrow the list.
      </p>

      <form
        className="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault()
          const params = new URLSearchParams()
          if (suburb.trim()) params.set('suburb', suburb.trim())
          navigate(
            params.size > 0 ? `/providers?${params.toString()}` : '/providers',
          )
        }}
      >
        <SuburbPicker
          id="providers-suburb"
          className="flex-1"
          value={suburb}
          onChange={setSuburb}
          placeholder="Start typing a suburb"
          aria-label="Suburb"
        />
        <button
          type="submit"
          className="min-h-11 w-full rounded-md bg-sage px-4 text-base font-semibold text-white hover:bg-olive sm:w-auto sm:text-sm"
        >
          Filter
        </button>
      </form>

      {suburbFilter && (
        <p className="mt-4 text-sm text-charcoal/60">
          Showing results for{' '}
          <span className="font-medium text-charcoal">{suburbFilter}</span>
          {' · '}
          <button
            type="button"
            className="font-medium text-sage hover:text-olive"
            onClick={() => {
              setSuburb('')
              navigate('/providers')
            }}
          >
            Clear filter
          </button>
        </p>
      )}

      {loading && <p className="mt-10 text-charcoal/60">Loading providers…</p>}

      {error && (
        <div className="mt-10 max-w-xl rounded-md border border-sand bg-sand/40 px-4 py-3 text-sm text-olive">
          <p className="break-words">{error}</p>
          <button
            type="button"
            className="mt-3 font-semibold text-sage hover:text-olive"
            onClick={() => setReloadToken((n) => n + 1)}
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && providers.length > 0 && (
        <ul className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {providers.map((provider) => (
            <li key={provider.id} className="border-b border-sand pb-6">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-xl font-semibold text-charcoal">
                  <Link
                    to={`/providers/${provider.id}`}
                    className="hover:text-olive"
                  >
                    {provider.name}
                  </Link>
                </h2>
                {provider.verified === 1 && (
                  <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-sage">
                    Verified
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-charcoal/60">{provider.suburb}</p>
              <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-charcoal/75">
                {provider.bio}
              </p>
              <Link
                to={`/providers/${provider.id}`}
                className="mt-4 inline-block text-sm font-semibold text-sage hover:text-olive"
              >
                View profile
              </Link>
            </li>
          ))}
        </ul>
      )}

      {!loading && !error && providers.length === 0 && (
        <p className="mt-10 text-charcoal/70">
          No providers found
          {suburbFilter ? ` in ${suburbFilter}` : ''}.{' '}
          <Link to="/join" className="text-sage hover:text-olive">
            Be the first to join
          </Link>
          .
        </p>
      )}
    </div>
  )
}
