import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../db/pool';

const router = Router();

// List published events
router.get('/events', async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(`
      SELECT
        e.id, e.name, e.description, e.venue, e.event_date,
        COUNT(DISTINCT tt.id) AS ticket_type_count,
        MIN(tt.price) AS min_price,
        COALESCE(SUM(tt.total_qty - tt.sold_qty), 0) AS total_remaining
      FROM events e
      LEFT JOIN ticket_types tt ON tt.event_id = e.id
      WHERE e.is_published = true
      GROUP BY e.id
      ORDER BY e.event_date ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Single published event with ticket types and availability
router.get('/events/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const eventResult = await pool.query(
      'SELECT * FROM events WHERE id = $1 AND is_published = true',
      [id]
    );
    if (eventResult.rows.length === 0) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    const ttResult = await pool.query(`
      SELECT id, name, price, total_qty, sold_qty,
             (total_qty - sold_qty) AS remaining
      FROM ticket_types
      WHERE event_id = $1
      ORDER BY price ASC
    `, [id]);

    res.json({ ...eventResult.rows[0], ticket_types: ttResult.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// Initiate a booking (creates pending booking, then simulates payment)
router.post('/bookings', async (req: Request, res: Response): Promise<void> => {
  const { ticket_type_id, quantity, buyer_name, buyer_email, buyer_phone } = req.body;

  // Input validation
  if (!buyer_name?.trim()) {
    res.status(400).json({ error: 'buyer_name is required' });
    return;
  }
  if (!buyer_email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyer_email)) {
    res.status(400).json({ error: 'A valid buyer_email is required' });
    return;
  }
  if (!buyer_phone?.trim() || !/^\+?[\d\s\-()]{7,15}$/.test(buyer_phone)) {
    res.status(400).json({ error: 'A valid buyer_phone is required' });
    return;
  }
  if (!ticket_type_id || isNaN(Number(ticket_type_id))) {
    res.status(400).json({ error: 'ticket_type_id is required' });
    return;
  }
  const qty = Number(quantity);
  if (!qty || isNaN(qty) || qty < 1 || qty > 10 || !Number.isInteger(qty)) {
    res.status(400).json({ error: 'quantity must be an integer between 1 and 10' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // THE CRITICAL SECTION:
    // SELECT ... FOR UPDATE locks this ticket_type row exclusively.
    // Any concurrent transaction trying to lock the same row will block here
    // until we COMMIT or ROLLBACK. This serialises inventory checks.
    const ttResult = await client.query(`
      SELECT tt.id, tt.name, tt.price, tt.total_qty, tt.sold_qty, tt.event_id,
             (tt.total_qty - tt.sold_qty) AS remaining
      FROM ticket_types tt
      JOIN events e ON e.id = tt.event_id
      WHERE tt.id = $1 AND e.is_published = true
      FOR UPDATE
    `, [ticket_type_id]);

    if (ttResult.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'Ticket type not found' });
      return;
    }

    const tt = ttResult.rows[0];
    const remaining = parseInt(tt.remaining);

    if (remaining < qty) {
      await client.query('ROLLBACK');
      res.status(409).json({
        error: remaining === 0
          ? 'Sorry, this ticket type is sold out'
          : `Only ${remaining} ticket(s) remaining`,
        remaining,
      });
      return;
    }

    const reference = 'ENT-' + uuidv4().replace(/-/g, '').slice(0, 8).toUpperCase();
    const totalAmount = parseFloat(tt.price) * qty;

    // Insert booking as 'pending' — inventory not yet deducted
    const bookingResult = await client.query(`
      INSERT INTO bookings
        (reference, ticket_type_id, event_id, buyer_name, buyer_email, buyer_phone,
         quantity, unit_price, total_amount, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
      RETURNING id, reference, total_amount
    `, [
      reference, tt.id, tt.event_id,
      buyer_name.trim(), buyer_email.trim().toLowerCase(), buyer_phone.trim(),
      qty, tt.price, totalAmount
    ]);

    const bookingId = bookingResult.rows[0].id;

    // Deduct inventory atomically — still inside the same transaction,
    // still holding the FOR UPDATE lock
    await client.query(`
      UPDATE ticket_types
      SET sold_qty = sold_qty + $1
      WHERE id = $2
    `, [qty, tt.id]);

    await client.query('COMMIT');
    // Lock released here. The inventory is definitively reserved.

    // ---- SIMULATE PAYMENT (outside the transaction, inventory already reserved) ----
    // In a real integration: call Stripe/Razorpay here and await the result.
    // The booking stays 'pending' until we hear back.
    const paymentOutcome = await simulatePayment(totalAmount);

    if (paymentOutcome.success) {
      await pool.query(`
        UPDATE bookings SET status = 'confirmed', updated_at = NOW()
        WHERE id = $1
      `, [bookingId]);

      res.json({
        success: true,
        reference: bookingResult.rows[0].reference,
        total_amount: totalAmount,
        message: 'Booking confirmed!',
      });
    } else {
      // Payment failed — release the reserved inventory
      await pool.query(`
        UPDATE bookings SET status = 'failed', updated_at = NOW()
        WHERE id = $1
      `, [bookingId]);

      await pool.query(`
        UPDATE ticket_types SET sold_qty = sold_qty - $1
        WHERE id = $2
      `, [qty, tt.id]);

      res.status(402).json({
        success: false,
        error: 'Payment failed. Your spot has been released. Please try again.',
      });
    }
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Booking error:', err);
    res.status(500).json({ error: 'Booking failed. Please try again.' });
  } finally {
    client.release();
  }
});

// Simulate payment: 90% success rate, ~300ms latency
function simulatePayment(amount: number): Promise<{ success: boolean }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Always succeed for 0-amount tickets (free entry)
      const success = amount === 0 ? true : Math.random() > 0.1;
      resolve({ success });
    }, 200 + Math.random() * 200);
  });
}

export default router;
