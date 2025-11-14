// Migration script to populate lastPreviousOwnerId from captureHistory
require('dotenv').config();
const mongoose = require('mongoose');

async function migrate() {
  try {
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected');

    const Hexagon = mongoose.connection.db.collection('hexagons');

    // Get all hexagons that have captureHistory but no lastPreviousOwnerId
    const hexagons = await Hexagon.find({
      captureHistory: { $exists: true, $ne: [] },
      lastPreviousOwnerId: { $exists: false }
    }).toArray();

    console.log(`\n📊 Found ${hexagons.length} hexagons with capture history but no lastPreviousOwnerId`);

    if (hexagons.length === 0) {
      console.log('✅ All hexagons already have lastPreviousOwnerId populated!');
      process.exit(0);
    }

    // Update each hexagon with lastPreviousOwnerId from last entry in captureHistory
    let updated = 0;
    let skipped = 0;

    for (const hex of hexagons) {
      if (hex.captureHistory && hex.captureHistory.length > 0) {
        // Get the last entry in captureHistory (most recent previous owner)
        const lastEntry = hex.captureHistory[hex.captureHistory.length - 1];

        await Hexagon.updateOne(
          { _id: hex._id },
          { $set: { lastPreviousOwnerId: lastEntry.userId } }
        );

        updated++;
      } else {
        skipped++;
      }

      if ((updated + skipped) % 100 === 0) {
        console.log(`✅ Processed ${updated + skipped}/${hexagons.length} hexagons (${updated} updated, ${skipped} skipped)...`);
      }
    }

    console.log(`\n✅ Migration complete!`);
    console.log(`   Updated: ${updated} hexagons`);
    console.log(`   Skipped: ${skipped} hexagons (empty history)`);
    console.log(`\n📌 This enables efficient "stolen from" queries using indexed field`);
    process.exit(0);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
