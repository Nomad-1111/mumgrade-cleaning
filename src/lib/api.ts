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

export const SERVICE_TYPES = [
  'House Cleaning',
  'End of Lease',
  'Deep Clean',
  'Office Cleaning',
  'Carpet Cleaning',
  'Window Cleaning',
] as const

export type ServiceType = (typeof SERVICE_TYPES)[number]

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(path, {
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
      ...init,
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
    body: { provider_id: string; amount_cents: number; message?: string },
  ) =>
    request<{ quote: Quote }>(`/api/jobs/${jobId}/quotes`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
}

export function formatMoney(cents: number) {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(cents / 100)
}
