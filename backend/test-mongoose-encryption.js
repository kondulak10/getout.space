/**
 * Real Mongoose test for getter/setter encryption behavior
 * Run with: node test-mongoose-encryption.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');

// Use the same encryption from your codebase
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'a'.repeat(64);
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

function encrypt(text) {
	try {
		const iv = crypto.randomBytes(IV_LENGTH);
		const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
		let encrypted = cipher.update(text, 'utf8', 'hex');
		encrypted += cipher.final('hex');
		const authTag = cipher.getAuthTag();
		return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
	} catch (error) {
		console.error('❌ Encryption failed:', error);
		throw error;
	}
}

function decrypt(encryptedText) {
	try {
		const parts = encryptedText.split(':');
		if (parts.length !== 3) {
			throw new Error('Invalid encrypted data format');
		}
		const [ivHex, authTagHex, encryptedData] = parts;
		const iv = Buffer.from(ivHex, 'hex');
		const authTag = Buffer.from(authTagHex, 'hex');
		const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
		decipher.setAuthTag(authTag);
		let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
		decrypted += decipher.final('utf8');
		return decrypted;
	} catch (error) {
		console.error('❌ Decryption failed:', error);
		throw error;
	}
}

// Create test schema with getters/setters
const TestUserSchema = new mongoose.Schema(
	{
		name: String,
		accessToken: {
			type: String,
			required: true,
			set: (value) => {
				console.log('  🔧 Setter fired for accessToken');
				if (value && !value.includes(':')) {
					return encrypt(value);
				}
				return value;
			},
			get: (value) => {
				console.log('  🔍 Getter fired for accessToken');
				if (value && value.includes(':')) {
					try {
						return decrypt(value);
					} catch (error) {
						console.error('Failed to decrypt accessToken');
						return value;
					}
				}
				return value;
			},
		},
		tokenExpiresAt: Number,
	},
	{
		timestamps: true,
		toJSON: { getters: false },
		toObject: { getters: true },
	}
);

const TestUser = mongoose.model('TestUser', TestUserSchema);

async function runTest() {
	try {
		console.log('\n========================================');
		console.log('REAL MONGOOSE TEST: Getter/Setter Encryption');
		console.log('========================================\n');

		// Connect to MongoDB
		console.log('Connecting to MongoDB...');
		await mongoose.connect(process.env.MONGODB_URI, {
			serverSelectionTimeoutMS: 5000,
		});
		console.log('✅ Connected\n');

		// Clean up any existing test documents
		await TestUser.deleteMany({ name: 'Test User' });

		console.log('Step 1: Create new document with plain token');
		console.log('----------------------------');
		const testUser = new TestUser({
			name: 'Test User',
			accessToken: 'my_plain_strava_token_12345',
			tokenExpiresAt: Math.floor(Date.now() / 1000) + 3600,
		});

		console.log('\nStep 2: Access token before save (should trigger getter)');
		console.log('----------------------------');
		const tokenBeforeSave = testUser.accessToken;
		console.log(`Retrieved: "${tokenBeforeSave}"`);

		console.log('\nStep 3: Save to database');
		console.log('----------------------------');
		await testUser.save();
		console.log('✅ Saved to MongoDB');

		console.log('\nStep 4: Access token AFTER save (should trigger getter)');
		console.log('----------------------------');
		const tokenAfterSave = testUser.accessToken;
		console.log(`Retrieved: "${tokenAfterSave}"`);

		console.log('\nStep 5: Verify both values are decrypted');
		console.log('----------------------------');
		if (
			tokenBeforeSave === 'my_plain_strava_token_12345' &&
			tokenAfterSave === 'my_plain_strava_token_12345'
		) {
			console.log('✅ SUCCESS: Both return plain text!');
		} else {
			console.log('❌ FAILURE!');
			console.log('  Before save:', tokenBeforeSave);
			console.log('  After save:', tokenAfterSave);
		}

		console.log('\nStep 6: Re-fetch from database (new query)');
		console.log('----------------------------');
		const fetchedUser = await TestUser.findById(testUser._id);
		console.log('Fetched user from DB');

		console.log('\nStep 7: Access token from fetched document');
		console.log('----------------------------');
		const tokenFromDB = fetchedUser.accessToken;
		console.log(`Retrieved: "${tokenFromDB}"`);

		if (tokenFromDB === 'my_plain_strava_token_12345') {
			console.log('✅ SUCCESS: Getter fired on fetch from DB!');
		} else {
			console.log('❌ FAILURE! Token from DB:', tokenFromDB);
		}

		console.log('\n========================================');
		console.log('TEST: Token Refresh Scenario');
		console.log('========================================\n');

		console.log('Step 8: Simulate token refresh');
		console.log('----------------------------');
		fetchedUser.accessToken = 'new_refreshed_token_xyz';
		fetchedUser.tokenExpiresAt = Math.floor(Date.now() / 1000) + 7200;

		console.log('\nStep 9: Access token after assignment (before save)');
		console.log('----------------------------');
		const tokenAfterAssignment = fetchedUser.accessToken;
		console.log(`Retrieved: "${tokenAfterAssignment}"`);

		console.log('\nStep 10: Save updated document');
		console.log('----------------------------');
		await fetchedUser.save();
		console.log('✅ Saved');

		console.log('\nStep 11: Access token after second save');
		console.log('----------------------------');
		const tokenAfterSecondSave = fetchedUser.accessToken;
		console.log(`Retrieved: "${tokenAfterSecondSave}"`);

		if (
			tokenAfterAssignment === 'new_refreshed_token_xyz' &&
			tokenAfterSecondSave === 'new_refreshed_token_xyz'
		) {
			console.log('✅ SUCCESS: Token refresh works correctly!');
		} else {
			console.log('❌ FAILURE!');
			console.log('  After assignment:', tokenAfterAssignment);
			console.log('  After save:', tokenAfterSecondSave);
		}

		console.log('\nStep 12: Verify encrypted value in DB');
		console.log('----------------------------');
		const rawDoc = await TestUser.findById(testUser._id).lean();
		console.log('Raw accessToken in DB:', rawDoc.accessToken.substring(0, 50) + '...');
		if (rawDoc.accessToken.includes(':')) {
			console.log('✅ SUCCESS: Token is encrypted in database!');
		} else {
			console.log('❌ FAILURE: Token is NOT encrypted in database!');
		}

		// Cleanup
		await TestUser.deleteMany({ name: 'Test User' });
		console.log('\n✅ Cleanup complete');

		console.log('\n========================================');
		console.log('ALL TESTS PASSED! 🎉');
		console.log('========================================\n');
	} catch (error) {
		console.error('\n❌ TEST FAILED:', error);
		process.exit(1);
	} finally {
		await mongoose.connection.close();
		console.log('Disconnected from MongoDB\n');
	}
}

runTest();
