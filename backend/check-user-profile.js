require('dotenv').config();
const mongoose = require('mongoose');

async function checkUserProfile() {
	try {
		await mongoose.connect(process.env.MONGODB_URI);
		console.log('✅ Connected to MongoDB\n');

		const user = await mongoose.connection.db.collection('users').findOne({}, { sort: { createdAt: -1 } });

		if (user) {
			console.log('📊 Most Recent User:');
			console.log('─────────────────────────────');
			console.log('ID:', user._id);
			console.log('Strava ID:', user.stravaId);
			console.log('Name:', user.stravaProfile?.firstname, user.stravaProfile?.lastname);
			console.log('Profile URL:', user.stravaProfile?.profile || '(empty)');
			console.log('Imghex URL:', user.stravaProfile?.imghex || '(empty)');
			console.log('Created:', user.createdAt);
			console.log('─────────────────────────────');
		} else {
			console.log('❌ No users found');
		}

		process.exit(0);
	} catch (error) {
		console.error('❌ Error:', error);
		process.exit(1);
	}
}

checkUserProfile();
