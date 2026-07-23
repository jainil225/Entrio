# AI_NOTES.md

## 1. Tools Used and For What

**Claude (Anthropic)** — primary tool throughout.

- **Architecture planning**: Asked Claude to reason about the concurrency problem before writing any code. Got a clear comparison of `SELECT FOR UPDATE` vs optimistic locking vs Redis locks, which crystallised the decision.
- **Boilerplate generation**: TypeScript Express setup, pool configuration, cookie-based JWT auth middleware, route scaffolding. Produced ~80% of what I needed; I reviewed and adjusted the auth middleware to handle both API and browser clients (redirecting HTML requests vs returning 401 JSON).
- **SQL drafting**: The booking transaction was the most critical SQL. I had Claude draft it, then read it carefully myself because that's the code path that determines correctness.
- **Frontend HTML/CSS**: All three admin pages and both store pages were AI-drafted. I reviewed the checkout flow and confirmation page carefully because usability problems there directly affect the buyer experience.
- **README sections**: The "how I prevented overselling" section was written collaboratively — I wrote the approach in plain English, Claude structured and expanded it.

---

## 2. A Prompt I'm Proud Of

This is the prompt I used when designing the concurrency approach before writing code:

> I'm building a ticket booking system backed by PostgreSQL. The critical constraint: two users can click "Book" on the last available ticket simultaneously, and exactly one should succeed.
>
> I want you to reason through three approaches to preventing overselling, and recommend one:
>
> **Approach A — Optimistic concurrency**: Add a `version` integer to `ticket_types`. Read `version` when checking availability. On update, include `WHERE version = $old_version` and check `rowCount === 1`. If 0 rows updated, another transaction beat us — return a conflict error to the client.
>
> **Approach B — Pessimistic locking with SELECT FOR UPDATE**: Inside a BEGIN/COMMIT transaction, lock the `ticket_types` row with `SELECT ... FOR UPDATE` before checking availability. The second concurrent request blocks at the lock until the first commits, then reads the updated inventory.
>
> **Approach C — Application-level Redis SETNX lock**: Before touching the DB, acquire a Redis lock keyed by `ticket_type_id`. Release after the DB transaction commits.
>
> For each approach: explain the failure mode it prevents, any failure mode it introduces, and its complexity cost. Then recommend one for a single-server Node.js + Neon Postgres app where the concurrency level is "concurrent HTTP requests under load test, not millions of users."

The response was exactly what I needed — it called out that optimistic locking requires client-side retry logic (which the brief says the loser should get a clean error, not a retry prompt), that Redis introduces an external dependency and a distributed lock release failure mode, and that `FOR UPDATE` is the right tool when you already have a transactional database and want serialised writes with minimal complexity. That confirmed my prior instinct and gave me the wording I used in the README.

---

## 3. One Place AI Got It Wrong

**What it produced**: In the first draft of the booking route, the `sold_qty` counter was updated *before* the booking row was inserted:

```typescript
// AI's first draft (wrong order)
await client.query(`UPDATE ticket_types SET sold_qty = sold_qty + $1 WHERE id = $2`, [qty, ttId]);
await client.query(`INSERT INTO bookings (...) VALUES (...)`, [...]);
await client.query('COMMIT');
```

**How I caught it**: I was reading through the transaction carefully because this is the code path that matters most. I noticed that if the `INSERT INTO bookings` threw an error (e.g. a constraint violation or a network blip), the `ROLLBACK` would undo *both* the insert and the sold_qty update — which is actually fine, transactions are atomic. But the *real* problem was subtler: the `sold_qty` update ran before we'd confirmed the booking was valid. If input validation had been inside the transaction (it's not, but if I'd moved it there), a bad-input error would have rolled back a sold_qty update that was never needed.

More importantly, the *conceptual model* was wrong: the booking row is the source of truth for "a reservation exists." Incrementing `sold_qty` before the booking row exists means there's a window (however small) where inventory is decremented but there's no booking to show for it.

**What I did instead**: Flipped the order — `INSERT INTO bookings` first (status `pending`), then `UPDATE ticket_types SET sold_qty = sold_qty + qty`. Both inside the same transaction, both either committed or rolled back together. The booking row exists before inventory is touched.

---

## 4. Percentage AI-Generated and What I Reviewed Most Carefully

**Rough split**: ~75% of committed code was AI-generated in first draft. ~25% was written or significantly rewritten by me.

**What I reviewed most carefully**:

1. **The booking transaction** (`src/routes/store.ts`, the `POST /bookings` handler): Read it line by line. Verified the lock acquisition, the availability check arithmetic, the insert, the counter update, and the commit/rollback paths. Rewrote the order of operations (see above).

2. **The auth middleware** (`src/middleware/auth.ts`): The AI initially returned 401 for all unauthenticated requests. Browser navigations to protected admin pages need a redirect, not a JSON 401 that renders as raw text. I added the `Accept: text/html` check to branch between redirect and JSON response.

3. **The `sold_qty` decrement on payment failure**: The AI's initial draft didn't include this. When payment simulation returns `success: false`, the sold_qty needs to be returned to the pool. I added the compensating update and double-checked it runs outside the booking transaction (because the transaction has already committed at that point — the inventory was reserved, now it's being released).

An honest note: the race condition fix was something I found and corrected. The AI didn't produce a race condition in the locking mechanism itself (the `FOR UPDATE` was correct), but the insert ordering was wrong conceptually and I caught it in review.
