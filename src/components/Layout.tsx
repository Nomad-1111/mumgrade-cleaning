import { useEffect, useId, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'text-sm font-medium transition-colors duration-200',
    isActive ? 'text-olive' : 'text-charcoal/75 hover:text-olive',
  ].join(' ')

const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'block rounded-md px-3 py-3 text-base font-medium transition-colors',
    isActive
      ? 'bg-sand/60 text-olive'
      : 'text-charcoal/80 hover:bg-sand/40 hover:text-olive',
  ].join(' ')

export function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const menuId = useId()
  const { provider, logout } = useAuth()

  const mobileLinks = provider
    ? [
        { to: '/provider/jobs', label: 'Jobs' },
        { to: '/provider/calendar', label: 'Calendar' },
        { to: '/training', label: 'Training' },
        { to: '/account', label: 'My profile' },
        { to: '/contact', label: 'Contact' },
      ]
    : [
        { to: '/providers', label: 'Find cleaners' },
        { to: '/how-it-works', label: 'How it works' },
        { to: '/post-job', label: 'Post a job' },
        { to: '/join', label: 'Join as provider' },
        { to: '/login', label: 'Provider login' },
        { to: '/contact', label: 'Contact' },
      ]

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!menuOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [menuOpen])

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-sand/80 bg-cream/90 pt-[env(safe-area-inset-top)] backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4">
          <Link
            to={provider ? '/provider/jobs' : '/'}
            className="group flex min-w-0 items-center gap-1.5 sm:gap-2"
          >
            <img
              src="/brand/logo.png"
              alt="Mum Grade Cleaning"
              className="h-10 w-10 shrink-0 object-contain sm:h-11 sm:w-11"
            />
            <span className="min-w-0">
              <span className="block font-display text-xl font-semibold leading-tight tracking-tight text-olive transition-colors group-hover:text-sage sm:text-2xl">
                Mum Grade
              </span>
              <span className="hidden text-[0.65rem] font-medium uppercase tracking-[0.18em] text-charcoal/50 sm:block">
                Cleaning
              </span>
            </span>
          </Link>

          <nav
            className="hidden items-center gap-5 md:flex lg:gap-6"
            aria-label="Primary"
          >
            {provider ? (
              <>
                <NavLink to="/provider/jobs" className={navLinkClass}>
                  Jobs
                </NavLink>
                <NavLink to="/provider/calendar" className={navLinkClass}>
                  Calendar
                </NavLink>
                <NavLink to="/training" className={navLinkClass}>
                  Training
                </NavLink>
                <NavLink to="/account" className={navLinkClass}>
                  My profile
                </NavLink>
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="text-sm font-medium text-charcoal/75 transition-colors hover:text-olive"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <NavLink to="/providers" className={navLinkClass}>
                  Find cleaners
                </NavLink>
                <NavLink to="/how-it-works" className={navLinkClass}>
                  How it works
                </NavLink>
                <NavLink
                  to="/post-job"
                  className="rounded-md bg-sage px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-olive"
                >
                  Post a job
                </NavLink>
                <NavLink to="/login" className={navLinkClass}>
                  Provider login
                </NavLink>
              </>
            )}
          </nav>

          <div className="flex items-center gap-2 md:hidden">
            {!provider && (
              <Link
                to="/post-job"
                className="rounded-md bg-sage px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-olive"
              >
                Post a job
              </Link>
            )}
            {provider && (
              <Link
                to="/provider/jobs"
                className="rounded-md bg-sage px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-olive"
              >
                Jobs
              </Link>
            )}
            <button
              type="button"
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-sand text-olive transition-colors hover:border-sage hover:bg-sand/40"
              aria-expanded={menuOpen}
              aria-controls={menuId}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span className="sr-only">{menuOpen ? 'Close' : 'Menu'}</span>
              <span className="relative block h-4 w-5" aria-hidden="true">
                <span
                  className={[
                    'absolute left-0 block h-0.5 w-5 bg-current transition-transform duration-200',
                    menuOpen ? 'top-1.5 rotate-45' : 'top-0',
                  ].join(' ')}
                />
                <span
                  className={[
                    'absolute left-0 top-1.5 block h-0.5 w-5 bg-current transition-opacity duration-200',
                    menuOpen ? 'opacity-0' : 'opacity-100',
                  ].join(' ')}
                />
                <span
                  className={[
                    'absolute left-0 block h-0.5 w-5 bg-current transition-transform duration-200',
                    menuOpen ? 'top-1.5 -rotate-45' : 'top-3',
                  ].join(' ')}
                />
              </span>
            </button>
          </div>
        </div>

        <div
          id={menuId}
          className={[
            'border-t border-sand bg-cream md:hidden',
            menuOpen ? 'block' : 'hidden',
          ].join(' ')}
        >
          <nav
            className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3 sm:px-6"
            aria-label="Mobile"
          >
            {mobileLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={mobileLinkClass}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}
            {provider && (
              <button
                type="button"
                className="rounded-md px-3 py-3 text-left text-base font-medium text-charcoal/80 hover:bg-sand/40 hover:text-olive"
                onClick={() => {
                  setMenuOpen(false)
                  void logout()
                }}
              >
                Sign out
              </button>
            )}
          </nav>
        </div>
      </header>

      {menuOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-charcoal/30 md:hidden"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <main className="relative z-0 flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-sand bg-sand/40 pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3 sm:px-6">
          <div>
            <Link
              to={provider ? '/provider/jobs' : '/'}
              className="inline-flex items-center gap-1.5 sm:gap-2"
            >
              <img
                src="/brand/logo.png"
                alt=""
                className="h-12 w-12 object-contain"
              />
              <span className="font-display text-2xl font-semibold text-olive">
                Mum Grade
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-charcoal/70">
              {provider
                ? 'Manage jobs, availability, and training from your provider workspace.'
                : 'Connect with trusted local cleaners. Compare quotes. Choose with confidence.'}
            </p>
          </div>
          <div className="text-sm">
            <p className="font-semibold text-charcoal">
              {provider ? 'Workspace' : 'Explore'}
            </p>
            <ul className="mt-3 space-y-2 text-charcoal/70">
              {provider ? (
                <>
                  <li>
                    <Link to="/provider/jobs" className="hover:text-olive">
                      Jobs
                    </Link>
                  </li>
                  <li>
                    <Link to="/provider/calendar" className="hover:text-olive">
                      Calendar
                    </Link>
                  </li>
                  <li>
                    <Link to="/training" className="hover:text-olive">
                      Training
                    </Link>
                  </li>
                  <li>
                    <Link to="/account" className="hover:text-olive">
                      My profile
                    </Link>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link to="/providers" className="hover:text-olive">
                      Find cleaners
                    </Link>
                  </li>
                  <li>
                    <Link to="/post-job" className="hover:text-olive">
                      Post a job
                    </Link>
                  </li>
                  <li>
                    <Link to="/how-it-works" className="hover:text-olive">
                      How it works
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
          <div className="text-sm">
            <p className="font-semibold text-charcoal">
              {provider ? 'Help' : 'Providers'}
            </p>
            <ul className="mt-3 space-y-2 text-charcoal/70">
              {!provider && (
                <>
                  <li>
                    <Link to="/join" className="hover:text-olive">
                      List your business
                    </Link>
                  </li>
                  <li>
                    <Link to="/login" className="hover:text-olive">
                      Provider login
                    </Link>
                  </li>
                </>
              )}
              <li>
                <Link to="/contact" className="hover:text-olive">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-sand/80 py-4 text-center text-xs text-charcoal/50">
          © {new Date().getFullYear()} Mum Grade Cleaning
        </div>
      </footer>
    </div>
  )
}
