import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
dotenv.config();

import authRouter from './routes/auth';
import adminEventsRouter from './routes/adminEvents';
import storeRouter from './routes/store';
import { requireAdmin } from './middleware/auth';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// API routes
app.use('/api/auth', authRouter);
app.use('/api/admin/events', adminEventsRouter);
app.use('/api/store', storeRouter);

// Admin me endpoint
app.get('/api/auth/me', requireAdmin, (req, res) => {
  res.json(req.admin);
});

// Serve React build
const reactBuild = path.join(__dirname, '..', '..', 'entrio-react', 'build');
app.use(express.static(reactBuild));
console.log('Serving React build from:', reactBuild);

// All non-API routes → React index.html (client-side routing)
app.get('/{*path}', (_req, res) => {
  res.sendFile(path.join(reactBuild, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🎟  Entrio running on http://localhost:${PORT}`);
  console.log(`   Store:  http://localhost:${PORT}/`);
  console.log(`   Admin:  http://localhost:${PORT}/admin/login`);
});

export default app;
