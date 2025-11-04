const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/getoutspace';

async function checkDatabase() {
	try {
		await mongoose.connect(MONGODB_URI);
		console.log('✅ Connected to MongoDB\n');

		const db = mongoose.connection.db;
		const collections = await db.listCollections().toArray();

		console.log('📊 Collections in database:');
		console.log('─────────────────────────────');

		for (const col of collections) {
			const count = await db.collection(col.name).countDocuments();
			console.log(`${col.name}: ${count} documents`);
		}

		console.log('─────────────────────────────\n');

		await mongoose.connection.close();
		process.exit(0);
	} catch (err) {
		console.error('❌ Error:', err);
		process.exit(1);
	}
}

checkDatabase();
