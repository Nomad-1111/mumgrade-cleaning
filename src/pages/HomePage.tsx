import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Select } from '../components/Select'
import { SERVICE_TYPES } from '../lib/api'

const categories = [
  {
    name: 'House Cleaning',
    blurb: 'Regular weekly or fortnightly home cleans.',
  },
  {
    name: 'End of Lease',
    blurb: 'Bond-ready cleans with attention to detail.',
  },
  {
    name: 'Deep Clean',
    blurb: 'Seasonal resets for kitchens, baths, and more.',
  },
  {
    name: 'Office Cleaning',
    blurb: 'Reliable commercial cleans for small teams.',
  },
]

const steps = [
  {
    title: 'Tell us what you need',
    body: 'Answer a few quick questions about your clean and suburb.',
  },
  {
    title: 'Get quotes from local cleaners',
    body: 'We alert nearby providers so you can compare options.',
  },
  {
    title: 'Choose the best fit',
    body: 'Review profiles and pick the cleaner that feels right.',
  },
]

export function HomePage() {
  const navigate = useNavigate()
  const [service, setService] = useState('')
  const [suburb, setSuburb] = useState('')

  function onSearch(event: FormEvent) {
    event.preventDefault()
    const params = new URLSearchParams()
    if (service) params.set('service', service)
    if (suburb) params.set('suburb', suburb)
    navigate(`/post-job?${params.toString()}`)
  }

  return (
    <>
      <section className="relative z-20 min-h-[min(88dvh,860px)]">
        <div className="absolute inset-0 overflow-hidden">
          <img
            src="/brand/hero.png"
            alt="Bright, spotless modern living room with garden views"
            className="absolute inset-0 h-full w-full object-cover object-[center_45%]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/45 to-charcoal/25 sm:bg-gradient-to-r sm:from-charcoal/75 sm:via-charcoal/40 sm:to-charcoal/15" />
        </div>
        <div className="relative z-20 mx-auto flex min-h-[min(88dvh,860px)] max-w-6xl flex-col justify-end px-4 pb-12 pt-24 sm:px-6 sm:pb-20 sm:pt-28">
          <p className="font-display text-4xl font-semibold tracking-tight text-cream sm:text-5xl md:text-7xl">
            Mum Grade
          </p>
          <h1 className="mt-3 max-w-xl font-display text-xl font-medium leading-snug text-cream/95 sm:mt-4 sm:text-2xl md:text-3xl">
            Connect with trusted local cleaners
          </h1>
          <p className="mt-3 max-w-lg text-sm text-cream/85 sm:text-base md:text-lg">
            Post a job, compare quotes, and choose a cleaner who sweats the
            small details.
          </p>

          <form
            onSubmit={onSearch}
            className="relative z-30 mt-6 flex w-full max-w-2xl flex-col gap-3 rounded-lg bg-cream/95 p-3 shadow-lg shadow-charcoal/10 backdrop-blur sm:mt-8 sm:flex-row sm:items-center"
          >
            <label className="sr-only" htmlFor="service">
              What do you need help with?
            </label>
            <Select
              id="service"
              className="flex-1"
              value={service}
              onChange={setService}
              menuPlacement="bottom"
              placeholder="What do you need help with?"
              aria-label="What do you need help with?"
              options={SERVICE_TYPES.map((type) => ({
                value: type,
                label: type,
              }))}
            />
            <label className="sr-only" htmlFor="suburb">
              Suburb
            </label>
            <input
              id="suburb"
              value={suburb}
              onChange={(e) => setSuburb(e.target.value)}
              placeholder="Suburb"
              className="field flex-1 placeholder:text-charcoal/40"
            />
            <button
              type="submit"
              className="min-h-11 w-full rounded-md bg-sage px-5 text-base font-semibold text-white transition-colors hover:bg-olive sm:w-auto sm:text-sm"
            >
              Get quotes
            </button>
          </form>
        </div>
      </section>

      <section className="relative z-0 mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <h2 className="font-display text-3xl font-semibold text-olive sm:text-4xl">
          How Mum Grade works
        </h2>
        <p className="mt-3 max-w-2xl text-charcoal/70">
          A simple path from “I need a clean” to a booked local provider.
        </p>
        <ol className="mt-10 grid gap-8 sm:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title} className="relative">
              <span className="font-display text-4xl font-semibold text-sage/80">
                {index + 1}
              </span>
              <h3 className="mt-2 text-lg font-semibold text-charcoal">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-charcoal/70">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-sand/35">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 className="font-display text-3xl font-semibold text-olive sm:text-4xl">
            Popular cleaning categories
          </h2>
          <p className="mt-3 max-w-2xl text-charcoal/70">
            Start with the service you need — we will match you with nearby
            cleaners.
          </p>
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <li key={category.name}>
                <Link
                  to={`/post-job?service=${encodeURIComponent(category.name)}`}
                  className="block border-b border-sand pb-4 transition-colors hover:border-sage"
                >
                  <h3 className="text-lg font-semibold text-charcoal">
                    {category.name}
                  </h3>
                  <p className="mt-2 text-sm text-charcoal/70">
                    {category.blurb}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid gap-8 sm:grid-cols-3">
          {[
            {
              title: 'Local & verified',
              body: 'Browse cleaners in your suburb with clear profiles.',
            },
            {
              title: 'Compare quotes',
              body: 'See multiple offers so you can choose on price and fit.',
            },
            {
              title: 'Detail-minded',
              body: 'Built for homes that care about the small, overlooked spots.',
            },
          ].map((item) => (
            <div key={item.title}>
              <h3 className="font-display text-xl font-semibold text-olive">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-charcoal/70">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-sand bg-olive">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-14 sm:flex-row sm:items-center sm:px-6">
          <div>
            <h2 className="font-display text-3xl font-semibold text-cream">
              Run a cleaning business?
            </h2>
            <p className="mt-2 max-w-lg text-cream/80">
              List your business on Mum Grade and get matched with local job
              leads.
            </p>
          </div>
          <Link
            to="/join"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-sage px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-cream hover:text-olive sm:w-auto"
          >
            List your business
          </Link>
        </div>
      </section>
    </>
  )
}
