import { useEffect, useState, type FormEvent } from 'react'
import { api, type TrainingVideo } from '../../lib/api'

export function AdminTrainingPage() {
  const [videos, setVideos] = useState<TrainingVideo[]>([])
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    published: true,
  })
  const [file, setFile] = useState<File | null>(null)

  async function loadVideos() {
    setLoading(true)
    setError('')
    try {
      const data = await api.adminListTraining()
      setVideos(data.videos)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load videos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadVideos()
  }, [])

  async function onUpload(event: FormEvent) {
    event.preventDefault()
    if (!file) {
      setError('Choose a video file to upload.')
      return
    }
    setUploading(true)
    setError('')
    setMessage('')
    try {
      const body = new FormData()
      body.set('title', form.title)
      body.set('description', form.description)
      body.set('published', form.published ? '1' : '0')
      body.set('file', file)
      await api.adminUploadTraining(body)
      setMessage('Video uploaded to R2 and saved.')
      setForm({ title: '', description: '', published: true })
      setFile(null)
      await loadVideos()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function togglePublished(video: TrainingVideo) {
    try {
      await api.adminUpdateTraining(video.id, {
        published: !(video.published === 1),
      })
      await loadVideos()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed')
    }
  }

  async function removeVideo(video: TrainingVideo) {
    if (!confirm(`Delete “${video.title}”?`)) return
    try {
      await api.adminDeleteTraining(video.id)
      await loadVideos()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-olive sm:text-4xl">
        Training
      </h1>
      <p className="mt-3 text-sm text-charcoal/70">
        Upload videos to R2. Published videos appear in the provider training
        library after magic-link login.
      </p>

      <form onSubmit={onUpload} className="mt-8 space-y-4 border-b border-sand pb-10">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Title</span>
          <input
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="field"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Description</span>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="field min-h-24 resize-y"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Video file</span>
          <input
            required
            type="file"
            accept="video/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm"
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) =>
              setForm({ ...form, published: e.target.checked })
            }
          />
          Publish immediately
        </label>

        {error && (
          <p className="rounded-md bg-sand/60 px-3 py-2 text-sm text-olive break-words">
            {error}
          </p>
        )}
        {message && (
          <p className="rounded-md bg-sage/15 px-3 py-2 text-sm text-olive">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={uploading}
          className="min-h-11 rounded-md bg-sage px-5 text-sm font-semibold text-white hover:bg-olive disabled:opacity-50"
        >
          {uploading ? 'Uploading…' : 'Upload to R2'}
        </button>
      </form>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold text-olive">
          Library
        </h2>
        {loading && <p className="mt-4 text-sm text-charcoal/60">Loading…</p>}
        {!loading && videos.length === 0 && (
          <p className="mt-4 text-sm text-charcoal/60">No videos uploaded yet.</p>
        )}
        <ul className="mt-6 space-y-4">
          {videos.map((video) => (
            <li
              key={video.id}
              className="flex flex-col gap-3 border-b border-sand pb-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <div>
                <p className="font-semibold text-charcoal">{video.title}</p>
                <p className="mt-1 text-sm text-charcoal/60">
                  {video.published === 1 ? 'Published' : 'Draft'} ·{' '}
                  {Math.round((video.size_bytes || 0) / (1024 * 1024))} MB
                </p>
                {video.description && (
                  <p className="mt-2 text-sm text-charcoal/70">
                    {video.description}
                  </p>
                )}
              </div>
              <div className="flex gap-3 text-sm">
                <button
                  type="button"
                  className="font-medium text-sage hover:text-olive"
                  onClick={() => void togglePublished(video)}
                >
                  {video.published === 1 ? 'Unpublish' : 'Publish'}
                </button>
                <button
                  type="button"
                  className="font-medium text-olive/80 hover:text-olive"
                  onClick={() => void removeVideo(video)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
