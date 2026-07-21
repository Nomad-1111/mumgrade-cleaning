import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Select } from '../components/Select'
import { api, SERVICE_TYPES } from '../lib/api'

const steps = ['Service', 'Details', 'Contact'] as const

export function PostJobPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    service_type: searchParams.get('service') ?? '',
    suburb: searchParams.get('suburb') ?? '',
    description: '',
    customer_name: '',
    customer_email: '',
    customer_phone: '',
  })

  const canContinue = useMemo(() => {
    if (step === 0) return Boolean(form.service_type && form.suburb.trim())
    if (step === 1) return form.description.trim().length > 8
    return Boolean(form.customer_name.trim() && form.customer_email.trim())
  }, [form, step])

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (step < steps.length - 1) {
      setStep((s) => s + 1)
      return
    }

    setSubmitting(true)
    setError('')
    try {
      const { job } = await api.createJob(form)
      navigate(`/jobs/${job.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create job')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-16">
      <p className="text-sm font-medium uppercase tracking-[0.16em] text-sage">
        Post a job
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-olive sm:text-4xl">
        Tell us about your clean
      </h1>
      <p className="mt-3 text-sm text-charcoal/70 sm:text-base">
        Local cleaners will respond with quotes. No account required for this
        demo.
      </p>

      <ol className="mt-8 flex gap-2 sm:gap-3">
        {steps.map((label, index) => (
          <li
            key={label}
            className={[
              'flex-1 border-b-2 pb-2 text-center text-sm font-medium sm:text-left',
              index <= step
                ? 'border-sage text-olive'
                : 'border-sand text-charcoal/40',
            ].join(' ')}
          >
            <span className="sm:hidden">{index + 1}</span>
            <span className="hidden sm:inline">
              {index + 1}. {label}
            </span>
          </li>
        ))}
      </ol>

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        {step === 0 && (
          <>
            <Field label="Service type">
              <Select
                id="service_type"
                required
                value={form.service_type}
                onChange={(value) => update('service_type', value)}
                placeholder="Select a service"
                aria-label="Service type"
                options={SERVICE_TYPES.map((type) => ({
                  value: type,
                  label: type,
                }))}
              />
            </Field>
            <Field label="Suburb">
              <input
                required
                value={form.suburb}
                onChange={(e) => update('suburb', e.target.value)}
                className="field"
                placeholder="e.g. Bondi"
              />
            </Field>
          </>
        )}

        {step === 1 && (
          <Field label="Job details">
            <textarea
              required
              rows={6}
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              className="field min-h-32 resize-y"
              placeholder="Property size, frequency, access notes, and anything cleaners should know."
            />
          </Field>
        )}

        {step === 2 && (
          <>
            <Field label="Your name">
              <input
                required
                value={form.customer_name}
                onChange={(e) => update('customer_name', e.target.value)}
                className="field"
              />
            </Field>
            <Field label="Email">
              <input
                required
                type="email"
                value={form.customer_email}
                onChange={(e) => update('customer_email', e.target.value)}
                className="field"
              />
            </Field>
            <Field label="Phone (optional)">
              <input
                value={form.customer_phone}
                onChange={(e) => update('customer_phone', e.target.value)}
                className="field"
              />
            </Field>
          </>
        )}

        {error && (
          <p className="rounded-md bg-sand/60 px-3 py-2 text-sm text-olive break-words">
            {error}. Tip: run the API with <code>npm run dev:cf</code> after{' '}
            <code>npm run db:migrate</code>.
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className="min-h-11 text-sm font-medium text-charcoal/70 transition-colors hover:text-olive disabled:opacity-40 sm:min-h-0"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={!canContinue || submitting}
            className="min-h-11 w-full rounded-md bg-sage px-5 text-base font-semibold text-white transition-colors hover:bg-olive disabled:opacity-50 sm:w-auto sm:text-sm"
          >
            {submitting
              ? 'Submitting…'
              : step === steps.length - 1
                ? 'Submit job'
                : 'Continue'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="block">
      <span className="mb-1.5 block text-sm font-medium text-charcoal">
        {label}
      </span>
      {children}
    </div>
  )
}
