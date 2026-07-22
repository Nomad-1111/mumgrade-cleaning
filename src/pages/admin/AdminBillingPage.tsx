import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api, formatMoney, type Invoice, type Provider } from '../../lib/api'

export function AdminBillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [status, setStatus] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({
    provider_id: '',
    amount: '',
    description: '',
    due_at: '',
    status: 'sent',
  })

  async function load(filter = status) {
    setLoading(true)
    setError('')
    try {
      const [inv, prov] = await Promise.all([
        api.adminListInvoices(filter),
        api.adminListProviders({ status: 'all' }),
      ])
      setInvoices(inv.invoices)
      setProviders(prov.providers)
      if (!form.provider_id && prov.providers[0]) {
        setForm((f) => ({ ...f, provider_id: prov.providers[0].id }))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load billing')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function onCreate(event: FormEvent) {
    event.preventDefault()
    const dollars = Number(form.amount)
    if (!form.provider_id || !Number.isFinite(dollars) || dollars <= 0) {
      setError('Choose a provider and enter a valid amount.')
      return
    }
    setError('')
    setMessage('')
    try {
      await api.adminCreateInvoice({
        provider_id: form.provider_id,
        amount_cents: Math.round(dollars * 100),
        description: form.description.trim(),
        due_at: form.due_at || undefined,
        status: form.status,
      })
      setMessage('Invoice created.')
      setForm((f) => ({ ...f, amount: '', description: '', due_at: '' }))
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create invoice')
    }
  }

  async function setInvoiceStatus(id: string, next: string) {
    try {
      await api.adminUpdateInvoice(id, { status: next })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update invoice')
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-olive">Billing</h1>
      <p className="mt-2 text-sm text-charcoal/70">
        Manual invoices for providers. Stripe can be wired later.
      </p>

      <form
        onSubmit={onCreate}
        className="mt-8 max-w-xl space-y-4 border-b border-sand pb-10"
      >
        <h2 className="font-display text-xl font-semibold text-olive">
          Create invoice
        </h2>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Provider</span>
          <select
            className="field"
            value={form.provider_id}
            onChange={(e) =>
              setForm((f) => ({ ...f, provider_id: e.target.value }))
            }
            required
          >
            {providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Amount (AUD)</span>
          <input
            type="number"
            min="1"
            step="0.01"
            className="field"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            required
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Description</span>
          <input
            className="field"
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            placeholder="Monthly Pro listing"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Due date</span>
            <input
              type="date"
              className="field"
              value={form.due_at}
              onChange={(e) =>
                setForm((f) => ({ ...f, due_at: e.target.value }))
              }
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Status</span>
            <select
              className="field"
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({ ...f, status: e.target.value }))
              }
            >
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
            </select>
          </label>
        </div>
        {error && <p className="text-sm text-olive">{error}</p>}
        {message && <p className="text-sm text-sage">{message}</p>}
        <button
          type="submit"
          className="min-h-11 rounded-md bg-sage px-4 text-sm font-semibold text-white hover:bg-olive"
        >
          Create invoice
        </button>
      </form>

      <div className="mt-8 flex flex-wrap items-end gap-3">
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Filter</span>
          <select
            className="field sm:w-40"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              void load(e.target.value)
            }}
          >
            <option value="all">All</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="void">Void</option>
          </select>
        </label>
      </div>

      {loading && <p className="mt-6 text-charcoal/60">Loading…</p>}

      {!loading && (
        <ul className="mt-6 space-y-4">
          {invoices.map((inv) => (
            <li
              key={inv.id}
              className="flex flex-col gap-3 border-b border-sand pb-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <div>
                <Link
                  to={`/admin/providers/${inv.provider_id}`}
                  className="font-semibold text-charcoal hover:text-olive"
                >
                  {inv.provider_name || inv.provider_id}
                </Link>
                <p className="mt-1 text-sm text-charcoal/70">
                  {formatMoney(inv.amount_cents)} ·{' '}
                  <span className="capitalize">{inv.status}</span>
                  {inv.description ? ` · ${inv.description}` : ''}
                </p>
                {inv.due_at && (
                  <p className="text-xs text-charcoal/50">Due {inv.due_at}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2 text-sm">
                {inv.status !== 'sent' && inv.status !== 'paid' && (
                  <button
                    type="button"
                    className="font-medium text-sage hover:text-olive"
                    onClick={() => void setInvoiceStatus(inv.id, 'sent')}
                  >
                    Mark sent
                  </button>
                )}
                {inv.status !== 'paid' && inv.status !== 'void' && (
                  <button
                    type="button"
                    className="font-medium text-sage hover:text-olive"
                    onClick={() => void setInvoiceStatus(inv.id, 'paid')}
                  >
                    Mark paid
                  </button>
                )}
                {inv.status !== 'void' && (
                  <button
                    type="button"
                    className="font-medium text-charcoal/60 hover:text-olive"
                    onClick={() => void setInvoiceStatus(inv.id, 'void')}
                  >
                    Void
                  </button>
                )}
              </div>
            </li>
          ))}
          {invoices.length === 0 && (
            <li className="text-sm text-charcoal/60">No invoices found.</li>
          )}
        </ul>
      )}
    </div>
  )
}
