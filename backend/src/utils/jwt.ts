import jwt from 'jsonwebtoken';
import { IUser } from '@/models/User';

const JWT_SECRET_RAW = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '7d';

if (!JWT_SECRET_RAW) {
	console.error('❌ CRITICAL: JWT_SECRET environment variable is not set!');
	console.error('❌ Application cannot start without a secure JWT secret.');
	console.error('❌ Add JWT_SECRET to your .env file with a strong random value.');
	process.exit(1);
}

const JWT_SECRET: string = JWT_SECRET_RAW;

export interface JWTPayload {
	userId: string;
	stravaId: number;
	isAdmin: boolean;
}

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

export const verifyToken = (token: string): JWTPayload => {
	try {
		const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
		return decoded;
	} catch (error) {
		throw new Error('Invalid or expired token');
	}
};

export const extractTokenFromHeader = (authHeader?: string): string | null => {
	if (!authHeader) {
		return null;
	}

	const parts = authHeader.split(' ');
	if (parts.length === 2 && parts[0] === 'Bearer') {
		return parts[1];
	}

	return null;
};
