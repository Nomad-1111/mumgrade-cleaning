import { Link } from 'react-router-dom'

const steps = [
  {
    title: 'Tell us what you need',
    body: 'Share the type of clean, your suburb, and a few details about the property.',
  },
  {
    title: 'Get multiple quotes',
    body: 'Nearby cleaning providers are alerted and can send you quotes to compare.',
  },
  {
    title: 'Choose your cleaner',
    body: 'Review profiles, pricing, and messages — then pick the best fit for your home.',
  },
]

export function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
      <h1 className="font-display text-3xl font-semibold text-olive sm:text-4xl md:text-5xl">
        How it works
      </h1>
      <p className="mt-4 text-base text-charcoal/70 sm:text-lg">
        Mum Grade makes it easy to find trusted local cleaners — similar to how
        hipages connects people with tradies, focused on cleaning.
      </p>

      <ol className="mt-12 space-y-10">
        {steps.map((step, index) => (
          <li key={step.title} className="flex gap-4 sm:gap-5">
            <span className="shrink-0 font-display text-3xl font-semibold text-sage sm:text-4xl">
              {index + 1}
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-charcoal sm:text-xl">
                {step.title}
              </h2>
              <p className="mt-2 text-sm text-charcoal/70 sm:text-base">
                {step.body}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-12 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link
          to="/post-job"
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-sage px-5 text-base font-semibold text-white hover:bg-olive sm:text-sm"
        >
          Post a job
        </Link>
        <Link
          to="/providers"
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-sand px-5 text-base font-semibold text-olive hover:border-sage sm:text-sm"
        >
          Browse cleaners
        </Link>
      </div>
    </div>
  )
}
