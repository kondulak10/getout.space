import rateLimit from 'express-rate-limit';

/**
 * GLOBAL RATE LIMITER
 * Applies to ALL endpoints as baseline protection
 * 1000 requests per 15 minutes per IP (~66/min for normal usage)
 */
export const globalLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 1000, // 1000 requests per window
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
 * 100 requests per 15 minutes per IP (accounts for shared IPs, debugging, mobile NAT)
 */
export const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 100,
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
 * 1000 requests per 15 minutes per IP (Strava can send bursts)
 */
export const webhookLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 1000,
	message: {
		error: 'Too many webhook requests, please try again later.',
	},
	standardHeaders: true,
	legacyHeaders: false,
});

/**
 * ACTIVITY PROCESSING RATE LIMITER
 * Prevents spam processing of activities
 * 200 requests per 15 minutes per user (allows batch processing old activities)
 */
export const activityProcessingLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 200,
	message: {
		error: 'Too many activity processing requests, please slow down.',
		retryAfter: '15 minutes',
	},
	standardHeaders: true,
	legacyHeaders: false,

	// Key by user ID (not IP) for authenticated requests
	keyGenerator: (req) => {
		const userId = (req as any).userId;
		return userId || req.ip || 'anonymous';
	},
});

/**
 * SSE CONNECTION LIMITER
 * Prevents too many concurrent SSE connections
 * 30 connections per minute per IP (allows page refreshes + multiple tabs)
 */
export const sseLimiter = rateLimit({
	windowMs: 60 * 1000, // 1 minute
	max: 30,
	message: {
		error: 'Too many active connections, please close some tabs.',
	},
	standardHeaders: true,
	legacyHeaders: false,
});

/**
 * GRAPHQL RATE LIMITER
 * General rate limiter for GraphQL endpoint
 * 300 requests per minute per user/IP (allows heavy map usage - panning/zooming)
 */
export const graphqlLimiter = rateLimit({
	windowMs: 60 * 1000, // 1 minute
	max: 300,
	message: {
		error: 'Too many GraphQL requests, please slow down.',
	},
	standardHeaders: true,
	legacyHeaders: false,

	// Key by user ID if authenticated, otherwise IP
	keyGenerator: (req) => {
		const userId = (req as any).userId;
		return userId || req.ip || 'anonymous';
	},

	// Skip rate limit for admins
	skip: async (req) => {
		const user = (req as any).user;
		return user?.isAdmin === true;
	},
});

console.log('✅ Rate limiting: Using in-memory store (single server only)');
