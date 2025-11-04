require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/getoutspace';

async function checkHexagons() {
	try {
		await mongoose.connect(MONGODB_URI);
		console.log('✅ Connected to MongoDB\n');

		const db = mongoose.connection.db;

		// Get a sample of hexagons
		const hexagons = await db.collection('hexagons').find({}).limit(10).toArray();

		console.log('📊 Sample of hexagons in database (first 10):');
		console.log('─────────────────────────────────────────────');

		hexagons.forEach((hex, idx) => {
			console.log(`${idx + 1}. Hexagon ID: ${hex.hexagonId}`);
			console.log(`   Resolution: ${hex.hexagonId.length === 15 ? 'H3 resolution' : 'Unknown'}`);
			console.log(`   Owner: ${hex.currentOwnerStravaId}`);
			console.log('');
		});

		// Check what parent hexagons exist
		const allHexIds = await db.collection('hexagons').distinct('hexagonId');
		console.log(`\n📍 Total unique hexagon IDs: ${allHexIds.length}`);

		// Get parent IDs at resolution 6
		const h3 = require('h3-js');
		const parentIds = new Set();

		allHexIds.forEach(hexId => {
			try {
				// Get parent at resolution 6 (the resolution being queried)
				const parent = h3.cellToParent(hexId, 6);
				parentIds.add(parent);
			} catch (err) {
				console.log(`Error processing ${hexId}:`, err.message);
			}
		});

		console.log('\n🗺️ Parent hexagons (resolution 6) that contain your hexagons:');
		console.log('─────────────────────────────────────────────');
		Array.from(parentIds).forEach((parentId, idx) => {
			console.log(`${idx + 1}. ${parentId}`);
		});

		console.log('\n🔍 Queried parent IDs:');
		const queriedIds = [
			"861e05da7ffffff",
			"861e04a5fffffff",
			"861e05db7ffffff",
			"861e05d87ffffff",
			"861e05dafffffff",
			"861e05d17ffffff",
			"861e04a4fffffff"
		];
		queriedIds.forEach((id, idx) => {
			const exists = parentIds.has(id);
			console.log(`${idx + 1}. ${id} ${exists ? '✅ MATCH' : '❌ NO MATCH'}`);
		});

		await mongoose.connection.close();
		process.exit(0);
	} catch (err) {
		console.error('❌ Error:', err);
		process.exit(1);
	}
}

checkHexagons();
