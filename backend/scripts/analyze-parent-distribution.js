require('dotenv').config();
const mongoose = require('mongoose');

async function analyze() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const Hexagon = mongoose.connection.db.collection('hexagons');

    // Group hexagons by parent and count
    const pipeline = [
      {
        $group: {
          _id: '$parentHexagonId',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ];

    const result = await Hexagon.aggregate(pipeline).toArray();

    console.log('📊 Parent Hexagon Distribution:\n');
    console.log(`Total unique parents: ${result.length}`);
    console.log(`\nChild hexagons per parent:\n`);

    result.forEach((parent, index) => {
      console.log(`  ${index + 1}. Parent ${parent._id}: ${parent.count} children`);
    });

    // Calculate statistics
    const counts = result.map(p => p.count);
    const total = counts.reduce((sum, c) => sum + c, 0);
    const avg = total / counts.length;
    const max = Math.max(...counts);
    const min = Math.min(...counts);

    console.log(`\n📈 Statistics:`);
    console.log(`  Average children per parent: ${avg.toFixed(1)}`);
    console.log(`  Max children in one parent: ${max}`);
    console.log(`  Min children in one parent: ${min}`);
    console.log(`  Total children: ${total}`);

    console.log(`\n💡 Theoretical capacity:`);
    console.log(`  Resolution 6 → Resolution 10 = 4 level difference`);
    console.log(`  Each parent can hold ~7^4 = 2,401 child hexagons`);
    console.log(`  Current usage: ${((avg / 2401) * 100).toFixed(2)}% of capacity`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

analyze();
