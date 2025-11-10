require('dotenv/config');
const mongoose = require('mongoose');

async function expireAllTokens() {
	try {
		const mongoUri = process.env.MONGODB_URI;

		if (!mongoUri) {
			throw new Error('MONGODB_URI environment variable is not defined');
		}

		console.log('🔌 Connecting to MongoDB...');
		await mongoose.connect(mongoUri);
		console.log('✅ MongoDB connected successfully');

		console.log('⏰ Expiring all user tokens...');

		// Get count before update
		const totalUsers = await mongoose.connection.db.collection('users').countDocuments();
		console.log(`📊 Found ${totalUsers} users in database`);

		// Update all users to set tokenExpiresAt to 0 (forces refresh on next use)
		const result = await mongoose.connection.db.collection('users').updateMany(
			{},
			{ $set: { tokenExpiresAt: 0 } }
		);

		console.log(`✅ Updated ${result.modifiedCount} users`);
		console.log('🔄 All users will refresh their tokens on next activity/login');

		await mongoose.connection.close();
		console.log('👋 MongoDB connection closed');

		process.exit(0);
	} catch (error) {
		console.error('❌ Error:', error);
		process.exit(1);
	}
}

expireAllTokens();
