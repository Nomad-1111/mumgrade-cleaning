import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'

export type SelectOption = {
  value: string
  label: string
}

type SelectProps = {
  id?: string
  name?: string
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  required?: boolean
  className?: string
  menuPlacement?: 'bottom' | 'top'
  'aria-label'?: string
}

export function Select({
  id,
  name,
  value,
  onChange,
  options,
  placeholder = 'Select…',
  required = false,
  className = '',
  menuPlacement = 'bottom',
  'aria-label': ariaLabel,
}: SelectProps) {
  const generatedId = useId()
  const selectId = id ?? generatedId
  const listboxId = `${selectId}-listbox`
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const selected = options.find((option) => option.value === value)
  const displayLabel = selected?.label ?? placeholder

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  useEffect(() => {
    if (!open) return
    const index = options.findIndex((option) => option.value === value)
    setActiveIndex(index >= 0 ? index : 0)
  }, [open, options, value])

  function choose(next: string) {
    onChange(next)
    setOpen(false)
  }

  function onTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setOpen(true)
    }
  }

  function onListKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((index) => Math.min(options.length - 1, Math.max(0, index) + 1))
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => Math.max(0, (index < 0 ? 0 : index) - 1))
      return
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      const option = options[activeIndex]
      if (option) choose(option.value)
    }
  }

  return (
    <div ref={rootRef} className={`relative z-40 ${className}`.trim()}>
      <select
        id={selectId}
        name={name}
        required={required}
        value={value}
        tabIndex={-1}
        aria-hidden="true"
        className="pointer-events-none absolute h-px w-px opacity-0"
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <button
        type="button"
        id={`${selectId}-trigger`}
        className={[
          'field flex w-full items-center justify-between gap-2 text-left',
          !selected ? 'text-charcoal/45' : 'text-charcoal',
          open ? 'border-sage' : '',
        ].join(' ')}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        onClick={() => setOpen((isOpen) => !isOpen)}
        onKeyDown={onTriggerKeyDown}
      >
        <span className="truncate">{displayLabel}</span>
        <span
          className={[
            'shrink-0 text-olive transition-transform duration-200',
            open ? 'rotate-180' : '',
          ].join(' ')}
          aria-hidden="true"
        >
          ▾
        </span>
      </button>

      {open && (
        <ul
          id={listboxId}
          role="listbox"
          aria-labelledby={`${selectId}-trigger`}
          tabIndex={-1}
          className={[
            'absolute z-[100] max-h-60 w-full overflow-auto rounded-md border border-sand bg-white py-1 shadow-lg shadow-charcoal/15 outline-none',
            menuPlacement === 'top' ? 'bottom-full mb-1' : 'top-full mt-1',
          ].join(' ')}
          onKeyDown={onListKeyDown}
        >
          {options.map((option, index) => {
            const isSelected = option.value === value
            const isActive = index === activeIndex
            return (
              <li
                key={option.value}
                id={`${selectId}-option-${index}`}
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
                onClick={() => choose(option.value)}
              >
                {option.label}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
