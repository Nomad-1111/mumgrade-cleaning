import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { SuburbPicker } from '../components/SuburbPicker'
import { api, type Provider } from '../lib/api'

const SUBURB_PATTERN = /^.+,\s*[A-Z]{2,3}\s+\d{4}$/

type JoinForm = {
  name: string
  suburb: string
  bio: string
  email: string
  phone: string
}

const emptyForm: JoinForm = {
  name: '',
  suburb: '',
  bio: '',
  email: '',
  phone: '',
}

function validate(form: JoinForm): string | null {
  if (form.name.trim().length < 2) {
    return 'Enter your business name.'
  }
  if (!SUBURB_PATTERN.test(form.suburb.trim())) {
    return 'Select an Australian suburb from the list (e.g. Bondi, NSW 2026).'
  }
  if (form.bio.trim().length < 20) {
    return 'Add a short bio (at least 20 characters) so customers know what you offer.'
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    return 'Enter a valid email address.'
  }
  if (form.phone.trim() && form.phone.trim().replace(/\s/g, '').length < 8) {
    return 'Enter a valid phone number, or leave it blank.'
  }
  return null
}

export function JoinPage() {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<JoinForm>(emptyForm)
  const [created, setCreated] = useState<Provider | null>(null)

  const canSubmit = useMemo(() => !validate(form), [form])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const validationError = validate(form)
    if (validationError) {
      setError(validationError)
      return
    }

    setSubmitting(true)
    setError('')
    try {
      const { provider } = await api.createProvider({
        name: form.name.trim(),
        suburb: form.suburb.trim(),
        bio: form.bio.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      })
      setCreated(provider)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Could not create provider'
      if (
        message.includes('Failed to fetch') ||
        message.includes('NetworkError') ||
        message.includes('Load failed')
      ) {
        setError(
          'Could not reach the API. Run the Cloudflare stack (`npm run build` then `npx wrangler pages dev dist --port 8788`) alongside `npm run dev`, or use `npm run dev:cf`.',
        )
      } else {
        setError(message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (created) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-16">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-sage">
          You’re listed
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-olive sm:text-4xl">
          Profile created
        </h1>
        <p className="mt-3 text-sm text-charcoal/70 sm:text-base">
          These details are saved and visible on your public provider profile.
        </p>

        <dl className="mt-8 space-y-4 border-t border-sand pt-8 text-sm">
          <div>
            <dt className="font-medium text-charcoal">Business name</dt>
            <dd className="mt-1 text-charcoal/80">{created.name}</dd>
          </div>
          <div>
            <dt className="font-medium text-charcoal">Suburb</dt>
            <dd className="mt-1 text-charcoal/80">{created.suburb}</dd>
          </div>
          <div>
            <dt className="font-medium text-charcoal">Bio</dt>
            <dd className="mt-1 whitespace-pre-wrap text-charcoal/80">
              {created.bio}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-charcoal">Email</dt>
            <dd className="mt-1 break-words text-charcoal/80">{created.email}</dd>
          </div>
          <div>
            <dt className="font-medium text-charcoal">Phone</dt>
            <dd className="mt-1 text-charcoal/80">
              {created.phone || 'Not provided'}
            </dd>
          </div>
        </dl>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            to={`/providers/${created.id}`}
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-sage px-5 text-base font-semibold text-white hover:bg-olive sm:text-sm"
          >
            View public profile
          </Link>
          <Link
            to="/providers"
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-sand px-5 text-base font-semibold text-olive hover:border-sage sm:text-sm"
          >
            Browse providers
          </Link>
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center text-sm font-medium text-charcoal/70 hover:text-olive"
            onClick={() => {
              setCreated(null)
              setForm(emptyForm)
              setError('')
            }}
          >
            List another business
          </button>
        </div>
      </div>
    )
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
        a later release — this form creates a public profile and saves your
        details.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Business name</span>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="field"
            placeholder="e.g. Sparkle & Co Cleaning"
            autoComplete="organization"
          />
        </label>
        <div className="block">
          <span className="mb-1.5 block text-sm font-medium">Suburb</span>
          <SuburbPicker
            id="join-suburb"
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
            placeholder="Tell customers what makes your cleans special (services, areas, experience)."
          />
          <span className="mt-1 block text-xs text-charcoal/50">
            {form.bio.trim().length}/20 characters minimum
          </span>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Email</span>
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="field"
            autoComplete="email"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">
            Phone <span className="font-normal text-charcoal/50">(optional)</span>
          </span>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="field"
            placeholder="04xx xxx xxx"
            autoComplete="tel"
          />
        </label>

        {error && (
          <p className="rounded-md bg-sand/60 px-3 py-2 text-sm text-olive break-words">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || !canSubmit}
          className="min-h-11 w-full rounded-md bg-sage px-5 text-base font-semibold text-white transition-colors hover:bg-olive disabled:opacity-50 sm:w-auto sm:text-sm"
        >
          {submitting ? 'Saving…' : 'Create profile'}
        </button>
      </form>
    </div>
  )
}
