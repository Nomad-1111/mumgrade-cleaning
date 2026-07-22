import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'

export type SuburbRecord = {
  n: string
  s: string
  p: string
}

type SuburbPickerProps = {
  id?: string
  name?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  className?: string
  'aria-label'?: string
}

let suburbsCache: SuburbRecord[] | null = null
let suburbsPromise: Promise<SuburbRecord[]> | null = null

async function loadSuburbs(): Promise<SuburbRecord[]> {
  if (suburbsCache) return suburbsCache
  if (!suburbsPromise) {
    suburbsPromise = fetch('/data/au-suburbs.json')
      .then((res) => {
        if (!res.ok) throw new Error('Could not load suburb list')
        return res.json() as Promise<SuburbRecord[]>
      })
      .then((data) => {
        suburbsCache = data
        return data
      })
      .catch((err) => {
        suburbsPromise = null
        throw err
      })
  }
  return suburbsPromise
}

export function formatSuburb(record: SuburbRecord) {
  return `${record.n}, ${record.s} ${record.p}`
}

/** Suburb name only — useful for API filters against short stored values. */
export function suburbNameFromValue(value: string) {
  return value.split(',')[0]?.trim() ?? value.trim()
}

function scoreMatch(record: SuburbRecord, query: string) {
  const name = record.n.toLowerCase()
  const full = `${name} ${record.s.toLowerCase()} ${record.p}`
  if (name.startsWith(query)) return 0
  if (record.p.startsWith(query)) return 1
  if (name.includes(query)) return 2
  if (full.includes(query)) return 3
  return -1
}

export function SuburbPicker({
  id,
  name,
  value,
  onChange,
  placeholder = 'Suburb',
  required = false,
  className = '',
  'aria-label': ariaLabel,
}: SuburbPickerProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const listboxId = `${inputId}-listbox`
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(value)
  const [activeIndex, setActiveIndex] = useState(0)
  const [suburbs, setSuburbs] = useState<SuburbRecord[]>(suburbsCache ?? [])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    setQuery(value)
  }, [value])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
        setQuery(value)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open, value])

  async function ensureLoaded() {
    if (suburbsCache?.length) {
      setSuburbs(suburbsCache)
      return
    }
    setLoading(true)
    setLoadError('')
    try {
      const data = await loadSuburbs()
      setSuburbs(data)
    } catch {
      setLoadError('Could not load suburbs. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q.length < 2) return []
    const scored: { record: SuburbRecord; score: number }[] = []
    for (const record of suburbs) {
      const score = scoreMatch(record, q)
      if (score >= 0) scored.push({ record, score })
    }
    scored.sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score
      return a.record.n.localeCompare(b.record.n)
    })
    return scored.slice(0, 12).map((item) => item.record)
  }, [query, suburbs])

  useEffect(() => {
    setActiveIndex(0)
  }, [query, open])

  function choose(record: SuburbRecord) {
    const next = formatSuburb(record)
    onChange(next)
    setQuery(next)
    setOpen(false)
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!open && (event.key === 'ArrowDown' || event.key === 'Enter')) {
      if (matches.length) setOpen(true)
      return
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
      setQuery(value)
      return
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setActiveIndex((i) => Math.min(matches.length - 1, i + 1))
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((i) => Math.max(0, i - 1))
      return
    }
    if (event.key === 'Enter' && open && matches[activeIndex]) {
      event.preventDefault()
      choose(matches[activeIndex])
    }
  }

  return (
    <div ref={rootRef} className={`relative z-40 ${className}`.trim()}>
      <input
        type="text"
        id={inputId}
        name={name}
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-label={ariaLabel ?? placeholder}
        autoComplete="off"
        required={required}
        value={query}
        placeholder={placeholder}
        className="field w-full placeholder:text-charcoal/40"
        onFocus={() => {
          void ensureLoaded()
          if (query.trim().length >= 2) setOpen(true)
        }}
        onChange={(event) => {
          const next = event.target.value
          setQuery(next)
          onChange(next)
          setOpen(next.trim().length >= 2)
          void ensureLoaded()
        }}
        onKeyDown={onKeyDown}
        onBlur={() => {
          // Allow option click; close shortly after if focus left the widget
          window.setTimeout(() => {
            if (!rootRef.current?.contains(document.activeElement)) {
              setOpen(false)
              setQuery(value)
            }
          }, 120)
        }}
      />

      {open && query.trim().length >= 2 && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute top-full z-[100] mt-1 max-h-64 w-full overflow-auto rounded-md border border-sand bg-white py-1 shadow-lg shadow-charcoal/15"
        >
          {loading && (
            <li className="px-3 py-2.5 text-sm text-charcoal/60">Loading suburbs…</li>
          )}
          {!loading && loadError && (
            <li className="px-3 py-2.5 text-sm text-olive">{loadError}</li>
          )}
          {!loading && !loadError && matches.length === 0 && (
            <li className="px-3 py-2.5 text-sm text-charcoal/60">
              No matching Australian suburbs
            </li>
          )}
          {!loading &&
            matches.map((record, index) => {
              const label = formatSuburb(record)
              const isActive = index === activeIndex
              const isSelected = label === value
              return (
                <li
                  key={`${record.n}-${record.s}-${record.p}`}
                  role="option"
                  aria-selected={isSelected}
                  className={[
                    'cursor-pointer px-3 py-2.5 text-base transition-colors',
                    isSelected
                      ? 'bg-sage text-white'
                      : isActive
                        ? 'bg-sand text-olive'
                        : 'text-charcoal hover:bg-sand hover:text-olive',
                  ].join(' ')}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(event) => {
                    event.preventDefault()
                    choose(record)
                  }}
                >
                  <span className="font-medium">{record.n}</span>
                  <span
                    className={
                      isSelected ? 'text-white/85' : 'text-charcoal/55'
                    }
                  >
                    {` ${record.s} ${record.p}`}
                  </span>
                </li>
              )
            })}
        </ul>
      )}
    </div>
  )
}
