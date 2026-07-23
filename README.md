# Entrio — Mini Ticketing App

A stripped-down event ticketing system with an admin dashboard and public storefront, built with Node.js/Express/TypeScript backend and React/TypeScript frontend, backed by PostgreSQL.

**Live demo:** https://entrio.onrender.com  
**Admin:** https://entrio.onrender.com/admin/login

---

## Stack

- **Backend:** Node.js + Express + TypeScript
- **Frontend:** React + TypeScript (CRA)
- **Database:** PostgreSQL (Neon hosted)
- **Auth:** JWT via httpOnly cookie
- **Deployment:** Render (single web service)

---

## Setup Instructions

### Prerequisites
- Node.js 18+
- A PostgreSQL database (Neon recommended — free, no install)

### 1. Clone the repo

```bash
git clone https://github.com/jainil225/Entrio.git
cd Entrio
```

### 2. Set up the database

Sign up at [neon.tech](https://neon.tech), create a project, copy the connection string.

**Throwaway connection string (safe to use for review):**
```
postgresql://neondb_owner:npg_fThrQ9ukE7Gx@ep-little-lab-aqjy9xqv-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### 3. Configure environment

```bash
cd entrio
cp .env.example .env
```

Edit `.env`:
```
DATABASE_URL=postgresql://neondb_owner:npg_fThrQ9ukE7Gx@ep-little-lab-aqjy9xqv-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
JWT_SECRET=entrio-super-secret-jwt-key-2025
NODE_ENV=development
PORT=3000
```

### 4. Install dependencies and seed database

```bash
# Backend
cd entrio
npm install

# Seed database (creates schema + sample events + admin user)
npx tsx src/db/seed.ts
```

### 5. Build the React frontend

```bash
cd ../entrio-react
npm install
npm run build
```

### 6. Start the server

```bash
cd ../entrio
npm run dev
```

Visit:
- **Storefront:** http://localhost:3000
- **Admin:** http://localhost:3000/admin/login

---

## Admin Credentials

| Email | Password |
|-------|----------|
| admin@entrio.com | admin123 |

---

## Seed Data

The seed script creates:
- 1 admin user (`admin@entrio.com` / `admin123`)
- **TechConf 2025** — Published, 3 ticket types (Early Bird ₹999/5, General ₹1499/50, VIP ₹4999/10)
- **Startup Mixer Ahmedabad** — Published, 2 ticket types (Free/100, Supporter ₹299/30)
- **Jazz Night - Draft** — Unpublished draft, 1 ticket type

---

## How I Prevented Overselling

### Mechanism: `SELECT ... FOR UPDATE`

The booking route wraps every reservation in a PostgreSQL transaction with a row-level exclusive lock:

```sql
BEGIN;

SELECT tt.id, tt.total_qty, tt.sold_qty,
       (tt.total_qty - tt.sold_qty) AS remaining
FROM ticket_types tt
JOIN events e ON e.id = tt.event_id
WHERE tt.id = $1 AND e.is_published = true
FOR UPDATE;   -- acquires exclusive row lock

-- If remaining >= requested qty:
--   INSERT booking (status='pending')
--   UPDATE ticket_types SET sold_qty = sold_qty + qty
-- Else:
--   ROLLBACK → 409 "sold out"

COMMIT;       -- lock released
```

### What happens under concurrency

```
User A → BEGIN → SELECT FOR UPDATE  ← gets lock
User B → BEGIN → SELECT FOR UPDATE  ← BLOCKS, waiting
User A → remaining=1, INSERT booking, sold_qty becomes 1
User A → COMMIT  ← lock released
User B → unblocks, reads sold_qty=1, remaining=0
User B → ROLLBACK → 409 "Sorry, this ticket type is sold out"
```

Exactly one succeeds. The other gets a clean error. Zero overselling.

### Why this over alternatives

| Approach | Problem |
|----------|---------|
| **Optimistic locking (version column)** | Requires client-side retry logic — brief says loser should get a clean error, not retry |
| **Redis SETNX lock** | External dependency; if Redis goes down, bookings break; overkill for single-server app |
| **DB CHECK constraint only** | Prevents bad data but doesn't prevent the TOCTOU race — two transactions can both read `remaining=1` before either commits |
| **SELECT FOR UPDATE ✅** | Serialises at DB layer, atomic check+reserve, clean loser path, no extra dependencies |

### Payment state handling

Inventory is deducted **inside** the transaction (lock held until commit = reservation confirmed). Booking starts as `pending`. Payment simulation runs **after** commit. On success → `confirmed`. On failure → `failed` and `sold_qty` decremented back. A crashed process leaves a `pending` booking — in production a background job would expire these after N minutes.

### Verified under load

Fired 6 concurrent requests against Early Bird (4 remaining). Result: exactly 4 confirmed, 2 rejected with "sold out". `sold_qty` = 5 (not 6, not 7). Zero overselling confirmed.

---

## Project Structure

```
Entrio/
├── entrio/                  # Express backend
│   ├── migrations/
│   │   └── 001_init.sql     # Full schema
│   ├── src/
│   │   ├── db/
│   │   │   ├── pool.ts      # pg connection pool
│   │   │   └── seed.ts      # seed script
│   │   ├── middleware/
│   │   │   └── auth.ts      # JWT middleware
│   │   ├── routes/
│   │   │   ├── auth.ts      # login/logout
│   │   │   ├── adminEvents.ts # admin CRUD
│   │   │   └── store.ts     # public + booking (concurrency here)
│   │   └── index.ts         # Express app
│   └── package.json
└── entrio-react/            # React frontend
    └── src/
        ├── pages/
        │   ├── admin/       # Login, Dashboard, NewEvent, EventDetail
        │   └── store/       # Home, EventPage
        ├── api/             # axios client + all API calls
        └── App.tsx          # React Router routes
```

---

## What I Would Do With Another Two Days

1. **Pending booking TTL** — Background job to expire `pending` bookings older than 15 minutes and release inventory back to the pool
2. **Email confirmations** — Nodemailer + Resend/Postmark triggered on `confirmed` status
3. **Rate limiting** — `express-rate-limit` on `/api/store/bookings` to prevent abuse
4. **Refresh tokens** — Better auth with token rotation and proper expiry handling
5. **Pagination** — Bookings table gets unwieldy at scale; add cursor-based pagination
6. **QR code on confirmation** — Encode booking reference as QR for check-in scanning
7. **Multi-admin support** — Role flags on the admins table for event-specific access