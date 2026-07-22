import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [devLink, setDevLink] = useState('')

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setMessage('')
    setDevLink('')
    try {
      const result = await api.requestMagicLink(email.trim())
      setMessage(
        result.message ||
          'If that email is registered, a login link is on its way.',
      )
      if (result.devMagicLink) setDevLink(result.devMagicLink)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send login link')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:px-6 sm:py-16">
      <p className="text-sm font-medium uppercase tracking-[0.16em] text-sage">
        Providers
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-olive sm:text-4xl">
        Provider login
      </h1>
      <p className="mt-3 text-sm text-charcoal/70 sm:text-base">
        Use the email from your Mum Grade provider profile. We’ll send a
        one-time magic link — no password needed.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Email</span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="field"
            autoComplete="email"
            placeholder="you@business.com.au"
          />
        </label>

        {error && (
          <p className="rounded-md bg-sand/60 px-3 py-2 text-sm text-olive break-words">
            {error}
          </p>
        )}
        {message && (
          <p className="rounded-md bg-sage/15 px-3 py-2 text-sm text-olive break-words">
            {message}
          </p>
        )}
        {devLink && (
          <p className="rounded-md border border-sand px-3 py-2 text-sm break-all">
            Dev login link:{' '}
            <a href={devLink} className="font-medium text-sage hover:text-olive">
              {devLink}
            </a>
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="min-h-11 w-full rounded-md bg-sage px-5 text-base font-semibold text-white hover:bg-olive disabled:opacity-50 sm:w-auto sm:text-sm"
        >
          {submitting ? 'Sending…' : 'Email me a login link'}
        </button>
      </form>

      <p className="mt-8 text-sm text-charcoal/60">
        Not listed yet?{' '}
        <Link to="/join" className="font-medium text-sage hover:text-olive">
          Join as a provider
        </Link>
      </p>
    </div>
  )
}
