-- Provider workspace: direct job invites, availability, bookings

ALTER TABLE jobs ADD COLUMN invited_provider_id TEXT REFERENCES providers(id);

CREATE INDEX IF NOT EXISTS idx_jobs_suburb ON jobs(suburb);
CREATE INDEX IF NOT EXISTS idx_jobs_invited_provider ON jobs(invited_provider_id);

CREATE TABLE IF NOT EXISTS provider_availability (
  id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL,
  date TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('available', 'unavailable')),
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (provider_id, date),
  FOREIGN KEY (provider_id) REFERENCES providers(id)
);

CREATE INDEX IF NOT EXISTS idx_availability_provider_date
  ON provider_availability(provider_id, date);

CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL,
  job_id TEXT,
  title TEXT NOT NULL,
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed'
    CHECK (status IN ('confirmed', 'cancelled')),
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (provider_id) REFERENCES providers(id),
  FOREIGN KEY (job_id) REFERENCES jobs(id)
);

CREATE INDEX IF NOT EXISTS idx_bookings_provider_starts
  ON bookings(provider_id, starts_at);

-- Demo: area job (Bondi) + direct invite to Sparkle
INSERT OR IGNORE INTO jobs (
  id, service_type, suburb, description, status,
  customer_name, customer_email, customer_phone, invited_provider_id
) VALUES
  (
    'job_demo_area',
    'Deep Clean',
    'Bondi',
    'Need a one-off deep clean of a 2-bed unit before moving day.',
    'open',
    'Jordan Mills',
    'jordan@example.com',
    '0411 222 333',
    NULL
  ),
  (
    'job_demo_direct',
    'End of Lease',
    'Bondi',
    'End-of-lease clean requested specifically from Sparkle & Co.',
    'open',
    'Riley Park',
    'riley@example.com',
    '0411 444 555',
    'prov_sparkle'
  );

INSERT OR IGNORE INTO provider_availability (id, provider_id, date, status, note) VALUES
  ('avail_demo_1', 'prov_sparkle', date('now', '+1 day'), 'available', ''),
  ('avail_demo_2', 'prov_sparkle', date('now', '+2 day'), 'unavailable', 'Personal day'),
  ('avail_demo_3', 'prov_sparkle', date('now', '+5 day'), 'available', '');

INSERT OR IGNORE INTO bookings (
  id, provider_id, job_id, title, starts_at, ends_at, status, notes
) VALUES
  (
    'book_demo_1',
    'prov_sparkle',
    NULL,
    'Weekly clean — Chen residence',
    datetime('now', '+3 day', 'start of day', '+9 hours'),
    datetime('now', '+3 day', 'start of day', '+12 hours'),
    'confirmed',
    'Bring eco products'
  );
