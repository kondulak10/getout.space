// Migration script to populate parentHexagonId for existing hexagons
require('dotenv').config();
const mongoose = require('mongoose');
const h3 = require('h3-js');

async function migrate() {
  try {
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected');

    const Hexagon = mongoose.connection.db.collection('hexagons');

    // Get all hexagons without parent IDs
    const hexagons = await Hexagon.find({ parentHexagonId: { $exists: false } }).toArray();
    console.log(`\n📊 Found ${hexagons.length} hexagons without parent IDs`);

    if (hexagons.length === 0) {
      console.log('✅ All hexagons already have parent IDs!');
      process.exit(0);
    }

    // Update each hexagon with its parent ID
    let updated = 0;
    for (const hex of hexagons) {
      const parentHexagonId = h3.cellToParent(hex.hexagonId, 6);

      await Hexagon.updateOne(
        { _id: hex._id },
        { $set: { parentHexagonId } }
      );

      updated++;
      if (updated % 10 === 0) {
        console.log(`✅ Updated ${updated}/${hexagons.length} hexagons...`);
      }
    }

    console.log(`\n✅ Migration complete! Updated ${updated} hexagons with parent IDs`);
    console.log('📌 Parent resolution: 6 (~3km hexagons)');
    process.exit(0);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
