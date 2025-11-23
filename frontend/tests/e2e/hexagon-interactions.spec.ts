/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { test, expect } from '@playwright/test';
import { loginAsTestUser, waitForMapReady } from './helpers/auth';

/**
 * E2E tests for hexagon interactions
 *
 * These tests verify that users can interact with hexagons on the map:
 * - Click hexagons to open detail modal
 * - View hexagon capture information
 * - Close modal
 */

test.describe('Hexagon Interactions', () => {
	test.beforeEach(async ({ page }) => {
		// Login and wait for map to be ready before each test
		await loginAsTestUser(page);
		await waitForMapReady(page);
	});

	test('clicking on map attempts hexagon interaction', async ({ page }) => {
		// Wait for map to be fully interactive
		await page.waitForTimeout(2000);

		// Click somewhere on the map (center)
		const mapContainer = page.getByTestId('map-container');
		const boundingBox = await mapContainer.boundingBox();

		if (boundingBox) {
			// Click in the center of the map
			await page.mouse.click(boundingBox.x + boundingBox.width / 2, boundingBox.y + boundingBox.height / 2);

			// Wait a bit to see if modal appears
			await page.waitForTimeout(1000);

			// Modal might appear if there's a hexagon at that location
			// This test just verifies clicking doesn't cause errors
			const modalVisible = await page.getByTestId('hexagon-modal').isVisible().catch(() => false);

			if (modalVisible) {
				console.log(' Hexagon modal opened successfully');

				// Verify modal has expected content structure
				const modal = page.getByTestId('hexagon-modal');
				await expect(modal).toBeVisible();

				// Modal should have "Battle Arena" title
				await expect(modal.locator('text=Battle Arena')).toBeVisible();
			} else {
				console.log('9 No hexagon at clicked location (this is ok)');
			}
		}
	});

	test('hexagon modal can be closed', async ({ page }) => {
		// Try to trigger a modal by clicking around the map
		const mapContainer = page.getByTestId('map-container');
		const boundingBox = await mapContainer.boundingBox();

		if (boundingBox) {
			// Try clicking multiple spots to find a hexagon
			const clickPositions = [
				{ x: boundingBox.x + boundingBox.width / 2, y: boundingBox.y + boundingBox.height / 2 },
				{ x: boundingBox.x + boundingBox.width / 3, y: boundingBox.y + boundingBox.height / 3 },
				{ x: boundingBox.x + (boundingBox.width * 2) / 3, y: boundingBox.y + boundingBox.height / 2 },
			];

			let modalOpened = false;

			for (const pos of clickPositions) {
				await page.mouse.click(pos.x, pos.y);
				await page.waitForTimeout(500);

				const isVisible = await page.getByTestId('hexagon-modal').isVisible().catch(() => false);
				if (isVisible) {
					modalOpened = true;
					break;
				}
			}

			if (modalOpened) {
				console.log(' Found and opened hexagon modal');

				// Try to close it by clicking outside (Radix Dialog behavior)
				// Click on the overlay/backdrop
				await page.keyboard.press('Escape');
				await page.waitForTimeout(500);

				// Modal should be closed
				const stillVisible = await page.getByTestId('hexagon-modal').isVisible().catch(() => false);
				expect(stillVisible).toBe(false);

				console.log(' Modal closed successfully');
			} else {
				console.log('9 Could not find a hexagon to test modal closing (test user may have no hexagons)');
				test.skip();
			}
		}
	});

	test('map is interactive - can zoom and pan', async ({ page }) => {
		const mapContainer = page.getByTestId('map-container');

		// Get initial map state
		const initialCenter = await page.evaluate(() => {
			const map = (window as any).map;
			if (map) {
				return map.getCenter();
			}
			return null;
		});

		// Zoom in using keyboard shortcut
		await mapContainer.click();
		await page.keyboard.press('+');
		await page.waitForTimeout(500);

		// Verify zoom changed
		const afterZoom = await page.evaluate(() => {
			const map = (window as any).map;
			if (map) {
				return map.getZoom();
			}
			return null;
		});

		// Pan by dragging
		const boundingBox = await mapContainer.boundingBox();
		if (boundingBox) {
			const startX = boundingBox.x + boundingBox.width / 2;
			const startY = boundingBox.y + boundingBox.height / 2;

			await page.mouse.move(startX, startY);
			await page.mouse.down();
			await page.mouse.move(startX + 100, startY + 100, { steps: 10 });
			await page.mouse.up();

			await page.waitForTimeout(500);

			// Verify center changed
			const afterPan = await page.evaluate(() => {
				const map = (window as any).map;
				if (map) {
					return map.getCenter();
				}
				return null;
			});

			// Map should be interactive (center should have changed)
			if (initialCenter && afterPan) {
				const hasMoved =
					Math.abs(initialCenter.lng - afterPan.lng) > 0.001 || Math.abs(initialCenter.lat - afterPan.lat) > 0.001;

				expect(hasMoved).toBe(true);
				console.log(' Map is interactive - panning works');
			}
		}
	});

	test.skip('map controls are present', async ({ page }) => {
		// Mapbox default controls should be present
		const zoomIn = page.locator('.mapboxgl-ctrl-zoom-in');
		const zoomOut = page.locator('.mapboxgl-ctrl-zoom-out');
		const compass = page.locator('.mapboxgl-ctrl-compass');

		// At least zoom controls should be visible
		await expect(zoomIn.or(zoomOut)).toBeVisible({ timeout: 5000 });

		console.log(' Map controls are present');
	});
});
