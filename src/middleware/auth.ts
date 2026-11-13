import type { NextFunction, Request, Response } from 'express';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { eq } from 'drizzle-orm';
import { adminAuth } from '../lib/firebase-admin.ts';
import { db } from '../db/index.ts';
import { users } from '../db/schema.ts';

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
  dbUser?: typeof users.$inferSelect;
}

const ADMIN_EMAILS = new Set(['tehchewl@gmail.com']);

export async function getOrCreateUser(
  uid: string,
  email: string,
  displayName?: string
) {
  const defaultRole = ADMIN_EMAILS.has(email.toLowerCase()) ? 'admin' : 'customer';

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.uid, uid))
    .limit(1);

  if (existing.length > 0) {
    const current = existing[0];
    if (ADMIN_EMAILS.has(email.toLowerCase()) && current.role !== 'admin') {
      const updated = await db
        .update(users)
        .set({ role: 'admin', email })
        .where(eq(users.uid, uid))
        .returning();
      return updated[0];
    }
    return current;
  }

  const inserted = await db
    .insert(users)
    .values({
      uid,
      email,
      displayName: displayName || email.split('@')[0],
      role: defaultRole,
      membershipTierSlug: 'free',
    })
    .onConflictDoUpdate({
      target: users.uid,
      set: { email },
    })
    .returning();

  return inserted[0];
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Please sign in to continue.' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    req.user = decoded;
    req.dbUser = await getOrCreateUser(
      decoded.uid,
      decoded.email || '',
      decoded.name
    );
    next();
  } catch (error) {
    console.error('Firebase token verification failed:', error);
    return res.status(401).json({ error: 'Session expired. Please sign in again.' });
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    req.user = decoded;
    req.dbUser = await getOrCreateUser(
      decoded.uid,
      decoded.email || '',
      decoded.name
    );
  } catch (error) {
    console.warn('Optional auth token skipped:', error);
  }
  next();
};

export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.dbUser || req.dbUser.role !== 'admin') {
    return res
      .status(403)
      .json({ error: 'Authorised administrator access is required.' });
  }
  next();
};
