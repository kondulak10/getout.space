import jwt from 'jsonwebtoken';
import { IUser } from '../models/User';

const JWT_SECRET_RAW = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '7d'; // Token expires in 7 days

// CRITICAL: Fail fast if JWT_SECRET is not set
if (!JWT_SECRET_RAW) {
  console.error('❌ CRITICAL: JWT_SECRET environment variable is not set!');
  console.error('❌ Application cannot start without a secure JWT secret.');
  console.error('❌ Add JWT_SECRET to your .env file with a strong random value.');
  process.exit(1);
}

// After validation, we know it's a valid string
const JWT_SECRET: string = JWT_SECRET_RAW;

export interface JWTPayload {
  userId: string;
  stravaId: number;
  isAdmin: boolean;
}

/**
 * Generate a JWT token for a user
 */
export const generateToken = (user: IUser): string => {
  const payload: JWTPayload = {
    userId: String(user._id),
    stravaId: user.stravaId,
    isAdmin: user.isAdmin,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

/**
 * Verify and decode a JWT token
 */
export const verifyToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

/**
 * Extract token from Authorization header
 */
export const extractTokenFromHeader = (authHeader?: string): string | null => {
  if (!authHeader) {
    return null;
  }

  // Format: "Bearer TOKEN"
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    return parts[1];
  }

  return null;
};
