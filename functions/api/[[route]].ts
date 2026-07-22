import { Hono, type Context } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { handle } from 'hono/cloudflare-pages'

type Bindings = {
  DB: D1Database
  TRAINING_VIDEOS: R2Bucket
  ADMIN_SECRET?: string
  DEV_AUTH?: string
  RESEND_API_KEY?: string
  MAGIC_LINK_FROM?: string
  APP_ORIGIN?: string
}

type Provider = {
  id: string
  name: string
  suburb: string
  bio: string
  email: string
  phone: string
  verified: number
  created_at: string
}

type Job = {
  id: string
  service_type: string
  suburb: string
  description: string
  status: string
  customer_name: string
  customer_email: string
  customer_phone: string
  created_at: string
  invited_provider_id?: string | null
  source?: 'area' | 'direct'
}

type AvailabilityDay = {
  id: string
  provider_id: string
  date: string
  status: 'available' | 'unavailable'
  note: string
  created_at: string
}

type Booking = {
  id: string
  provider_id: string
  job_id: string | null
  title: string
  starts_at: string
  ends_at: string
  status: string
  notes: string
  created_at: string
}

type Quote = {
  id: string
  job_id: string
  provider_id: string
  amount_cents: number
  message: string
  status: string
  created_at: string
  provider_name?: string
}

type TrainingVideo = {
  id: string
  title: string
  description: string
  r2_key: string
  content_type: string
  size_bytes: number
  published: number
  created_at: string
}

type Variables = {
  provider?: Provider
}

const SESSION_COOKIE = 'mg_provider_session'
const SESSION_DAYS = 30
const MAGIC_LINK_MINUTES = 30

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>().basePath(
  '/api',
)

function id(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`
}

function isDevAuth(env: Bindings) {
  return env.DEV_AUTH === '1' || env.DEV_AUTH === 'true'
}

function adminSecret(env: Bindings) {
  return env.ADMIN_SECRET || (isDevAuth(env) ? 'dev-admin-secret' : '')
}

async function sha256(value: string) {
  const data = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function requireAdmin(c: Context<{ Bindings: Bindings }>) {
  const secret = adminSecret(c.env)
  if (!secret) return false
  const header =
    c.req.header('x-admin-secret') ||
    c.req.header('authorization')?.replace(/^Bearer\s+/i, '')
  return Boolean(header && header === secret)
}

async function getSessionProvider(c: Context<{ Bindings: Bindings }>) {
  const token = getCookie(c, SESSION_COOKIE)
  if (!token) return null
  const tokenHash = await sha256(token)
  const row = await c.env.DB.prepare(
    `SELECT p.* FROM provider_sessions s
     JOIN providers p ON p.id = s.provider_id
     WHERE s.token_hash = ? AND s.expires_at > datetime('now')`,
  )
    .bind(tokenHash)
    .first<Provider>()
  return row
}

app.get('/health', (c) =>
  c.json({
    ok: true,
    service: 'mumgrade-cleaning',
    r2: Boolean(c.env.TRAINING_VIDEOS),
    devAuth: isDevAuth(c.env),
  }),
)

app.get('/providers', async (c) => {
  const suburb = c.req.query('suburb')
  let result
  if (suburb) {
    const term = suburb.trim()
    result = await c.env.DB.prepare(
      `SELECT * FROM providers
       WHERE lower(suburb) = lower(?)
          OR lower(suburb) LIKE lower(?) || ',%'
          OR lower(?) LIKE lower(suburb) || ',%'
       ORDER BY verified DESC, name ASC`,
    )
      .bind(term, term, term)
      .all<Provider>()
  } else {
    result = await c.env.DB.prepare(
      'SELECT * FROM providers ORDER BY verified DESC, name ASC',
    ).all<Provider>()
  }
  return c.json({ providers: result.results ?? [] })
})

app.get('/providers/:id', async (c) => {
  const provider = await c.env.DB.prepare('SELECT * FROM providers WHERE id = ?')
    .bind(c.req.param('id'))
    .first<Provider>()
  if (!provider) return c.json({ error: 'Provider not found' }, 404)
  return c.json({ provider })
})

app.patch('/providers/me', async (c) => {
  const sessionProvider = await getSessionProvider(c)
  if (!sessionProvider) return c.json({ error: 'Sign in required' }, 401)

  const body = await c.req.json<{
    name?: string
    suburb?: string
    bio?: string
    email?: string
    phone?: string
  }>()

  if (!body.name?.trim() || !body.suburb?.trim() || !body.email?.trim()) {
    return c.json({ error: 'name, suburb, and email are required' }, 400)
  }
  if ((body.bio?.trim() ?? '').length < 20) {
    return c.json({ error: 'bio must be at least 20 characters' }, 400)
  }

  const email = body.email.trim().toLowerCase()
  const emailOwner = await c.env.DB.prepare(
    'SELECT id FROM providers WHERE lower(email) = lower(?) AND id != ?',
  )
    .bind(email, sessionProvider.id)
    .first()
  if (emailOwner) {
    return c.json({ error: 'That email is already used by another provider' }, 409)
  }

  await c.env.DB.prepare(
    `UPDATE providers
     SET name = ?, suburb = ?, bio = ?, email = ?, phone = ?
     WHERE id = ?`,
  )
    .bind(
      body.name.trim(),
      body.suburb.trim(),
      body.bio.trim(),
      email,
      body.phone?.trim() ?? '',
      sessionProvider.id,
    )
    .run()

  const provider = await c.env.DB.prepare('SELECT * FROM providers WHERE id = ?')
    .bind(sessionProvider.id)
    .first<Provider>()

  return c.json({ provider })
})

app.post('/providers', async (c) => {
  const body = await c.req.json<{
    name?: string
    suburb?: string
    bio?: string
    email?: string
    phone?: string
  }>()

  if (!body.name?.trim() || !body.suburb?.trim() || !body.email?.trim()) {
    return c.json({ error: 'name, suburb, and email are required' }, 400)
  }
  if ((body.bio?.trim() ?? '').length < 20) {
    return c.json({ error: 'bio must be at least 20 characters' }, 400)
  }

  const providerId = id('prov')
  await c.env.DB.prepare(
    `INSERT INTO providers (id, name, suburb, bio, email, phone, verified)
     VALUES (?, ?, ?, ?, ?, ?, 0)`,
  )
    .bind(
      providerId,
      body.name.trim(),
      body.suburb.trim(),
      body.bio?.trim() ?? '',
      body.email.trim().toLowerCase(),
      body.phone?.trim() ?? '',
    )
    .run()

  const provider = await c.env.DB.prepare('SELECT * FROM providers WHERE id = ?')
    .bind(providerId)
    .first<Provider>()

  return c.json({ provider }, 201)
})

app.post('/jobs', async (c) => {
  const body = await c.req.json<{
    service_type?: string
    suburb?: string
    description?: string
    customer_name?: string
    customer_email?: string
    customer_phone?: string
    invited_provider_id?: string
  }>()

  if (
    !body.service_type?.trim() ||
    !body.suburb?.trim() ||
    !body.customer_name?.trim() ||
    !body.customer_email?.trim()
  ) {
    return c.json(
      {
        error:
          'service_type, suburb, customer_name, and customer_email are required',
      },
      400,
    )
  }

  let invitedProviderId: string | null = null
  if (body.invited_provider_id?.trim()) {
    const invited = await c.env.DB.prepare(
      'SELECT id FROM providers WHERE id = ?',
    )
      .bind(body.invited_provider_id.trim())
      .first()
    if (!invited) return c.json({ error: 'Invited provider not found' }, 404)
    invitedProviderId = body.invited_provider_id.trim()
  }

  const jobId = id('job')
  await c.env.DB.prepare(
    `INSERT INTO jobs (
      id, service_type, suburb, description, status,
      customer_name, customer_email, customer_phone, invited_provider_id
    ) VALUES (?, ?, ?, ?, 'open', ?, ?, ?, ?)`,
  )
    .bind(
      jobId,
      body.service_type.trim(),
      body.suburb.trim(),
      body.description?.trim() ?? '',
      body.customer_name.trim(),
      body.customer_email.trim(),
      body.customer_phone?.trim() ?? '',
      invitedProviderId,
    )
    .run()

  const job = await c.env.DB.prepare('SELECT * FROM jobs WHERE id = ?')
    .bind(jobId)
    .first<Job>()

  return c.json({ job }, 201)
})

app.get('/jobs/:id', async (c) => {
  const job = await c.env.DB.prepare('SELECT * FROM jobs WHERE id = ?')
    .bind(c.req.param('id'))
    .first<Job>()
  if (!job) return c.json({ error: 'Job not found' }, 404)
  return c.json({ job })
})

app.get('/jobs/:id/quotes', async (c) => {
  const job = await c.env.DB.prepare('SELECT id FROM jobs WHERE id = ?')
    .bind(c.req.param('id'))
    .first()
  if (!job) return c.json({ error: 'Job not found' }, 404)

  const result = await c.env.DB.prepare(
    `SELECT q.*, p.name AS provider_name
     FROM quotes q
     JOIN providers p ON p.id = q.provider_id
     WHERE q.job_id = ?
     ORDER BY q.amount_cents ASC, q.created_at ASC`,
  )
    .bind(c.req.param('id'))
    .all<Quote>()

  return c.json({ quotes: result.results ?? [] })
})

app.post('/jobs/:id/quotes', async (c) => {
  const jobId = c.req.param('id')
  const job = await c.env.DB.prepare('SELECT id FROM jobs WHERE id = ?')
    .bind(jobId)
    .first()
  if (!job) return c.json({ error: 'Job not found' }, 404)

  const sessionProvider = await getSessionProvider(c)
  const body = await c.req.json<{
    provider_id?: string
    amount_cents?: number
    message?: string
  }>()

  const providerId = sessionProvider?.id || body.provider_id?.trim()
  if (!providerId || typeof body.amount_cents !== 'number') {
    return c.json({ error: 'provider_id and amount_cents are required' }, 400)
  }

  const provider = await c.env.DB.prepare('SELECT id FROM providers WHERE id = ?')
    .bind(providerId)
    .first()
  if (!provider) return c.json({ error: 'Provider not found' }, 404)

  const quoteId = id('quote')
  await c.env.DB.prepare(
    `INSERT INTO quotes (id, job_id, provider_id, amount_cents, message, status)
     VALUES (?, ?, ?, ?, ?, 'pending')`,
  )
    .bind(
      quoteId,
      jobId,
      providerId,
      Math.round(body.amount_cents),
      body.message?.trim() ?? '',
    )
    .run()

  const quote = await c.env.DB.prepare(
    `SELECT q.*, p.name AS provider_name
     FROM quotes q
     JOIN providers p ON p.id = q.provider_id
     WHERE q.id = ?`,
  )
    .bind(quoteId)
    .first<Quote>()

  return c.json({ quote }, 201)
})

/* ---------------- Provider workspace ---------------- */

function suburbKey(suburb: string) {
  return suburb.split(',')[0]?.trim().toLowerCase() ?? suburb.trim().toLowerCase()
}

app.get('/provider/jobs', async (c) => {
  const provider = await getSessionProvider(c)
  if (!provider) return c.json({ error: 'Sign in required' }, 401)

  const key = suburbKey(provider.suburb)
  const result = await c.env.DB.prepare(
    `SELECT * FROM jobs
     WHERE status = 'open'
       AND (
         invited_provider_id = ?
         OR lower(suburb) = lower(?)
         OR lower(suburb) LIKE lower(?) || ',%'
         OR lower(?) LIKE lower(suburb) || ',%'
         OR lower(substr(suburb, 1, instr(suburb || ',', ',') - 1)) = ?
       )
     ORDER BY
       CASE WHEN invited_provider_id = ? THEN 0 ELSE 1 END,
       created_at DESC`,
  )
    .bind(
      provider.id,
      provider.suburb,
      key,
      provider.suburb,
      key,
      provider.id,
    )
    .all<Job>()

  const jobs = (result.results ?? []).map((job) => ({
    ...job,
    source:
      job.invited_provider_id === provider.id
        ? ('direct' as const)
        : ('area' as const),
  }))

  return c.json({
    jobs,
    area: jobs.filter((j) => j.source === 'area'),
    direct: jobs.filter((j) => j.source === 'direct'),
  })
})

app.get('/provider/availability', async (c) => {
  const provider = await getSessionProvider(c)
  if (!provider) return c.json({ error: 'Sign in required' }, 401)

  const from = c.req.query('from')
  const to = c.req.query('to')
  if (!from || !to) {
    return c.json({ error: 'from and to query params (YYYY-MM-DD) are required' }, 400)
  }

  const result = await c.env.DB.prepare(
    `SELECT * FROM provider_availability
     WHERE provider_id = ? AND date >= ? AND date <= ?
     ORDER BY date ASC`,
  )
    .bind(provider.id, from, to)
    .all<AvailabilityDay>()

  return c.json({ days: result.results ?? [] })
})

app.put('/provider/availability', async (c) => {
  const provider = await getSessionProvider(c)
  if (!provider) return c.json({ error: 'Sign in required' }, 401)

  const body = await c.req.json<{
    date?: string
    status?: 'available' | 'unavailable' | null
    note?: string
  }>()

  if (!body.date || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
    return c.json({ error: 'date (YYYY-MM-DD) is required' }, 400)
  }

  if (body.status === null) {
    await c.env.DB.prepare(
      'DELETE FROM provider_availability WHERE provider_id = ? AND date = ?',
    )
      .bind(provider.id, body.date)
      .run()
    return c.json({ ok: true, day: null })
  }

  if (body.status !== 'available' && body.status !== 'unavailable') {
    return c.json({ error: 'status must be available, unavailable, or null' }, 400)
  }

  const existing = await c.env.DB.prepare(
    'SELECT id FROM provider_availability WHERE provider_id = ? AND date = ?',
  )
    .bind(provider.id, body.date)
    .first<{ id: string }>()

  if (existing) {
    await c.env.DB.prepare(
      `UPDATE provider_availability
       SET status = ?, note = ?
       WHERE id = ?`,
    )
      .bind(body.status, body.note?.trim() ?? '', existing.id)
      .run()
  } else {
    await c.env.DB.prepare(
      `INSERT INTO provider_availability (id, provider_id, date, status, note)
       VALUES (?, ?, ?, ?, ?)`,
    )
      .bind(
        id('avail'),
        provider.id,
        body.date,
        body.status,
        body.note?.trim() ?? '',
      )
      .run()
  }

  const day = await c.env.DB.prepare(
    'SELECT * FROM provider_availability WHERE provider_id = ? AND date = ?',
  )
    .bind(provider.id, body.date)
    .first<AvailabilityDay>()

  return c.json({ ok: true, day })
})

app.get('/provider/bookings', async (c) => {
  const provider = await getSessionProvider(c)
  if (!provider) return c.json({ error: 'Sign in required' }, 401)

  const from = c.req.query('from')
  const to = c.req.query('to')
  if (!from || !to) {
    return c.json({ error: 'from and to query params are required' }, 400)
  }

  const result = await c.env.DB.prepare(
    `SELECT * FROM bookings
     WHERE provider_id = ?
       AND status != 'cancelled'
       AND date(starts_at) <= date(?)
       AND date(ends_at) >= date(?)
     ORDER BY starts_at ASC`,
  )
    .bind(provider.id, to, from)
    .all<Booking>()

  return c.json({ bookings: result.results ?? [] })
})

app.post('/provider/bookings', async (c) => {
  const provider = await getSessionProvider(c)
  if (!provider) return c.json({ error: 'Sign in required' }, 401)

  const body = await c.req.json<{
    title?: string
    starts_at?: string
    ends_at?: string
    notes?: string
    job_id?: string
  }>()

  if (!body.title?.trim() || !body.starts_at?.trim() || !body.ends_at?.trim()) {
    return c.json({ error: 'title, starts_at, and ends_at are required' }, 400)
  }

  if (body.ends_at <= body.starts_at) {
    return c.json({ error: 'ends_at must be after starts_at' }, 400)
  }

  if (body.job_id) {
    const job = await c.env.DB.prepare('SELECT id FROM jobs WHERE id = ?')
      .bind(body.job_id)
      .first()
    if (!job) return c.json({ error: 'Job not found' }, 404)
  }

  const bookingId = id('book')
  await c.env.DB.prepare(
    `INSERT INTO bookings (
      id, provider_id, job_id, title, starts_at, ends_at, status, notes
    ) VALUES (?, ?, ?, ?, ?, ?, 'confirmed', ?)`,
  )
    .bind(
      bookingId,
      provider.id,
      body.job_id ?? null,
      body.title.trim(),
      body.starts_at.trim(),
      body.ends_at.trim(),
      body.notes?.trim() ?? '',
    )
    .run()

  const booking = await c.env.DB.prepare('SELECT * FROM bookings WHERE id = ?')
    .bind(bookingId)
    .first<Booking>()

  return c.json({ booking }, 201)
})

app.patch('/provider/bookings/:id', async (c) => {
  const provider = await getSessionProvider(c)
  if (!provider) return c.json({ error: 'Sign in required' }, 401)

  const booking = await c.env.DB.prepare(
    'SELECT * FROM bookings WHERE id = ? AND provider_id = ?',
  )
    .bind(c.req.param('id'), provider.id)
    .first<Booking>()
  if (!booking) return c.json({ error: 'Booking not found' }, 404)

  const body = await c.req.json<{
    title?: string
    starts_at?: string
    ends_at?: string
    notes?: string
    status?: 'confirmed' | 'cancelled'
  }>()

  const title = body.title?.trim() ?? booking.title
  const startsAt = body.starts_at?.trim() ?? booking.starts_at
  const endsAt = body.ends_at?.trim() ?? booking.ends_at
  const notes = body.notes !== undefined ? body.notes.trim() : booking.notes
  const status = body.status ?? booking.status

  if (endsAt <= startsAt) {
    return c.json({ error: 'ends_at must be after starts_at' }, 400)
  }
  if (status !== 'confirmed' && status !== 'cancelled') {
    return c.json({ error: 'invalid status' }, 400)
  }

  await c.env.DB.prepare(
    `UPDATE bookings
     SET title = ?, starts_at = ?, ends_at = ?, notes = ?, status = ?
     WHERE id = ?`,
  )
    .bind(title, startsAt, endsAt, notes, status, booking.id)
    .run()

  const updated = await c.env.DB.prepare('SELECT * FROM bookings WHERE id = ?')
    .bind(booking.id)
    .first<Booking>()

  return c.json({ booking: updated })
})

/* ---------------- Auth (magic link) ---------------- */

app.post('/auth/magic-link', async (c) => {
  const body = await c.req.json<{ email?: string }>()
  const email = body.email?.trim().toLowerCase()
  if (!email) return c.json({ error: 'email is required' }, 400)

  const provider = await c.env.DB.prepare(
    'SELECT * FROM providers WHERE lower(email) = lower(?)',
  )
    .bind(email)
    .first<Provider>()

  // Always return ok to avoid email enumeration, except in DEV_AUTH where we are helpful
  if (!provider) {
    if (isDevAuth(c.env)) {
      return c.json({
        ok: false,
        error: 'No provider account uses that email. Join as a provider first.',
      }, 404)
    }
    return c.json({ ok: true, message: 'If that email is registered, a login link is on its way.' })
  }

  const token = randomToken()
  const tokenHash = await sha256(token)
  const linkId = id('ml')
  await c.env.DB.prepare(
    `INSERT INTO magic_links (id, email, token_hash, expires_at)
     VALUES (?, ?, ?, datetime('now', ?))`,
  )
    .bind(linkId, email, tokenHash, `+${MAGIC_LINK_MINUTES} minutes`)
    .run()

  const origin =
    c.env.APP_ORIGIN ||
    c.req.header('origin') ||
    new URL(c.req.url).origin.replace(':8788', ':5173')
  const verifyUrl = `${origin}/auth/verify?token=${token}`

  if (c.env.RESEND_API_KEY) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${c.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: c.env.MAGIC_LINK_FROM || 'Mum Grade <onboarding@resend.dev>',
        to: [email],
        subject: 'Your Mum Grade provider login link',
        html: `<p>Hi ${provider.name},</p><p><a href="${verifyUrl}">Sign in to access training</a></p><p>This link expires in ${MAGIC_LINK_MINUTES} minutes.</p>`,
      }),
    })
  }

  return c.json({
    ok: true,
    message: c.env.RESEND_API_KEY
      ? 'Check your email for a login link.'
      : 'Magic link created (email not configured).',
    ...(isDevAuth(c.env) || !c.env.RESEND_API_KEY
      ? { devMagicLink: verifyUrl }
      : {}),
  })
})

app.post('/auth/verify', async (c) => {
  const body = await c.req.json<{ token?: string }>()
  const token = body.token?.trim()
  if (!token) return c.json({ error: 'token is required' }, 400)

  const tokenHash = await sha256(token)
  const link = await c.env.DB.prepare(
    `SELECT * FROM magic_links
     WHERE token_hash = ? AND used_at IS NULL AND expires_at > datetime('now')`,
  )
    .bind(tokenHash)
    .first<{ id: string; email: string }>()

  if (!link) return c.json({ error: 'Invalid or expired login link' }, 400)

  const provider = await c.env.DB.prepare(
    'SELECT * FROM providers WHERE lower(email) = lower(?)',
  )
    .bind(link.email)
    .first<Provider>()
  if (!provider) return c.json({ error: 'Provider not found' }, 404)

  await c.env.DB.prepare(
    `UPDATE magic_links SET used_at = datetime('now') WHERE id = ?`,
  )
    .bind(link.id)
    .run()

  const sessionToken = randomToken()
  const sessionHash = await sha256(sessionToken)
  const sessionId = id('sess')
  await c.env.DB.prepare(
    `INSERT INTO provider_sessions (id, provider_id, token_hash, expires_at)
     VALUES (?, ?, ?, datetime('now', ?))`,
  )
    .bind(sessionId, provider.id, sessionHash, `+${SESSION_DAYS} days`)
    .run()

  setCookie(c, SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    path: '/',
    sameSite: 'Lax',
    secure: new URL(c.req.url).protocol === 'https:',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  })

  return c.json({ ok: true, provider })
})

app.get('/auth/me', async (c) => {
  const provider = await getSessionProvider(c)
  if (!provider) return c.json({ provider: null })
  return c.json({ provider })
})

app.post('/auth/logout', async (c) => {
  const token = getCookie(c, SESSION_COOKIE)
  if (token) {
    const tokenHash = await sha256(token)
    await c.env.DB.prepare(
      'DELETE FROM provider_sessions WHERE token_hash = ?',
    )
      .bind(tokenHash)
      .run()
  }
  deleteCookie(c, SESSION_COOKIE, { path: '/' })
  return c.json({ ok: true })
})

/* ---------------- Training (providers) ---------------- */

app.get('/training', async (c) => {
  const provider = await getSessionProvider(c)
  if (!provider) return c.json({ error: 'Sign in required' }, 401)

  const result = await c.env.DB.prepare(
    `SELECT id, title, description, content_type, size_bytes, created_at
     FROM training_videos
     WHERE published = 1
     ORDER BY created_at DESC`,
  ).all<Omit<TrainingVideo, 'r2_key' | 'published'>>()

  return c.json({ videos: result.results ?? [], provider })
})

app.get('/training/:id/media', async (c) => {
  const provider = await getSessionProvider(c)
  if (!provider) return c.json({ error: 'Sign in required' }, 401)
  if (!c.env.TRAINING_VIDEOS) {
    return c.json({ error: 'Video storage is not configured' }, 503)
  }

  const video = await c.env.DB.prepare(
    `SELECT * FROM training_videos WHERE id = ? AND published = 1`,
  )
    .bind(c.req.param('id'))
    .first<TrainingVideo>()
  if (!video) return c.json({ error: 'Video not found' }, 404)

  const object = await c.env.TRAINING_VIDEOS.get(video.r2_key)
  if (!object) return c.json({ error: 'Video file missing' }, 404)

  const headers = new Headers()
  headers.set('Content-Type', video.content_type || 'video/mp4')
  headers.set('Cache-Control', 'private, max-age=60')
  if (object.size != null) headers.set('Content-Length', String(object.size))
  object.writeHttpMetadata(headers)

  return new Response(object.body, { headers })
})

/* ---------------- Admin training ---------------- */

app.get('/admin/training', async (c) => {
  if (!requireAdmin(c)) return c.json({ error: 'Unauthorized' }, 401)
  const result = await c.env.DB.prepare(
    `SELECT * FROM training_videos ORDER BY created_at DESC`,
  ).all<TrainingVideo>()
  return c.json({ videos: result.results ?? [] })
})

app.post('/admin/training', async (c) => {
  if (!requireAdmin(c)) return c.json({ error: 'Unauthorized' }, 401)
  if (!c.env.TRAINING_VIDEOS) {
    return c.json({ error: 'R2 bucket TRAINING_VIDEOS is not bound' }, 503)
  }

  const form = await c.req.formData()
  const title = String(form.get('title') || '').trim()
  const description = String(form.get('description') || '').trim()
  const published = String(form.get('published') || '1') === '1'
  const file = form.get('file')

  if (!title) return c.json({ error: 'title is required' }, 400)
  if (!(file instanceof File) || file.size === 0) {
    return c.json({ error: 'video file is required' }, 400)
  }

  const videoId = id('vid')
  const safeName = file.name.replace(/[^\w.\-]+/g, '_') || 'video.mp4'
  const r2Key = `training/${videoId}/${safeName}`
  const contentType = file.type || 'video/mp4'

  await c.env.TRAINING_VIDEOS.put(r2Key, file.stream(), {
    httpMetadata: { contentType },
    customMetadata: { title, videoId },
  })

  await c.env.DB.prepare(
    `INSERT INTO training_videos
      (id, title, description, r2_key, content_type, size_bytes, published)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      videoId,
      title,
      description,
      r2Key,
      contentType,
      file.size,
      published ? 1 : 0,
    )
    .run()

  const video = await c.env.DB.prepare(
    'SELECT * FROM training_videos WHERE id = ?',
  )
    .bind(videoId)
    .first<TrainingVideo>()

  return c.json({ video }, 201)
})

app.patch('/admin/training/:id', async (c) => {
  if (!requireAdmin(c)) return c.json({ error: 'Unauthorized' }, 401)
  const body = await c.req.json<{
    title?: string
    description?: string
    published?: boolean
  }>()

  const existing = await c.env.DB.prepare(
    'SELECT * FROM training_videos WHERE id = ?',
  )
    .bind(c.req.param('id'))
    .first<TrainingVideo>()
  if (!existing) return c.json({ error: 'Video not found' }, 404)

  await c.env.DB.prepare(
    `UPDATE training_videos
     SET title = ?, description = ?, published = ?
     WHERE id = ?`,
  )
    .bind(
      body.title?.trim() || existing.title,
      body.description?.trim() ?? existing.description,
      body.published === undefined
        ? existing.published
        : body.published
          ? 1
          : 0,
      existing.id,
    )
    .run()

  const video = await c.env.DB.prepare(
    'SELECT * FROM training_videos WHERE id = ?',
  )
    .bind(existing.id)
    .first<TrainingVideo>()

  return c.json({ video })
})

app.delete('/admin/training/:id', async (c) => {
  if (!requireAdmin(c)) return c.json({ error: 'Unauthorized' }, 401)
  const existing = await c.env.DB.prepare(
    'SELECT * FROM training_videos WHERE id = ?',
  )
    .bind(c.req.param('id'))
    .first<TrainingVideo>()
  if (!existing) return c.json({ error: 'Video not found' }, 404)

  if (c.env.TRAINING_VIDEOS) {
    await c.env.TRAINING_VIDEOS.delete(existing.r2_key)
  }
  await c.env.DB.prepare('DELETE FROM training_videos WHERE id = ?')
    .bind(existing.id)
    .run()

  return c.json({ ok: true })
})

export const onRequest = handle(app)
