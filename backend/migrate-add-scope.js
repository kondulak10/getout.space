require('module-alias/register');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
	console.error('❌ MONGODB_URI environment variable is not set');
	process.exit(1);
}

async function migrate() {
	try {
		console.log('🔄 Connecting to MongoDB...');
		await mongoose.connect(MONGODB_URI);
		console.log('✅ Connected to MongoDB');

		const db = mongoose.connection.db;
		const usersCollection = db.collection('users');

		// Find all users without a scope field
		const usersWithoutScope = await usersCollection.countDocuments({
			scope: { $exists: false },
		});

		console.log(`\n📊 Found ${usersWithoutScope} users without scope field`);

		if (usersWithoutScope === 0) {
			console.log('✅ All users already have scope field. No migration needed.');
			await mongoose.disconnect();
			return;
		}

		console.log('🔄 Adding scope field to existing users...');
		console.log('   Setting scope to: "read,activity:read_all" (full permissions)');

		// Update all users without scope field
		const result = await usersCollection.updateMany(
			{ scope: { $exists: false } },
			{ $set: { scope: 'read,activity:read_all' } }
		);

		console.log(`\n✅ Migration completed successfully!`);
		console.log(`   Updated ${result.modifiedCount} users`);

		// Verify the migration
		const remainingUsers = await usersCollection.countDocuments({
			scope: { $exists: false },
		});

		if (remainingUsers === 0) {
			console.log('✅ Verification passed: All users now have scope field');
		} else {
			console.log(`⚠️  Warning: ${remainingUsers} users still missing scope field`);
		}

		await mongoose.disconnect();
		console.log('\n🔌 Disconnected from MongoDB');
	} catch (error) {
		console.error('❌ Migration failed:', error);
		await mongoose.disconnect();
		process.exit(1);
	}
}

migrate();
