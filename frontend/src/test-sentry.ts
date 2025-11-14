// Test Sentry integration in frontend
// This file can be imported and executed from the browser console
// Usage: import('/src/test-sentry.ts').then(m => m.testSentry())

import * as Sentry from '@sentry/react';

export async function testSentry() {
	console.log('\n🧪 Testing Frontend Sentry Error Tracking...\n');

	// Check if Sentry is initialized
	if (!Sentry.getClient()) {
		console.error('❌ Sentry not initialized');
		console.log('   Make sure VITE_SENTRY_DSN_FRONTEND is set and app is in production mode');
		return;
	}

	console.log('✅ Sentry is initialized');
	console.log('\n🚀 Simulating various error types...\n');

	const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

	// Test 1: Simple Error
	try {
		console.log('1️⃣  Testing simple Error...');
		throw new Error('Test error from frontend - simple throw');
	} catch (error) {
		Sentry.captureException(error);
		console.log('   ✓ Error captured\n');
	}

	await sleep(1000);

	// Test 2: Error with user context
	try {
		console.log('2️⃣  Testing Error with user context...');
		Sentry.setUser({
			id: 'test-user-456',
			username: 'Frontend Test User',
			email: 'frontend-test@example.com',
		});
		throw new Error('Test error with user context from frontend');
	} catch (error) {
		Sentry.captureException(error);
		console.log('   ✓ Error with user context captured\n');
	}

	await sleep(1000);

	// Test 3: Error with breadcrumbs
	try {
		console.log('3️⃣  Testing Error with breadcrumbs...');

		Sentry.addBreadcrumb({
			category: 'navigation',
			message: 'User navigated to /profile',
			level: 'info',
		});

		Sentry.addBreadcrumb({
			category: 'ui',
			message: 'User clicked on activity feed',
			level: 'info',
		});

		Sentry.addBreadcrumb({
			category: 'map',
			message: 'Map zoom level changed to 13',
			level: 'info',
		});

		throw new Error('Test error with breadcrumbs from frontend');
	} catch (error) {
		Sentry.captureException(error);
		console.log('   ✓ Error with breadcrumbs captured\n');
	}

	await sleep(1000);

	// Test 4: GraphQL error simulation
	try {
		console.log('4️⃣  Testing GraphQL error simulation...');
		Sentry.setContext('graphql', {
			operation: 'UserHexagons',
			variables: { userId: 'test-123' },
			error: 'Network error',
		});

		throw new Error('GraphQL query failed: Network timeout');
	} catch (error) {
		Sentry.captureException(error);
		console.log('   ✓ GraphQL error captured\n');
	}

	await sleep(1000);

	// Test 5: Custom message
	console.log('5️⃣  Testing custom message...');
	Sentry.captureMessage('Test message from frontend - this is not an error', 'info');
	console.log('   ✓ Message captured\n');

	await sleep(1000);

	// Test 6: React component error simulation
	try {
		console.log('6️⃣  Testing React component error...');
		Sentry.setContext('component', {
			name: 'ProfilePage',
			props: { userId: 'test-123' },
			state: 'loading',
		});

		const componentError = new Error('Cannot read property of undefined');
		componentError.name = 'TypeError';
		throw componentError;
	} catch (error) {
		Sentry.captureException(error);
		console.log('   ✓ Component error captured\n');
	}

	console.log('✅ All test errors sent to Sentry!\n');
	console.log('📊 Check your Sentry dashboard at: https://sentry.io/\n');
	console.log('💡 You should see 6 events:');
	console.log('   - 5 errors with different contexts');
	console.log('   - 1 info message\n');
	console.log('🎉 Frontend Sentry test complete!\n');
}

// Auto-expose to window for easy console access
if (typeof window !== 'undefined') {
	(window as any).testSentry = testSentry;
	console.log('💡 Sentry test available! Run: window.testSentry()');
}
