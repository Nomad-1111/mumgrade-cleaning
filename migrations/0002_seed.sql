-- Demo seed data for local development

INSERT OR IGNORE INTO providers (id, name, suburb, bio, email, phone, verified) VALUES
  (
    'prov_sparkle',
    'Sparkle & Co Cleaning',
    'Bondi',
    'Detail-focused residential cleaning with eco-friendly products. Mum-run team trusted across the Eastern Suburbs.',
    'hello@sparkleco.example',
    '0400 111 001',
    1
  ),
  (
    'prov_freshnest',
    'Fresh Nest Cleaners',
    'Newtown',
    'Reliable weekly and fortnightly cleans for apartments and family homes. Fully insured.',
    'book@freshnest.example',
    '0400 222 002',
    1
  ),
  (
    'prov_olivegrove',
    'Olive Grove Home Care',
    'Manly',
    'End-of-lease and deep cleans with careful attention to the small details that make a home feel fresh.',
    'team@olivegrove.example',
    '0400 333 003',
    0
  );

INSERT OR IGNORE INTO jobs (id, service_type, suburb, description, status, customer_name, customer_email, customer_phone) VALUES
  (
    'job_demo_1',
    'House Cleaning',
    'Bondi',
    'Looking for a fortnightly clean of a 3-bedroom apartment. Prefer eco products.',
    'open',
    'Alex Chen',
    'alex@example.com',
    '0411 000 111'
  );

INSERT OR IGNORE INTO quotes (id, job_id, provider_id, amount_cents, message, status) VALUES
  (
    'quote_demo_1',
    'job_demo_1',
    'prov_sparkle',
    18000,
    'Happy to take this on fortnightly. Includes bathrooms, kitchen, and living areas.',
    'pending'
  ),
  (
    'quote_demo_2',
    'job_demo_1',
    'prov_freshnest',
    16500,
    'We have availability starting next week. Quote includes products.',
    'pending'
  );
