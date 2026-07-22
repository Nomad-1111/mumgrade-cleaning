import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'

export function AuthVerifyPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { refresh } = useAuth()
  const [error, setError] = useState('')
  const [status, setStatus] = useState('Signing you in…')

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setError('Missing login token.')
      setStatus('')
      return
    }

    let cancelled = false
    async function verify() {
      try {
        await api.verifyMagicLink(token!)
        await refresh()
        if (!cancelled) navigate('/provider/jobs', { replace: true })
      } catch (err) {
        if (!cancelled) {
          setStatus('')
          setError(err instanceof Error ? err.message : 'Login failed')
        }
      }
    }
    void verify()
    return () => {
      cancelled = true
    }
  }, [searchParams, navigate, refresh])

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
      {status && <p className="text-charcoal/70">{status}</p>}
      {error && (
        <>
          <p className="text-olive">{error}</p>
          <Link
            to="/login"
            className="mt-4 inline-block font-medium text-sage hover:text-olive"
          >
            Request a new login link
          </Link>
        </>
      )}
    </div>
  )
}
