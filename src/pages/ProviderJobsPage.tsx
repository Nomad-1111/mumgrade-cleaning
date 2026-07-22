import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, type Job } from '../lib/api'
import { useAuth } from '../lib/auth'

export function ProviderJobsPage() {
  const { provider, loading: authLoading } = useAuth()
  const [area, setArea] = useState<Job[]>([])
  const [direct, setDirect] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!provider) {
      setLoading(false)
      return
    }

    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        const data = await api.listProviderJobs()
        if (cancelled) return
        setArea(data.area)
        setDirect(data.direct)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load jobs')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [provider])

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <p className="text-charcoal/60">Loading jobs…</p>
      </div>
    )
  }

  if (!provider) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-3xl font-semibold text-olive">Jobs</h1>
        <p className="mt-3 text-charcoal/70">Sign in to see jobs in your area.</p>
        <Link
          to="/login"
          className="mt-6 inline-flex rounded-md bg-sage px-4 py-2 text-sm font-semibold text-white hover:bg-olive"
        >
          Provider login
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
      <p className="text-sm font-medium uppercase tracking-[0.16em] text-sage">
        Workspace
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-olive sm:text-4xl">
        Jobs
      </h1>
      <p className="mt-3 text-sm text-charcoal/70 sm:text-base">
        Open jobs near {provider.suburb}, plus requests sent directly to you.
      </p>

      {error && <p className="mt-6 text-sm text-olive">{error}</p>}

      <JobSection title="Sent to you" empty="No direct requests right now." jobs={direct} />
      <JobSection
        title="In your area"
        empty="No open jobs in your suburb yet."
        jobs={area}
      />
    </div>
  )
}

function JobSection({
  title,
  empty,
  jobs,
}: {
  title: string
  empty: string
  jobs: Job[]
}) {
  return (
    <section className="mt-12">
      <h2 className="font-display text-2xl font-semibold text-olive">
        {title}{' '}
        <span className="text-lg font-normal text-charcoal/50">({jobs.length})</span>
      </h2>
      {jobs.length === 0 ? (
        <p className="mt-4 text-sm text-charcoal/70">{empty}</p>
      ) : (
        <ul className="mt-6 space-y-5">
          {jobs.map((job) => (
            <li key={job.id} className="border-b border-sand pb-5 last:border-0">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                <Link
                  to={`/jobs/${job.id}`}
                  className="text-lg font-semibold text-charcoal hover:text-olive"
                >
                  {job.service_type}
                </Link>
                <span className="text-sm text-charcoal/60">{job.suburb}</span>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-charcoal/70">
                {job.description || 'No description provided.'}
              </p>
              <p className="mt-2 text-xs text-charcoal/50">
                Posted by {job.customer_name}
                {job.source === 'direct' ? ' · Direct request' : ''}
              </p>
              <Link
                to={`/jobs/${job.id}`}
                className="mt-3 inline-block text-sm font-semibold text-sage hover:text-olive"
              >
                View & quote
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
