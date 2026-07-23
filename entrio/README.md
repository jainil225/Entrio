# Entrio — Mini Ticketing App

A stripped-down event ticketing system with an admin dashboard and public storefront. Built with Node.js/Express/TypeScript and PostgreSQL.

---

## Quick Start

### Prerequisites
- Node.js 18+
- A PostgreSQL database (see options below)

### 1. Clone and install

```bash
git clone <your-repo-url>
cd entrio
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/entrio
JWT_SECRET=your-secret-here
NODE_ENV=development
PORT=3000
```

**Throwaway Neon connection string for reviewers** (read-only seed data, safe to use):
```
DATABASE_URL=postgresql://entrio_owner:<ask-tarang>@ep-wild-sound-xxxx.ap-southeast-1.aws.neon.tech/entrio?sslmode=require
```
*(Replace with your actual Neon URL before submitting)*

### 3. Seed the database

This creates the schema and inserts sample events + admin user:

```bash
npm run seed
```

### 4. Start the server

```bash
npm run dev       # development with hot-reload
# or
npm run build && npm start   # production
```

Visit:
- **Storefront**: http://localhost:3000
- **Admin**: http://localhost:3000/admin/login.html

### Admin credentials (from seed)

| Email | Password |
|-------|----------|
| admin@entrio.com | admin123 |

---

## Database Options

**Option A — Neon (recommended, ~2 min, nothing to install)**
1. Sign up at [neon.tech](https://neon.tech)
2. Create a project → copy the connection string
3. Paste it as `DATABASE_URL` in `.env`

**Option B — Docker**
```bash
docker run --name entrio-pg \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=entrio \
  -p 5432:5432 -d postgres:16
```

**Option C — Local Postgres** — just set `DATABASE_URL` to your existing instance.

---

## How I Prevented Overselling

### The problem
Two HTTP requests arrive simultaneously for the last ticket. Both read `remaining = 1`, both pass the availability check, both insert a booking — result: -1 remaining, oversold.

### The solution: `SELECT ... FOR UPDATE` inside a serialised transaction

```sql
BEGIN;

SELECT tt.id, tt.total_qty, tt.sold_qty,
       (tt.total_qty - tt.sold_qty) AS remaining
FROM ticket_types tt
JOIN events e ON e.id = tt.event_id
WHERE tt.id = $1 AND e.is_published = true
FOR UPDATE;   -- ← row-level exclusive lock

-- Now check remaining >= requested_qty
-- If yes: INSERT booking + UPDATE sold_qty = sold_qty + qty
-- If no:  ROLLBACK with 409

COMMIT;   -- lock released here
```

**Why this works:** PostgreSQL's `FOR UPDATE` acquires a row-level exclusive lock on the `ticket_types` row. The second concurrent transaction blocks at the `SELECT ... FOR UPDATE` line until the first transaction commits. By that point, `sold_qty` has already been incremented. The second transaction reads the updated count, finds `remaining = 0`, and returns a clean "sold out" error — never touching inventory.

**Why not alternatives?**
- *Optimistic concurrency (version column)*: Simpler to implement but requires retry logic client-side; the losing request needs to be re-tried or explicitly told it lost. Under high concurrency, many retries pile up.
- *Application-level mutex / Redis lock*: Introduces an external dependency and a distributed systems failure mode. The database lock is atomic and already part of the write path — there's no "forgot to acquire the lock" risk.
- *CHECK constraint `sold_qty <= total_qty`*: A good safety net (we could add it), but doesn't help with TOCTOU at the application layer without the transaction lock.

**Payment failure handling:** Inventory is deducted *inside* the transaction (so the lock is held until we're committed to the reservation), but the booking status starts as `pending`. Payment simulation runs *after* the commit. On success → `confirmed`. On failure → status set to `failed` and `sold_qty` decremented back. This means a crashed process during payment leaves a `pending` booking and held inventory — in production you'd run a background job to expire pending bookings after N minutes.

---

## What I'd Do With Another Two Days

1. **Pending booking TTL**: A cron job (or `pg_cron`) to expire `pending` bookings older than 15 minutes and return inventory.
2. **Email confirmations**: Nodemailer + a transactional provider (Resend/Postmark) triggered on `confirmed` status.
3. **Pagination on bookings list**: The admin bookings table will get unwieldy at scale.
4. **Rate limiting on `/api/store/bookings`**: `express-rate-limit` to prevent abuse and load-test noise.
5. **Better auth**: Refresh tokens, password reset flow, multiple admin users with role flags.
6. **QR code on confirmation**: A QR encoding the booking reference for check-in scanning.

---

## Schema

See [`migrations/001_init.sql`](migrations/001_init.sql).

Key design decisions:
- `sold_qty` is a **counter column**, not derived from `COUNT(bookings)`. This makes the `FOR UPDATE` lock granular to a single row and the availability check a single integer comparison, not a subquery.
- Booking `status` enum (`pending` / `confirmed` / `failed`) models the payment lifecycle explicitly. A booking row exists before payment resolves.
- `unit_price` is snapshotted on the booking — if you later change a ticket price, historical bookings aren't affected.
