import rateLimit from 'express-rate-limit';

// Helper to safely get IP address (handles IPv6)
const getClientIp = (req: any): string => {
	return req.ip || req.socket?.remoteAddress || 'unknown';
};

/**
 * GLOBAL RATE LIMITER
 * Applies to ALL endpoints as baseline protection
 * 10000 requests per 15 minutes per IP (~666/min - very generous)
 */
export const globalLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 10000, // 10000 requests per window
	message: {
		error: 'Too many requests from this IP, please try again later.',
		retryAfter: '15 minutes',
	},
	standardHeaders: true, // Return rate limit info in headers (RateLimit-*)
	legacyHeaders: false, // Disable X-RateLimit-* headers
	skipSuccessfulRequests: false, // Count all requests
	skipFailedRequests: false,
});

/**
 * AUTH RATE LIMITER
 * Protects login/signup endpoints from brute force
 * 1000 requests per 15 minutes per IP (very generous for shared IPs, debugging, mobile NAT)
 */
export const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 1000,
	message: {
		error: 'Too many authentication attempts, please try again later.',
		retryAfter: '15 minutes',
	},
	standardHeaders: true,
	legacyHeaders: false,

	// Skip rate limit for admins
	skip: async (req) => {
		const user = (req as any).user;
		return user?.isAdmin === true;
	},
});

/**
 * WEBHOOK RATE LIMITER
 * Protects webhook endpoint from spam
 * 10000 requests per 15 minutes per IP (Strava can send massive bursts)
 */
export const webhookLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 10000,
	message: {
		error: 'Too many webhook requests, please try again later.',
	},
	standardHeaders: true,
	legacyHeaders: false,
});

/**
 * ACTIVITY PROCESSING RATE LIMITER
 * Prevents spam processing of activities
 * 2000 requests per 15 minutes per user (allows massive batch processing)
 */
export const activityProcessingLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 2000,
	message: {
		error: 'Too many activity processing requests, please slow down.',
		retryAfter: '15 minutes',
	},
	standardHeaders: true,
	legacyHeaders: false,

	// Key by user ID (not IP) for authenticated requests
	keyGenerator: (req) => {
		const userId = (req as any).userId;
		if (userId) {
			return `user:${userId}`;
		}
		// Fall back to IP using safe helper
		return `ip:${getClientIp(req)}`;
	},
});

/**
 * SSE CONNECTION LIMITER
 * Prevents too many concurrent SSE connections
 * 300 connections per minute per IP (basically unlimited for normal usage)
 */
export const sseLimiter = rateLimit({
	windowMs: 60 * 1000, // 1 minute
	max: 300,
	message: {
		error: 'Too many active connections, please close some tabs.',
	},
	standardHeaders: true,
	legacyHeaders: false,
});

/**
 * GRAPHQL RATE LIMITER
 * General rate limiter for GraphQL endpoint
 * 3000 requests per minute per user/IP (50/sec - insane map usage allowed)
 */
export const graphqlLimiter = rateLimit({
	windowMs: 60 * 1000, // 1 minute
	max: 3000,
	message: {
		error: 'Too many GraphQL requests, please slow down.',
	},
	standardHeaders: true,
	legacyHeaders: false,

	// Key by user ID if authenticated, otherwise IP
	keyGenerator: (req) => {
		const userId = (req as any).userId;
		if (userId) {
			return `user:${userId}`;
		}
		// Fall back to IP using safe helper
		return `ip:${getClientIp(req)}`;
	},

	// Skip rate limit for admins
	skip: async (req) => {
		const user = (req as any).user;
		return user?.isAdmin === true;
	},
});

console.log('✅ Rate limiting: Using in-memory store (single server only)');
