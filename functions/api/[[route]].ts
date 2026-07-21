import { Hono } from 'hono'
import { handle } from 'hono/cloudflare-pages'

type Bindings = {
  DB: D1Database
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

const app = new Hono<{ Bindings: Bindings }>().basePath('/api')

function id(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`
}

app.get('/health', (c) => c.json({ ok: true, service: 'mumgrade-cleaning' }))

app.get('/providers', async (c) => {
  const suburb = c.req.query('suburb')
  let result
  if (suburb) {
    result = await c.env.DB.prepare(
      'SELECT * FROM providers WHERE lower(suburb) = lower(?) ORDER BY verified DESC, name ASC',
    )
      .bind(suburb)
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
      body.email.trim(),
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

  const jobId = id('job')
  await c.env.DB.prepare(
    `INSERT INTO jobs (
      id, service_type, suburb, description, status,
      customer_name, customer_email, customer_phone
    ) VALUES (?, ?, ?, ?, 'open', ?, ?, ?)`,
  )
    .bind(
      jobId,
      body.service_type.trim(),
      body.suburb.trim(),
      body.description?.trim() ?? '',
      body.customer_name.trim(),
      body.customer_email.trim(),
      body.customer_phone?.trim() ?? '',
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

  const body = await c.req.json<{
    provider_id?: string
    amount_cents?: number
    message?: string
  }>()

  if (!body.provider_id?.trim() || typeof body.amount_cents !== 'number') {
    return c.json({ error: 'provider_id and amount_cents are required' }, 400)
  }

  const provider = await c.env.DB.prepare('SELECT id FROM providers WHERE id = ?')
    .bind(body.provider_id)
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
      body.provider_id,
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

export const onRequest = handle(app)
