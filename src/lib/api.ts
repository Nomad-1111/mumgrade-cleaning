export type Provider = {
  id: string
  name: string
  suburb: string
  bio: string
  email: string
  phone: string
  verified: number
  created_at: string
}

export type Job = {
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

export type AvailabilityDay = {
  id: string
  provider_id: string
  date: string
  status: 'available' | 'unavailable'
  note: string
  created_at: string
}

export type Booking = {
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

export type Quote = {
  id: string
  job_id: string
  provider_id: string
  amount_cents: number
  message: string
  status: string
  created_at: string
  provider_name?: string
}

export type TrainingVideo = {
  id: string
  title: string
  description: string
  content_type: string
  size_bytes: number
  created_at: string
  published?: number
  r2_key?: string
}

export const SERVICE_TYPES = [
  'House Cleaning',
  'End of Lease',
  'Deep Clean',
  'Office Cleaning',
  'Carpet Cleaning',
  'Window Cleaning',
] as const

export type ServiceType = (typeof SERVICE_TYPES)[number]

const ADMIN_SECRET_KEY = 'mg_admin_secret'

export function getStoredAdminSecret() {
  return sessionStorage.getItem(ADMIN_SECRET_KEY) || ''
}

export function setStoredAdminSecret(secret: string) {
  sessionStorage.setItem(ADMIN_SECRET_KEY, secret)
}

async function request<T>(
  path: string,
  init?: RequestInit & { admin?: boolean },
): Promise<T> {
  const { admin, ...fetchInit } = init ?? {}
  const headers: Record<string, string> = {
    ...(fetchInit.headers as Record<string, string> | undefined),
  }

  if (!(fetchInit.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json'
  }

  if (admin) {
    const secret = getStoredAdminSecret()
    if (secret) headers['X-Admin-Secret'] = secret
  }

  let response: Response
  try {
    response = await fetch(path, {
      credentials: 'include',
      ...fetchInit,
      headers,
    })
  } catch {
    throw new Error('Failed to fetch')
  }

  const data = (await response.json().catch(() => ({}))) as T & {
    error?: string
  }

  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`)
  }

  return data
}

export const api = {
  listProviders: (suburb?: string) => {
    const query = suburb ? `?suburb=${encodeURIComponent(suburb)}` : ''
    return request<{ providers: Provider[] }>(`/api/providers${query}`)
  },
  getProvider: (id: string) =>
    request<{ provider: Provider }>(`/api/providers/${id}`),
  updateMyProvider: (body: {
    name: string
    suburb: string
    bio: string
    email: string
    phone?: string
  }) =>
    request<{ provider: Provider }>('/api/providers/me', {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  createProvider: (body: {
    name: string
    suburb: string
    bio?: string
    email: string
    phone?: string
  }) =>
    request<{ provider: Provider }>('/api/providers', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  createJob: (body: {
    service_type: string
    suburb: string
    description?: string
    customer_name: string
    customer_email: string
    customer_phone?: string
    invited_provider_id?: string
  }) =>
    request<{ job: Job }>('/api/jobs', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  getJob: (id: string) => request<{ job: Job }>(`/api/jobs/${id}`),
  listQuotes: (jobId: string) =>
    request<{ quotes: Quote[] }>(`/api/jobs/${jobId}/quotes`),
  createQuote: (
    jobId: string,
    body: { provider_id?: string; amount_cents: number; message?: string },
  ) =>
    request<{ quote: Quote }>(`/api/jobs/${jobId}/quotes`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  listProviderJobs: () =>
    request<{
      jobs: Job[]
      area: Job[]
      direct: Job[]
    }>('/api/provider/jobs'),
  listAvailability: (from: string, to: string) =>
    request<{ days: AvailabilityDay[] }>(
      `/api/provider/availability?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    ),
  setAvailability: (body: {
    date: string
    status: 'available' | 'unavailable' | null
    note?: string
  }) =>
    request<{ ok: boolean; day: AvailabilityDay | null }>(
      '/api/provider/availability',
      { method: 'PUT', body: JSON.stringify(body) },
    ),
  listBookings: (from: string, to: string) =>
    request<{ bookings: Booking[] }>(
      `/api/provider/bookings?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    ),
  createBooking: (body: {
    title: string
    starts_at: string
    ends_at: string
    notes?: string
    job_id?: string
  }) =>
    request<{ booking: Booking }>('/api/provider/bookings', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updateBooking: (
    id: string,
    body: {
      title?: string
      starts_at?: string
      ends_at?: string
      notes?: string
      status?: 'confirmed' | 'cancelled'
    },
  ) =>
    request<{ booking: Booking }>(`/api/provider/bookings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  requestMagicLink: (email: string) =>
    request<{ ok: boolean; message?: string; devMagicLink?: string; error?: string }>(
      '/api/auth/magic-link',
      { method: 'POST', body: JSON.stringify({ email }) },
    ),
  verifyMagicLink: (token: string) =>
    request<{ ok: boolean; provider: Provider }>('/api/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),
  me: () => request<{ provider: Provider | null }>('/api/auth/me'),
  logout: () =>
    request<{ ok: boolean }>('/api/auth/logout', { method: 'POST', body: '{}' }),

  listTraining: () =>
    request<{ videos: TrainingVideo[]; provider: Provider }>('/api/training'),
  trainingMediaUrl: (id: string) => `/api/training/${id}/media`,

  adminListTraining: () =>
    request<{ videos: TrainingVideo[] }>('/api/admin/training', { admin: true }),
  adminUploadTraining: (form: FormData) =>
    request<{ video: TrainingVideo }>('/api/admin/training', {
      method: 'POST',
      body: form,
      admin: true,
    }),
  adminUpdateTraining: (
    id: string,
    body: { title?: string; description?: string; published?: boolean },
  ) =>
    request<{ video: TrainingVideo }>(`/api/admin/training/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
      admin: true,
    }),
  adminDeleteTraining: (id: string) =>
    request<{ ok: boolean }>(`/api/admin/training/${id}`, {
      method: 'DELETE',
      admin: true,
    }),
}

export function formatMoney(cents: number) {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(cents / 100)
}
