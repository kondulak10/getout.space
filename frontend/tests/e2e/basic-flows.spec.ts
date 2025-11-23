import { test, expect } from '@playwright/test';
import { loginAsTestUser, waitForMapReady, cleanupTestData } from './helpers/auth';

/**
 * Basic E2E tests for GetOut.space
 *
 * These tests cover the critical user flows:
 * 1. Landing page loads without errors
 * 2. User can login and see the map
 * 3. Map loads with Mapbox canvas
 * 4. Console has no critical errors during flow
 */

test.describe('GetOut.space E2E Tests', () => {
	// Track console errors
	let consoleErrors: string[] = [];

	test.beforeEach(async ({ page }) => {
		// Clear console errors before each test
		consoleErrors = [];

		// Listen for console errors
		page.on('console', (msg) => {
			if (msg.type() === 'error') {
				consoleErrors.push(msg.text());
			}
		});

		// Listen for page errors (uncaught exceptions)
		page.on('pageerror', (error) => {
			consoleErrors.push(`Uncaught exception: ${error.message}`);
		});
	});

	test.afterEach(async () => {
		// Log console errors if any
		if (consoleErrors.length > 0) {
			console.log('Console errors during test:', consoleErrors);
		}
	});

	test('landing page loads without errors', async ({ page }) => {
		await page.goto('/');

		// Check that login button is visible
		await expect(page.getByTestId('login-button')).toBeVisible();

		// Check page title/heading (use more specific selector)
		await expect(page.locator('h1').filter({ hasText: 'GetOut' })).toBeVisible();

		// Verify no console errors
		expect(consoleErrors).toEqual([]);
	});

	test('user can login and see authenticated UI', async ({ page }) => {
		// Login as test user
		await loginAsTestUser(page);

		// Should be on home page (/) after authentication
		await expect(page).toHaveURL('http://localhost:5173/', { timeout: 10000 });

		// Map container should be visible
		await expect(page.getByTestId('map-container')).toBeVisible({ timeout: 15000 });

		// Verify no critical errors (some warnings are ok)
		const criticalErrors = consoleErrors.filter(
			(err) => !err.includes('warning') && !err.toLowerCase().includes('deprecated')
		);
		expect(criticalErrors).toEqual([]);
	});

	test('map loads with Mapbox canvas', async ({ page }) => {
		await loginAsTestUser(page);

		// Wait for map to be ready
		await waitForMapReady(page);

		// Check for Mapbox canvas element (proof that Mapbox initialized)
		const canvas = page.locator('.mapboxgl-canvas');
		await expect(canvas).toBeVisible();

		// Verify canvas has actual dimensions (not 0x0)
		const boundingBox = await canvas.boundingBox();
		expect(boundingBox).not.toBeNull();
		expect(boundingBox!.width).toBeGreaterThan(100);
		expect(boundingBox!.height).toBeGreaterThan(100);
	});

	test('navigation works - can visit profile page', async ({ page }) => {
		const user = await loginAsTestUser(page);
		await waitForMapReady(page);

		// Navigate to profile page via URL (use the logged-in user's ID)
		await page.goto(`/profile/${user.id}`);

		// Profile page should load
		await expect(page).toHaveURL(/.*profile/);

		// Should show user stats (Territory heading is always visible on profile)
		await expect(page.getByRole('heading', { name: 'Territory', exact: true })).toBeVisible({
			timeout: 10000,
		});
	});

	test('mobile viewport - map is responsive', async ({ page }) => {
		// Set mobile viewport (iPhone 12 Pro dimensions)
		await page.setViewportSize({ width: 390, height: 844 });

		await loginAsTestUser(page);

		// Map should still load on mobile
		await waitForMapReady(page);

		// Map canvas should be visible
		await expect(page.locator('.mapboxgl-canvas')).toBeVisible();

		// Verify map takes up the viewport
		const canvas = page.locator('.mapboxgl-canvas');
		const boundingBox = await canvas.boundingBox();
		expect(boundingBox).not.toBeNull();
		expect(boundingBox!.width).toBeGreaterThan(300); // Reasonable mobile width
		expect(boundingBox!.height).toBeGreaterThan(500); // Reasonable mobile height
	});
});

/**
 * Cleanup test - removes test data after all tests
 * Only runs if not in CI (to avoid interfering with parallel runs)
 */
test.describe('Cleanup', () => {
	test.skip(!!process.env.CI, 'Skip cleanup in CI');

	test('cleanup test data', async ({ page }) => {
		await cleanupTestData(page);
	});
});
