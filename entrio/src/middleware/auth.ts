import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AdminPayload {
  id: number;
  email: string;
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      admin?: AdminPayload;
    }
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const tokenFromCookie = req.cookies?.admin_token;
  const token = tokenFromCookie || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null);

  if (!token) {
    // API requests get 401, browser requests get redirect
    if (req.headers.accept?.includes('text/html')) {
      res.redirect('/admin/login.html');
    } else {
      res.status(401).json({ error: 'Authentication required' });
    }
    return;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'change-me') as AdminPayload;
    req.admin = payload;
    next();
  } catch {
    res.clearCookie('admin_token');
    if (req.headers.accept?.includes('text/html')) {
      res.redirect('/admin/login.html');
    } else {
      res.status(401).json({ error: 'Invalid or expired token' });
    }
  }
}
