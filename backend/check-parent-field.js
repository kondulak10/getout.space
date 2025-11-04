require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/getoutspace';

async function checkParentField() {
	try {
		await mongoose.connect(MONGODB_URI);
		console.log('✅ Connected to MongoDB\n');

		const db = mongoose.connection.db;

		// Get a sample of hexagons with all fields
		const hexagons = await db.collection('hexagons').find({}).limit(5).toArray();

		console.log('📊 Sample hexagons with all fields:');
		console.log('─────────────────────────────────────────────');

		hexagons.forEach((hex, idx) => {
			console.log(`${idx + 1}. Hexagon ID: ${hex.hexagonId}`);
			console.log(`   Parent Hexagon ID: ${hex.parentHexagonId || 'MISSING!'}`);
			console.log(`   Owner Strava ID: ${hex.currentOwnerStravaId}`);
			console.log('');
		});

		// Count how many hexagons have the parentHexagonId field
		const withParent = await db.collection('hexagons').countDocuments({ parentHexagonId: { $exists: true, $ne: null } });
		const withoutParent = await db.collection('hexagons').countDocuments({ parentHexagonId: { $exists: false } });
		const total = await db.collection('hexagons').countDocuments({});

		console.log('📈 Parent field statistics:');
		console.log(`   Total hexagons: ${total}`);
		console.log(`   With parentHexagonId: ${withParent}`);
		console.log(`   WITHOUT parentHexagonId: ${withoutParent} ${withoutParent > 0 ? '❌ PROBLEM!' : '✅'}`);

		await mongoose.connection.close();
		process.exit(0);
	} catch (err) {
		console.error('❌ Error:', err);
		process.exit(1);
	}
}

checkParentField();
