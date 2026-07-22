-- Admin console: provider status + manual invoicing

ALTER TABLE providers ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE providers ADD COLUMN notes TEXT NOT NULL DEFAULT '';
ALTER TABLE providers ADD COLUMN plan TEXT NOT NULL DEFAULT 'free';

CREATE INDEX IF NOT EXISTS idx_providers_status ON providers(status);

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'AUD',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'paid', 'void')),
  description TEXT NOT NULL DEFAULT '',
  due_at TEXT,
  paid_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (provider_id) REFERENCES providers(id)
);

CREATE INDEX IF NOT EXISTS idx_invoices_provider ON invoices(provider_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

-- Demo invoice for Sparkle
INSERT OR IGNORE INTO invoices (
  id, provider_id, amount_cents, currency, status, description, due_at
) VALUES (
  'inv_demo_1',
  'prov_sparkle',
  4900,
  'AUD',
  'sent',
  'Monthly Pro listing — demo',
  date('now', '+14 day')
);
