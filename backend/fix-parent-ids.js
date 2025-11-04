require('dotenv').config();
const mongoose = require('mongoose');
const h3 = require('h3-js');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/getoutspace';

async function fixParentIds() {
	try {
		await mongoose.connect(MONGODB_URI);
		console.log('✅ Connected to MongoDB\n');

		const db = mongoose.connection.db;

		// Get all hexagons without parentHexagonId
		const hexagons = await db.collection('hexagons').find({
			parentHexagonId: { $exists: false }
		}).toArray();

		console.log(`📊 Found ${hexagons.length} hexagons without parentHexagonId`);

		if (hexagons.length === 0) {
			console.log('✅ All hexagons already have parentHexagonId!');
			await mongoose.connection.close();
			process.exit(0);
		}

		console.log('🔧 Calculating and updating parent IDs...\n');

		// Prepare bulk update operations
		const bulkOps = hexagons.map((hex) => {
			const parentHexagonId = h3.cellToParent(hex.hexagonId, 6);
			return {
				updateOne: {
					filter: { _id: hex._id },
					update: { $set: { parentHexagonId } }
				}
			};
		});

		// Execute bulk update
		const result = await db.collection('hexagons').bulkWrite(bulkOps);

		console.log(`✅ Updated ${result.modifiedCount} hexagons`);
		console.log(`\n🎉 All hexagons now have parentHexagonId!`);

		// Verify
		const remaining = await db.collection('hexagons').countDocuments({
			parentHexagonId: { $exists: false }
		});

		if (remaining === 0) {
			console.log('\n✅ Verification successful: All hexagons have parentHexagonId');
		} else {
			console.log(`\n⚠️ Warning: ${remaining} hexagons still missing parentHexagonId`);
		}

		await mongoose.connection.close();
		process.exit(0);
	} catch (err) {
		console.error('❌ Error:', err);
		process.exit(1);
	}
}

fixParentIds();
