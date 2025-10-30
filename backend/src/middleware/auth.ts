import { Request, Response, NextFunction } from 'express';
import { User, IUser } from '../models/User';
import { verifyToken, extractTokenFromHeader, JWTPayload } from '../utils/jwt';

// Extend Express Request to include user
export interface AuthRequest extends Request {
  user?: IUser;
  userId?: string;
  tokenPayload?: JWTPayload;
}

/**
 * Middleware to authenticate JWT token
 * Attaches user to request if valid
 */
export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const payload = verifyToken(token);
    const user = await User.findById(payload.userId);

    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    // Attach user and payload to request
    req.user = user;
    req.userId = payload.userId;
    req.tokenPayload = payload;

    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Middleware to check if user is admin
 * Must be used after authenticateToken
 */
export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (!req.user.isAdmin) {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }

  next();
};

/**
 * Optional authentication - doesn't fail if no token
 * Used for endpoints that work differently for authenticated users
 */
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (token) {
      const payload = verifyToken(token);
      const user = await User.findById(payload.userId);

      if (user) {
        req.user = user;
        req.userId = payload.userId;
        req.tokenPayload = payload;
      }
    }
  } catch (error) {
    // Ignore errors for optional auth
  }

  next();
};
