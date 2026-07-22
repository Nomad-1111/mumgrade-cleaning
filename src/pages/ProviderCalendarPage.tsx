import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api, type AvailabilityDay, type Booking } from '../lib/api'
import { useAuth } from '../lib/auth'

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function monthBounds(year: number, month: number) {
  const from = `${year}-${pad(month + 1)}-01`
  const last = new Date(year, month + 1, 0).getDate()
  const to = `${year}-${pad(month + 1)}-${pad(last)}`
  return { from, to }
}

function formatTime(iso: string) {
  const d = new Date(iso.includes('T') ? iso : iso.replace(' ', 'T'))
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' })
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function ProviderCalendarPage() {
  const { provider, loading: authLoading } = useAuth()
  const today = useMemo(() => new Date(), [])
  const [cursor, setCursor] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  )
  const [selected, setSelected] = useState(() => toDateKey(today))
  const [days, setDays] = useState<AvailabilityDay[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [bookingForm, setBookingForm] = useState({
    title: '',
    startTime: '09:00',
    endTime: '12:00',
    notes: '',
  })

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const { from, to } = monthBounds(year, month)

  const availabilityMap = useMemo(() => {
    const map = new Map<string, AvailabilityDay>()
    for (const day of days) map.set(day.date, day)
    return map
  }, [days])

  const bookingsByDate = useMemo(() => {
    const map = new Map<string, Booking[]>()
    for (const booking of bookings) {
      const start = booking.starts_at.slice(0, 10)
      const end = booking.ends_at.slice(0, 10)
      const cursorDate = new Date(start + 'T00:00:00')
      const endDate = new Date(end + 'T00:00:00')
      while (cursorDate <= endDate) {
        const key = toDateKey(cursorDate)
        const list = map.get(key) ?? []
        list.push(booking)
        map.set(key, list)
        cursorDate.setDate(cursorDate.getDate() + 1)
      }
    }
    return map
  }, [bookings])

  const selectedBookings = bookingsByDate.get(selected) ?? []
  const selectedAvailability = availabilityMap.get(selected)

  const cells = useMemo(() => {
    const first = new Date(year, month, 1)
    // Monday-first offset
    const startPad = (first.getDay() + 6) % 7
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const items: Array<{ key: string; date: string | null; dayNum: number | null }> =
      []
    for (let i = 0; i < startPad; i++) {
      items.push({ key: `pad-${i}`, date: null, dayNum: null })
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const date = `${year}-${pad(month + 1)}-${pad(d)}`
      items.push({ key: date, date, dayNum: d })
    }
    while (items.length % 7 !== 0) {
      items.push({ key: `trail-${items.length}`, date: null, dayNum: null })
    }
    return items
  }, [year, month])

  async function reload() {
    const [avail, books] = await Promise.all([
      api.listAvailability(from, to),
      api.listBookings(from, to),
    ])
    setDays(avail.days)
    setBookings(books.bookings)
  }

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
        await reload()
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load calendar')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, from, to])

  async function setDayStatus(status: 'available' | 'unavailable' | null) {
    setSaving(true)
    setError('')
    try {
      await api.setAvailability({ date: selected, status })
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update availability')
    } finally {
      setSaving(false)
    }
  }

  async function onCreateBooking(event: FormEvent) {
    event.preventDefault()
    if (!bookingForm.title.trim()) {
      setError('Enter a booking title.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await api.createBooking({
        title: bookingForm.title.trim(),
        starts_at: `${selected}T${bookingForm.startTime}:00`,
        ends_at: `${selected}T${bookingForm.endTime}:00`,
        notes: bookingForm.notes.trim(),
      })
      setBookingForm({ title: '', startTime: '09:00', endTime: '12:00', notes: '' })
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create booking')
    } finally {
      setSaving(false)
    }
  }

  async function cancelBooking(id: string) {
    setSaving(true)
    setError('')
    try {
      await api.updateBooking(id, { status: 'cancelled' })
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not cancel booking')
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <p className="text-charcoal/60">Loading calendar…</p>
      </div>
    )
  }

  if (!provider) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-3xl font-semibold text-olive">Calendar</h1>
        <p className="mt-3 text-charcoal/70">
          Sign in to manage availability and bookings.
        </p>
        <Link
          to="/login"
          className="mt-6 inline-flex rounded-md bg-sage px-4 py-2 text-sm font-semibold text-white hover:bg-olive"
        >
          Provider login
        </Link>
      </div>
    )
  }

  const monthLabel = cursor.toLocaleString('en-AU', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-16">
      <p className="text-sm font-medium uppercase tracking-[0.16em] text-sage">
        Workspace
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-olive sm:text-4xl">
        Calendar
      </h1>
      <p className="mt-3 text-sm text-charcoal/70 sm:text-base">
        Mark availability and keep track of bookings.
      </p>

      {error && <p className="mt-4 text-sm text-olive">{error}</p>}

      <div className="mt-8 flex items-center justify-between gap-3">
        <button
          type="button"
          className="rounded-md border border-sand px-3 py-2 text-sm font-medium text-olive hover:border-sage"
          onClick={() => setCursor(new Date(year, month - 1, 1))}
        >
          Previous
        </button>
        <h2 className="font-display text-xl font-semibold text-charcoal">
          {monthLabel}
        </h2>
        <button
          type="button"
          className="rounded-md border border-sand px-3 py-2 text-sm font-medium text-olive hover:border-sage"
          onClick={() => setCursor(new Date(year, month + 1, 1))}
        >
          Next
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-medium uppercase tracking-wide text-charcoal/50">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-2">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell) => {
          if (!cell.date) {
            return <div key={cell.key} className="min-h-16 rounded-md bg-transparent" />
          }
          const avail = availabilityMap.get(cell.date)
          const dayBookings = bookingsByDate.get(cell.date) ?? []
          const isSelected = cell.date === selected
          const isToday = cell.date === toDateKey(today)
          return (
            <button
              key={cell.key}
              type="button"
              onClick={() => setSelected(cell.date!)}
              className={[
                'min-h-16 rounded-md border p-1.5 text-left transition-colors',
                isSelected
                  ? 'border-olive bg-sand/70'
                  : 'border-sand/80 hover:border-sage',
                avail?.status === 'available' ? 'bg-sage/15' : '',
                avail?.status === 'unavailable' ? 'bg-charcoal/5' : '',
              ].join(' ')}
            >
              <span
                className={[
                  'text-sm font-semibold',
                  isToday ? 'text-sage' : 'text-charcoal',
                ].join(' ')}
              >
                {cell.dayNum}
              </span>
              {dayBookings.length > 0 && (
                <span className="mt-1 block text-[0.65rem] font-medium text-olive">
                  {dayBookings.length} booking{dayBookings.length > 1 ? 's' : ''}
                </span>
              )}
              {avail && (
                <span className="mt-0.5 block text-[0.6rem] capitalize text-charcoal/55">
                  {avail.status}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-charcoal/60">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-sage/30" /> Available
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-charcoal/10" /> Unavailable
        </span>
      </div>

      <section className="mt-10 border-t border-sand pt-8">
        <h3 className="font-display text-2xl font-semibold text-olive">
          {selected}
        </h3>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => void setDayStatus('available')}
            className="rounded-md bg-sage px-3 py-2 text-sm font-semibold text-white hover:bg-olive disabled:opacity-60"
          >
            Mark available
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void setDayStatus('unavailable')}
            className="rounded-md border border-sand px-3 py-2 text-sm font-semibold text-olive hover:border-sage disabled:opacity-60"
          >
            Mark unavailable
          </button>
          <button
            type="button"
            disabled={saving || !selectedAvailability}
            onClick={() => void setDayStatus(null)}
            className="rounded-md px-3 py-2 text-sm font-medium text-charcoal/70 hover:text-olive disabled:opacity-40"
          >
            Clear
          </button>
        </div>

        {selectedAvailability?.note && (
          <p className="mt-3 text-sm text-charcoal/60">{selectedAvailability.note}</p>
        )}

        <h4 className="mt-8 text-sm font-semibold uppercase tracking-wide text-charcoal/60">
          Bookings
        </h4>
        {selectedBookings.length === 0 ? (
          <p className="mt-3 text-sm text-charcoal/70">No bookings on this day.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {selectedBookings.map((booking) => (
              <li
                key={booking.id}
                className="flex flex-col gap-2 border-b border-sand pb-3 sm:flex-row sm:items-start sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-charcoal">{booking.title}</p>
                  <p className="text-sm text-charcoal/60">
                    {formatTime(booking.starts_at)} – {formatTime(booking.ends_at)}
                  </p>
                  {booking.notes && (
                    <p className="mt-1 text-sm text-charcoal/70">{booking.notes}</p>
                  )}
                </div>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void cancelBooking(booking.id)}
                  className="text-sm font-medium text-charcoal/60 hover:text-olive"
                >
                  Cancel
                </button>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={onCreateBooking} className="mt-8 space-y-4">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-charcoal/60">
            Add booking
          </h4>
          <label className="block text-sm">
            <span className="font-medium text-charcoal">Title</span>
            <input
              className="mt-1 w-full rounded-md border border-sand bg-white px-3 py-2.5 text-base"
              value={bookingForm.title}
              onChange={(e) =>
                setBookingForm((f) => ({ ...f, title: e.target.value }))
              }
              placeholder="e.g. Deep clean — Smith"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="font-medium text-charcoal">Start</span>
              <input
                type="time"
                className="mt-1 w-full rounded-md border border-sand bg-white px-3 py-2.5 text-base"
                value={bookingForm.startTime}
                onChange={(e) =>
                  setBookingForm((f) => ({ ...f, startTime: e.target.value }))
                }
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-charcoal">End</span>
              <input
                type="time"
                className="mt-1 w-full rounded-md border border-sand bg-white px-3 py-2.5 text-base"
                value={bookingForm.endTime}
                onChange={(e) =>
                  setBookingForm((f) => ({ ...f, endTime: e.target.value }))
                }
              />
            </label>
          </div>
          <label className="block text-sm">
            <span className="font-medium text-charcoal">Notes</span>
            <textarea
              className="mt-1 w-full rounded-md border border-sand bg-white px-3 py-2.5 text-base"
              rows={2}
              value={bookingForm.notes}
              onChange={(e) =>
                setBookingForm((f) => ({ ...f, notes: e.target.value }))
              }
            />
          </label>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-sage px-4 py-2.5 text-sm font-semibold text-white hover:bg-olive disabled:opacity-60"
          >
            Save booking
          </button>
        </form>
      </section>
    </div>
  )
}
