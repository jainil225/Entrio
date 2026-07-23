import bcrypt from 'bcryptjs';
import pool from './pool';
import fs from 'fs';
import path from 'path';

async function seed() {
  // Run migration first
  const sql = fs.readFileSync(
    path.join(__dirname, '../../migrations/001_init.sql'),
    'utf8'
  );
  await pool.query(sql);
  console.log('✅ Schema ready');

  // Admin user
  const passwordHash = await bcrypt.hash('admin123', 12);
  await pool.query(`
    INSERT INTO admins (email, password_hash, name)
    VALUES ($1, $2, $3)
    ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
  `, ['admin@entrio.com', passwordHash, 'Entrio Admin']);
  console.log('✅ Admin user: admin@entrio.com / admin123');

  // Sample events
  const event1 = await pool.query(`
    INSERT INTO events (name, description, venue, event_date, is_published, created_by)
    VALUES (
      'TechConf 2025',
      'The biggest tech conference of the year. Join us for talks, workshops, and networking with industry leaders.',
      'Grand Convention Centre, Mumbai',
      '2025-09-15 09:00:00+05:30',
      true,
      1
    )
    ON CONFLICT DO NOTHING
    RETURNING id
  `);

  if (event1.rows.length > 0) {
    const e1Id = event1.rows[0].id;
    await pool.query(`
      INSERT INTO ticket_types (event_id, name, price, total_qty) VALUES
      ($1, 'Early Bird', 999.00, 5),
      ($1, 'General Admission', 1499.00, 50),
      ($1, 'VIP', 4999.00, 10)
    `, [e1Id]);
    console.log('✅ Event 1: TechConf 2025 with 3 ticket types');
  }

  const event2 = await pool.query(`
    INSERT INTO events (name, description, venue, event_date, is_published, created_by)
    VALUES (
      'Startup Mixer Ahmedabad',
      'Meet founders, investors, and builders over drinks. Informal networking event for the Gujarat startup ecosystem.',
      'The Courtyard, SG Highway, Ahmedabad',
      '2025-08-10 18:30:00+05:30',
      true,
      1
    )
    ON CONFLICT DO NOTHING
    RETURNING id
  `);

  if (event2.rows.length > 0) {
    const e2Id = event2.rows[0].id;
    await pool.query(`
      INSERT INTO ticket_types (event_id, name, price, total_qty) VALUES
      ($1, 'Free Entry', 0.00, 100),
      ($1, 'Supporter Pass', 299.00, 30)
    `, [e2Id]);
    console.log('✅ Event 2: Startup Mixer Ahmedabad with 2 ticket types');
  }

  const event3 = await pool.query(`
    INSERT INTO events (name, description, venue, event_date, is_published, created_by)
    VALUES (
      'Jazz Night - Draft',
      'An evening of live jazz. Work in progress.',
      'Blue Frog, Pune',
      '2025-10-05 20:00:00+05:30',
      false,
      1
    )
    ON CONFLICT DO NOTHING
    RETURNING id
  `);

  if (event3.rows.length > 0) {
    const e3Id = event3.rows[0].id;
    await pool.query(`
      INSERT INTO ticket_types (event_id, name, price, total_qty) VALUES
      ($1, 'Standard', 799.00, 80)
    `, [e3Id]);
    console.log('✅ Event 3: Jazz Night (unpublished draft)');
  }

  console.log('\n🎉 Seed complete!');
  await pool.end();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
