import { Router, Request, Response } from 'express';
import pool from '../db/pool';
import { requireAdmin } from '../middleware/auth';

const router = Router();
router.use(requireAdmin);

// List all events (admin sees all, published + unpublished)
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(`
      SELECT
        e.id, e.name, e.venue, e.event_date, e.is_published, e.created_at,
        COUNT(DISTINCT b.id) FILTER (WHERE b.status = 'confirmed') AS booking_count,
        COALESCE(SUM(tt.total_qty), 0) AS total_capacity,
        COALESCE(SUM(tt.sold_qty), 0) AS total_sold
      FROM events e
      LEFT JOIN ticket_types tt ON tt.event_id = e.id
      LEFT JOIN bookings b ON b.event_id = e.id
      GROUP BY e.id
      ORDER BY e.event_date DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Get single event with ticket types
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const eventResult = await pool.query(
      'SELECT * FROM events WHERE id = $1',
      [id]
    );
    if (eventResult.rows.length === 0) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    const ttResult = await pool.query(
      'SELECT * FROM ticket_types WHERE event_id = $1 ORDER BY price ASC',
      [id]
    );

    res.json({ ...eventResult.rows[0], ticket_types: ttResult.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// Create event
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { name, description, venue, event_date } = req.body;

  if (!name?.trim() || !venue?.trim() || !event_date) {
    res.status(400).json({ error: 'name, venue, and event_date are required' });
    return;
  }

  try {
    const result = await pool.query(`
      INSERT INTO events (name, description, venue, event_date, created_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [name.trim(), description?.trim() || null, venue.trim(), event_date, req.admin!.id]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Update event (not publish status — separate endpoint)
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, description, venue, event_date } = req.body;

  if (!name?.trim() || !venue?.trim() || !event_date) {
    res.status(400).json({ error: 'name, venue, and event_date are required' });
    return;
  }

  try {
    const result = await pool.query(`
      UPDATE events
      SET name = $1, description = $2, venue = $3, event_date = $4, updated_at = NOW()
      WHERE id = $5
      RETURNING *
    `, [name.trim(), description?.trim() || null, venue.trim(), event_date, id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// Publish / unpublish
router.patch('/:id/publish', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { is_published } = req.body;

  if (typeof is_published !== 'boolean') {
    res.status(400).json({ error: 'is_published must be a boolean' });
    return;
  }

  try {
    const result = await pool.query(`
      UPDATE events SET is_published = $1, updated_at = NOW()
      WHERE id = $2 RETURNING id, name, is_published
    `, [is_published, id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update publish status' });
  }
});

// Add ticket type to event
router.post('/:id/ticket-types', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, price, total_qty } = req.body;

  if (!name?.trim()) {
    res.status(400).json({ error: 'name is required' });
    return;
  }
  if (price === undefined || isNaN(Number(price)) || Number(price) < 0) {
    res.status(400).json({ error: 'price must be a non-negative number' });
    return;
  }
  if (!total_qty || isNaN(Number(total_qty)) || Number(total_qty) < 1) {
    res.status(400).json({ error: 'total_qty must be a positive integer' });
    return;
  }

  try {
    // Check event exists
    const eventCheck = await pool.query('SELECT id FROM events WHERE id = $1', [id]);
    if (eventCheck.rows.length === 0) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    const result = await pool.query(`
      INSERT INTO ticket_types (event_id, name, price, total_qty)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [id, name.trim(), Number(price), Number(total_qty)]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create ticket type' });
  }
});

// Delete ticket type
router.delete('/ticket-types/:ttId', async (req: Request, res: Response): Promise<void> => {
  const { ttId } = req.params;
  try {
    // Don't allow deletion if bookings exist
    const booked = await pool.query(
      "SELECT COUNT(*) FROM bookings WHERE ticket_type_id = $1 AND status = 'confirmed'",
      [ttId]
    );
    if (parseInt(booked.rows[0].count) > 0) {
      res.status(400).json({ error: 'Cannot delete ticket type with confirmed bookings' });
      return;
    }
    await pool.query('DELETE FROM ticket_types WHERE id = $1', [ttId]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete ticket type' });
  }
});

// Get bookings for an event
router.get('/:id/bookings', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const result = await pool.query(`
      SELECT
        b.id, b.reference, b.buyer_name, b.buyer_email, b.buyer_phone,
        b.quantity, b.unit_price, b.total_amount, b.status, b.created_at,
        tt.name AS ticket_type_name, tt.id AS ticket_type_id
      FROM bookings b
      JOIN ticket_types tt ON tt.id = b.ticket_type_id
      WHERE b.event_id = $1
      ORDER BY b.created_at DESC
    `, [id]);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

export default router;
