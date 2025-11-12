/**
 * Test script to verify getter/setter behavior for token encryption
 * Run with: node test-token-encryption.js
 */

const crypto = require('crypto');

// Simulate encryption (simplified version)
function encrypt(text) {
	if (!text) return text;
	const iv = crypto.randomBytes(16);
	const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.alloc(32, 'test'), iv);
	let encrypted = cipher.update(text, 'utf8', 'hex');
	encrypted += cipher.final('hex');
	const authTag = cipher.getAuthTag();
	return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

function decrypt(encryptedText) {
	if (!encryptedText) return encryptedText;
	if (!encryptedText.includes(':')) return encryptedText; // Not encrypted
	const parts = encryptedText.split(':');
	if (parts.length !== 3) return encryptedText;

	const [ivHex, authTagHex, encryptedData] = parts;
	const iv = Buffer.from(ivHex, 'hex');
	const authTag = Buffer.from(authTagHex, 'hex');
	const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.alloc(32, 'test'), iv);
	decipher.setAuthTag(authTag);

	let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
	decrypted += decipher.final('utf8');
	return decrypted;
}

// Simulate Mongoose getter/setter behavior
class TestDocument {
	constructor() {
		this._internalStorage = {};
	}

	// Simulate setter
	set accessToken(value) {
		console.log('🔧 SETTER called with:', value?.substring(0, 20) + '...');
		if (value && !value.includes(':')) {
			const encrypted = encrypt(value);
			this._internalStorage.accessToken = encrypted;
			console.log('   → Encrypted and stored:', encrypted.substring(0, 40) + '...');
		} else {
			this._internalStorage.accessToken = value;
			console.log('   → Stored as-is (already encrypted)');
		}
	}

	// Simulate getter
	get accessToken() {
		console.log('🔍 GETTER called');
		const stored = this._internalStorage.accessToken;
		if (stored && stored.includes(':')) {
			const decrypted = decrypt(stored);
			console.log('   → Decrypted:', decrypted.substring(0, 20) + '...');
			return decrypted;
		}
		console.log('   → Returned as-is:', stored?.substring(0, 20) + '...');
		return stored;
	}

	// Simulate save() - just returns what's in storage
	async save() {
		console.log('💾 SAVE called - storing to DB:', this._internalStorage.accessToken?.substring(0, 40) + '...');
		return this;
	}
}

// Run the test
async function runTest() {
	console.log('\n========================================');
	console.log('TEST: Mongoose Getter/Setter Behavior');
	console.log('========================================\n');

	const doc = new TestDocument();

	console.log('Step 1: Assign plain token');
	console.log('----------------------------');
	doc.accessToken = 'my_plain_strava_access_token_abc123';

	console.log('\nStep 2: Access token (should trigger getter)');
	console.log('----------------------------');
	const tokenBeforeSave = doc.accessToken;
	console.log('✅ Retrieved value:', tokenBeforeSave);

	console.log('\nStep 3: Save document');
	console.log('----------------------------');
	await doc.save();

	console.log('\nStep 4: Access token AFTER save (should trigger getter again)');
	console.log('----------------------------');
	const tokenAfterSave = doc.accessToken;
	console.log('✅ Retrieved value:', tokenAfterSave);

	console.log('\nStep 5: Verify values match');
	console.log('----------------------------');
	if (tokenBeforeSave === tokenAfterSave && tokenBeforeSave === 'my_plain_strava_access_token_abc123') {
		console.log('✅ SUCCESS: Getter returns decrypted value both before and after save!');
	} else {
		console.log('❌ FAILURE: Values do not match!');
		console.log('   Before save:', tokenBeforeSave);
		console.log('   After save:', tokenAfterSave);
	}

	console.log('\n========================================');
	console.log('TEST: What happens with token refresh');
	console.log('========================================\n');

	console.log('Step 6: Simulate token refresh (assign new token)');
	console.log('----------------------------');
	doc.accessToken = 'new_refreshed_token_xyz789';

	console.log('\nStep 7: Save again');
	console.log('----------------------------');
	await doc.save();

	console.log('\nStep 8: Access token after refresh');
	console.log('----------------------------');
	const tokenAfterRefresh = doc.accessToken;
	console.log('✅ Retrieved value:', tokenAfterRefresh);

	if (tokenAfterRefresh === 'new_refreshed_token_xyz789') {
		console.log('✅ SUCCESS: Token refresh works correctly!');
	} else {
		console.log('❌ FAILURE: Token refresh failed!');
	}

	console.log('\n========================================\n');
}

runTest().catch(console.error);
