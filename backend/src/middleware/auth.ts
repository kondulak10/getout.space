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
 * Used for REST API endpoints (Strava routes)
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
