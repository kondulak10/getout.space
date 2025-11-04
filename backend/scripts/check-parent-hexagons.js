require('dotenv').config();
const mongoose = require('mongoose');

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const Hexagon = mongoose.connection.db.collection('hexagons');

    // Get sample hexagons
    const hexagons = await Hexagon.find().limit(5).toArray();
    console.log('Sample hexagons with parentHexagonId:');
    hexagons.forEach(h => {
      console.log(`  hexagonId: ${h.hexagonId} | parentHexagonId: ${h.parentHexagonId || 'MISSING'}`);
    });

    // Count hexagons with/without parent IDs
    const withParent = await Hexagon.countDocuments({ parentHexagonId: { $exists: true } });
    const withoutParent = await Hexagon.countDocuments({ parentHexagonId: { $exists: false } });
    const total = await Hexagon.countDocuments();

    console.log(`\n📊 Statistics:`);
    console.log(`  Total hexagons: ${total}`);
    console.log(`  With parentHexagonId: ${withParent}`);
    console.log(`  Without parentHexagonId: ${withoutParent}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

check();
