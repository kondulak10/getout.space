// Test script to simulate errors and verify Sentry integration
// Run with: NODE_ENV=production node scripts/test-sentry.js

require('dotenv').config();
const Sentry = require('@sentry/node');

// Force production mode for testing
process.env.NODE_ENV = 'production';

async function testSentry() {
	console.log('\n🧪 Testing Sentry Error Tracking...\n');

	// Check if DSN is configured
	if (!process.env.SENTRY_DSN_BACKEND) {
		console.error('❌ SENTRY_DSN_BACKEND not configured in .env');
		console.log('   Add it to your .env file to test Sentry');
		process.exit(1);
	}

	// Initialize Sentry manually (since we're not using server.ts)
	Sentry.init({
		dsn: process.env.SENTRY_DSN_BACKEND,
		environment: 'test',
		tracesSampleRate: 1.0,
		beforeSend(event) {
			console.log(`📤 Sending error to Sentry: ${event.exception?.values?.[0]?.value}`);
			return event;
		},
	});

	console.log('✅ Sentry initialized with DSN:', Sentry.getClient()?.getDsn()?.toString());
	console.log('\n🚀 Simulating various error types...\n');

	// Test 1: Simple Error
	try {
		console.log('1️⃣  Testing simple Error...');
		throw new Error('Test error from backend - simple throw');
	} catch (error) {
		Sentry.captureException(error);
		console.log('   ✓ Error captured\n');
	}

	await sleep(1000);

	// Test 2: Error with context
	try {
		console.log('2️⃣  Testing Error with user context...');
		Sentry.setUser({
			id: 'test-user-123',
			username: 'Test User',
			email: 'test@example.com',
		});
		throw new Error('Test error with user context');
	} catch (error) {
		Sentry.captureException(error);
		console.log('   ✓ Error with user context captured\n');
	}

	await sleep(1000);

	// Test 3: Error with tags and breadcrumbs
	try {
		console.log('3️⃣  Testing Error with tags and breadcrumbs...');
		Sentry.setTag('test-type', 'simulation');
		Sentry.setTag('script', 'test-sentry.js');

		Sentry.addBreadcrumb({
			category: 'test',
			message: 'User clicked a button',
			level: 'info',
		});

		Sentry.addBreadcrumb({
			category: 'test',
			message: 'Processing started',
			level: 'info',
		});

		throw new Error('Test error with breadcrumbs and tags');
	} catch (error) {
		Sentry.captureException(error);
		console.log('   ✓ Error with breadcrumbs and tags captured\n');
	}

	await sleep(1000);

	// Test 4: Custom message (not an error)
	console.log('4️⃣  Testing custom message...');
	Sentry.captureMessage('Test message from backend - this is not an error', 'info');
	console.log('   ✓ Message captured\n');

	await sleep(1000);

	// Test 5: Database error simulation
	try {
		console.log('5️⃣  Testing database error simulation...');
		Sentry.setContext('database', {
			operation: 'find',
			collection: 'hexagons',
			query: { hexagonId: 'test-hex-123' },
		});

		const dbError = new Error('MongoDB connection timeout');
		dbError.name = 'MongoNetworkError';
		throw dbError;
	} catch (error) {
		Sentry.captureException(error);
		console.log('   ✓ Database error captured\n');
	}

	await sleep(1000);

	// Test 6: Activity processing error simulation
	try {
		console.log('6️⃣  Testing activity processing error...');
		Sentry.setContext('activity', {
			stravaActivityId: 123456789,
			userId: 'test-user-123',
			activityType: 'Run',
		});

		throw new Error('Failed to process activity: Invalid polyline data');
	} catch (error) {
		Sentry.captureException(error);
		console.log('   ✓ Activity processing error captured\n');
	}

	// Flush events to Sentry (wait for them to be sent)
	console.log('⏳ Flushing events to Sentry (waiting 5 seconds)...\n');
	await Sentry.flush(5000);

	console.log('✅ All test errors sent to Sentry!\n');
	console.log('📊 Check your Sentry dashboard at: https://sentry.io/\n');
	console.log('💡 You should see 6 events:');
	console.log('   - 5 errors with different contexts');
	console.log('   - 1 info message\n');
}

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

// Run the tests
testSentry()
	.then(() => {
		console.log('🎉 Sentry test complete!\n');
		process.exit(0);
	})
	.catch((error) => {
		console.error('❌ Sentry test failed:', error);
		process.exit(1);
	});
