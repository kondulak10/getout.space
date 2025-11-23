import { Page } from '@playwright/test';

const BACKEND_URL = process.env.VITE_BACKEND_URL || 'http://localhost:4000';
const FRONTEND_URL = process.env.VITE_APP_URL || 'http://localhost:5173';

export type UserType = 'regular' | 'admin' | 'premium';

/**
 * Logs in a test user by calling the backend test auth endpoint
 * and injecting the JWT token into localStorage.
 *
 * This bypasses the Strava OAuth flow entirely.
 *
 * @param page - Playwright page instance
 * @param userType - Type of user to create ('regular', 'admin', 'premium')
 * @returns The user object from the auth response
 */
export async function loginAsTestUser(page: Page, userType: UserType = 'regular') {
	// Call backend test endpoint to get a JWT token
	const response = await page.request.post(`${BACKEND_URL}/api/test/auth`, {
		data: { userType },
	});

	if (!response.ok()) {
		throw new Error(`Failed to authenticate test user: ${response.status()} ${await response.text()}`);
	}

	const { token, user } = await response.json();

	// Navigate to frontend first (localStorage can only be set on same origin)
	await page.goto(FRONTEND_URL);

	// Inject token into localStorage (must match TOKEN_KEY in AuthProvider.tsx)
	await page.evaluate((token) => {
		localStorage.setItem('getout_auth_token', token);
	}, token);

	// Reload to trigger auth context to read the token
	await page.reload();

	// Wait for authentication to complete by checking if we're no longer on landing page
	// The landing page has the "Connect with Strava" button, authenticated page doesn't
	try {
		await page.waitForFunction(
			() => {
				// Check if landing page elements are gone (login button)
				const loginButton = document.querySelector('[data-testid="login-button"]');
				return !loginButton;
			},
			{ timeout: 15000, polling: 100 } // Poll every 100ms for up to 15 seconds
		);
	} catch {
		throw new Error('Authentication failed - still on landing page after login');
	}

	// Give auth state time to fully settle before proceeding
	await page.waitForTimeout(1000);

	return user;
}

/**
 * Logs out by clearing localStorage and reloading
 */
export async function logout(page: Page) {
	await page.evaluate(() => {
		localStorage.clear();
	});
	await page.reload();
}

/**
 * Checks if the user is currently authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
	const token = await page.evaluate(() => {
		return localStorage.getItem('getout_auth_token');
	});
	return !!token;
}

/**
 * Waits for the map to be fully loaded and ready
 * This is useful for tests that depend on the map being initialized
 */
export async function waitForMapReady(page: Page, timeout = 15000) {
	// Wait for map container to be visible
	await page.waitForSelector('[data-testid="map-container"]', {
		state: 'visible',
		timeout,
	});

	// Wait for Mapbox to initialize (check for canvas element)
	await page.waitForSelector('.mapboxgl-canvas', {
		state: 'visible',
		timeout,
	});

	// Give it a moment to settle
	await page.waitForTimeout(500);
}

/**
 * Clean up test data after tests
 * Calls the backend cleanup endpoint to remove test users and their data
 */
export async function cleanupTestData(page: Page) {
	try {
		await page.request.delete(`${BACKEND_URL}/api/test/cleanup`);
	} catch (error) {
		console.warn('Failed to cleanup test data:', error);
	}
}
