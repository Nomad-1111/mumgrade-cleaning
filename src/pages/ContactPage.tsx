export function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-16">
      <h1 className="font-display text-3xl font-semibold text-olive sm:text-4xl">
        Contact
      </h1>
      <p className="mt-4 text-sm text-charcoal/70 sm:text-base">
        Questions about Mum Grade Cleaning? Reach out and we will help you get
        started — whether you need a cleaner or want to list your business.
      </p>
      <div className="mt-8 space-y-3 text-sm text-charcoal/80 break-words">
        <p>
          <span className="font-medium text-charcoal">Email:</span>{' '}
          <a href="mailto:hello@mumgrade.example" className="hover:text-olive">
            hello@mumgrade.example
          </a>
        </p>
        <p>
          <span className="font-medium text-charcoal">Hours:</span> Mon–Fri,
          9am–5pm AEST
        </p>
      </div>
    </div>
  )
}
