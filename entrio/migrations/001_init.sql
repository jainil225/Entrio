-- Entrio Ticketing App - Initial Schema
-- PostgreSQL

BEGIN;

-- Admin users
CREATE TABLE IF NOT EXISTS admins (
  id         SERIAL PRIMARY KEY,
  email      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Events
CREATE TABLE IF NOT EXISTS events (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  venue       TEXT NOT NULL,
  event_date  TIMESTAMPTZ NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_by  INTEGER REFERENCES admins(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ticket types per event
CREATE TABLE IF NOT EXISTS ticket_types (
  id          SERIAL PRIMARY KEY,
  event_id    INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  price       NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  total_qty   INTEGER NOT NULL CHECK (total_qty > 0),
  -- sold_qty is derived, but we keep a counter for fast reads
  -- It is only ever incremented inside a transaction that holds a row lock
  sold_qty    INTEGER NOT NULL DEFAULT 0 CHECK (sold_qty >= 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bookings
-- States:
--   pending   - payment initiated, inventory reserved (held via DB lock during txn)
--   confirmed - payment succeeded
--   failed    - payment failed; inventory NOT deducted (sold_qty not incremented on failure)
CREATE TABLE IF NOT EXISTS bookings (
  id              SERIAL PRIMARY KEY,
  reference       TEXT NOT NULL UNIQUE,   -- e.g. ENT-XXXXXXXX
  ticket_type_id  INTEGER NOT NULL REFERENCES ticket_types(id),
  event_id        INTEGER NOT NULL REFERENCES events(id),
  buyer_name      TEXT NOT NULL,
  buyer_email     TEXT NOT NULL,
  buyer_phone     TEXT NOT NULL,
  quantity        INTEGER NOT NULL CHECK (quantity > 0),
  unit_price      NUMERIC(10,2) NOT NULL,
  total_amount    NUMERIC(10,2) NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','confirmed','failed')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_bookings_event ON bookings(event_id);
CREATE INDEX IF NOT EXISTS idx_bookings_ticket_type ON bookings(ticket_type_id);
CREATE INDEX IF NOT EXISTS idx_ticket_types_event ON ticket_types(event_id);

COMMIT;
