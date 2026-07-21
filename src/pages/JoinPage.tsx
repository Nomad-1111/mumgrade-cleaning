import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'

export function JoinPage() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    suburb: '',
    bio: '',
    email: '',
    phone: '',
  })

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const { provider } = await api.createProvider(form)
      navigate(`/providers/${provider.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create provider')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-16">
      <p className="text-sm font-medium uppercase tracking-[0.16em] text-sage">
        Providers
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-olive sm:text-4xl">
        List your cleaning business
      </h1>
      <p className="mt-3 text-sm text-charcoal/70 sm:text-base">
        Join Mum Grade to receive job leads from nearby customers. Auth comes in
        a later release — this form creates a public profile.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Business name</span>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="field"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Suburb</span>
          <input
            required
            value={form.suburb}
            onChange={(e) => setForm({ ...form, suburb: e.target.value })}
            className="field"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Bio</span>
          <textarea
            rows={4}
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            className="field min-h-28 resize-y"
            placeholder="Tell customers what makes your cleans special."
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Email</span>
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="field"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Phone</span>
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="field"
          />
        </label>

        {error && (
          <p className="rounded-md bg-sand/60 px-3 py-2 text-sm text-olive break-words">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="min-h-11 w-full rounded-md bg-sage px-5 text-base font-semibold text-white transition-colors hover:bg-olive disabled:opacity-50 sm:w-auto sm:text-sm"
        >
          {submitting ? 'Submitting…' : 'Create profile'}
        </button>
      </form>
    </div>
  )
}
