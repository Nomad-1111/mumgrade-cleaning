import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, type TrainingVideo } from '../lib/api'
import { useAuth } from '../lib/auth'

export function TrainingPage() {
  const { provider, loading: authLoading } = useAuth()
  const [videos, setVideos] = useState<TrainingVideo[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!provider) {
      setLoading(false)
      return
    }

    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        const data = await api.listTraining()
        if (!cancelled) {
          setVideos(data.videos)
          setActiveId(data.videos[0]?.id ?? null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load training')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [provider, authLoading])

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">Loading training…</div>
    )
  }

  if (!provider) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
        <h1 className="font-display text-3xl font-semibold text-olive">
          Training library
        </h1>
        <p className="mt-3 text-charcoal/70">
          Sign in with your provider email to watch Mum Grade training videos.
        </p>
        <Link
          to="/login"
          className="mt-6 inline-flex min-h-11 items-center rounded-md bg-sage px-5 text-sm font-semibold text-white hover:bg-olive"
        >
          Provider login
        </Link>
      </div>
    )
  }

  const active = videos.find((video) => video.id === activeId) ?? null

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
      <p className="text-sm font-medium uppercase tracking-[0.16em] text-sage">
        Provider academy
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-olive sm:text-4xl">
        Training videos
      </h1>
      <p className="mt-3 text-sm text-charcoal/70">
        Signed in as {provider.name} ({provider.email})
      </p>

      {error && (
        <p className="mt-6 rounded-md bg-sand/60 px-3 py-2 text-sm text-olive">
          {error}
        </p>
      )}

      {!error && videos.length === 0 && (
        <p className="mt-10 text-charcoal/70">
          No published training videos yet. Check back soon.
        </p>
      )}

      {videos.length > 0 && (
        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_280px]">
          <div>
            {active ? (
              <>
                <video
                  key={active.id}
                  className="aspect-video w-full rounded-md bg-charcoal object-contain"
                  controls
                  playsInline
                  src={api.trainingMediaUrl(active.id)}
                >
                  Your browser does not support video playback.
                </video>
                <h2 className="mt-4 text-xl font-semibold text-charcoal">
                  {active.title}
                </h2>
                {active.description && (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-charcoal/70">
                    {active.description}
                  </p>
                )}
              </>
            ) : (
              <p className="text-charcoal/60">Select a video to play.</p>
            )}
          </div>

          <ul className="space-y-2">
            {videos.map((video) => (
              <li key={video.id}>
                <button
                  type="button"
                  onClick={() => setActiveId(video.id)}
                  className={[
                    'w-full rounded-md border px-3 py-3 text-left text-sm transition-colors',
                    video.id === activeId
                      ? 'border-sage bg-sage/15 text-olive'
                      : 'border-sand hover:border-sage hover:bg-sand/40',
                  ].join(' ')}
                >
                  <span className="font-semibold">{video.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
