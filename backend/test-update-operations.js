/**
 * Test update operations with getters/setters
 * Run with: node test-update-operations.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'a'.repeat(64);
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

function encrypt(text) {
	const iv = crypto.randomBytes(IV_LENGTH);
	const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
	let encrypted = cipher.update(text, 'utf8', 'hex');
	encrypted += cipher.final('hex');
	const authTag = cipher.getAuthTag();
	return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

function decrypt(encryptedText) {
	const parts = encryptedText.split(':');
	if (parts.length !== 3) throw new Error('Invalid format');
	const [ivHex, authTagHex, encryptedData] = parts;
	const iv = Buffer.from(ivHex, 'hex');
	const authTag = Buffer.from(authTagHex, 'hex');
	const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
	decipher.setAuthTag(authTag);
	let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
	decrypted += decipher.final('utf8');
	return decrypted;
}

const TestSchema = new mongoose.Schema(
	{
		name: String,
		accessToken: {
			type: String,
			required: true,
			set: (value) => {
				if (value && !value.includes(':')) return encrypt(value);
				return value;
			},
			get: (value) => {
				if (value && value.includes(':')) {
					try {
						return decrypt(value);
					} catch (e) {
						return value;
					}
				}
				return value;
			},
		},
	},
	{
		toJSON: { getters: false },
		toObject: { getters: true },
	}
);

const TestModel = mongoose.model('TestUpdate', TestSchema);

async function runTest() {
	try {
		console.log('\n========================================');
		console.log('TEST: Update Operations with Getters/Setters');
		console.log('========================================\n');

		await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
		console.log('✅ Connected to MongoDB\n');

		// Cleanup
		await TestModel.deleteMany({ name: 'UpdateTest' });

		// Create initial document
		console.log('Step 1: Create document');
		console.log('----------------------------');
		const doc = await TestModel.create({
			name: 'UpdateTest',
			accessToken: 'initial_token_123',
		});
		console.log('Created with ID:', doc._id);

		// Test updateOne
		console.log('\nStep 2: Update using updateOne()');
		console.log('----------------------------');
		await TestModel.updateOne(
			{ _id: doc._id },
			{
				$set: {
					accessToken: 'updated_token_456',
				},
			}
		);
		console.log('✅ updateOne() complete');

		// Fetch and verify
		console.log('\nStep 3: Fetch and verify token is decrypted');
		console.log('----------------------------');
		const fetched = await TestModel.findById(doc._id);
		console.log('Fetched token:', fetched.accessToken);
		if (fetched.accessToken === 'updated_token_456') {
			console.log('✅ SUCCESS: Token decrypted correctly after updateOne()!');
		} else {
			console.log('❌ FAILURE: Token not decrypted properly');
			console.log('   Expected: updated_token_456');
			console.log('   Got:', fetched.accessToken);
		}

		// Test findOneAndUpdate
		console.log('\nStep 4: Update using findOneAndUpdate()');
		console.log('----------------------------');
		await TestModel.findOneAndUpdate(
			{ _id: doc._id },
			{
				$set: {
					accessToken: 'findone_token_789',
				},
			}
		);
		console.log('✅ findOneAndUpdate() complete');

		const fetched2 = await TestModel.findById(doc._id);
		console.log('Fetched token:', fetched2.accessToken);
		if (fetched2.accessToken === 'findone_token_789') {
			console.log('✅ SUCCESS: Token decrypted correctly after findOneAndUpdate()!');
		} else {
			console.log('❌ FAILURE: Token not decrypted properly');
		}

		// Verify encrypted in DB
		console.log('\nStep 5: Verify encrypted in database');
		console.log('----------------------------');
		const raw = await TestModel.findById(doc._id).lean();
		console.log('Raw token in DB:', raw.accessToken.substring(0, 50) + '...');
		if (raw.accessToken.includes(':')) {
			console.log('✅ SUCCESS: Token is encrypted in database!');
		} else {
			console.log('❌ FAILURE: Token is NOT encrypted!');
		}

		// Cleanup
		await TestModel.deleteMany({ name: 'UpdateTest' });

		console.log('\n========================================');
		console.log('ALL UPDATE TESTS PASSED! 🎉');
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
