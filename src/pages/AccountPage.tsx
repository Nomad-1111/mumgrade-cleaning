import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { SuburbPicker } from '../components/SuburbPicker'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'

const SUBURB_PATTERN = /^.+,\s*[A-Z]{2,3}\s+\d{4}$/

export function AccountPage() {
  const { provider, loading: authLoading, refresh } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({
    name: '',
    suburb: '',
    bio: '',
    email: '',
    phone: '',
  })

  useEffect(() => {
    if (!provider) return
    setForm({
      name: provider.name,
      suburb: provider.suburb,
      bio: provider.bio,
      email: provider.email,
      phone: provider.phone || '',
    })
  }, [provider])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (form.name.trim().length < 2) {
      setError('Enter your business name.')
      return
    }
    if (
      !SUBURB_PATTERN.test(form.suburb.trim()) &&
      form.suburb.trim().length < 2
    ) {
      setError('Enter or select a valid suburb.')
      return
    }
    if (form.bio.trim().length < 20) {
      setError('Bio must be at least 20 characters.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError('Enter a valid email address.')
      return
    }

    setSubmitting(true)
    setError('')
    setMessage('')
    try {
      await api.updateMyProvider({
        name: form.name.trim(),
        suburb: form.suburb.trim(),
        bio: form.bio.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      })
      await refresh()
      setMessage('Profile updated.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update profile')
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">Loading…</div>
    )
  }

  if (!provider) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
        <h1 className="font-display text-3xl font-semibold text-olive">
          My profile
        </h1>
        <p className="mt-3 text-charcoal/70">
          Sign in to update your provider profile.
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

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-16">
      <p className="text-sm font-medium uppercase tracking-[0.16em] text-sage">
        Account
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-olive sm:text-4xl">
        Update your profile
      </h1>
      <p className="mt-3 text-sm text-charcoal/70">
        Changes appear on your public listing.{' '}
        <Link
          to={`/providers/${provider.id}`}
          className="font-medium text-sage hover:text-olive"
        >
          View public profile
        </Link>
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Business name</span>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="field"
          />
        </label>
        <div className="block">
          <span className="mb-1.5 block text-sm font-medium">Suburb</span>
          <SuburbPicker
            id="account-suburb"
            required
            value={form.suburb}
            onChange={(value) => setForm({ ...form, suburb: value })}
            placeholder="Start typing a suburb"
            aria-label="Suburb"
          />
        </div>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Bio</span>
          <textarea
            required
            rows={4}
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            className="field min-h-28 resize-y"
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
            type="tel"
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
        {message && (
          <p className="rounded-md bg-sage/15 px-3 py-2 text-sm text-olive">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="min-h-11 w-full rounded-md bg-sage px-5 text-base font-semibold text-white hover:bg-olive disabled:opacity-50 sm:w-auto sm:text-sm"
        >
          {submitting ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </div>
  )
}
