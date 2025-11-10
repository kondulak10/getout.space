require('dotenv').config();
const mongoose = require('mongoose');

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const users = await db.collection('users').find({}).toArray();

    console.log(`Found ${users.length} users:\n`);
    console.log('='.repeat(100));

    users.forEach((user, idx) => {
      console.log(`\n${idx + 1}. ${user.stravaProfile?.firstname} ${user.stravaProfile?.lastname} (Strava ID: ${user.stravaId})`);
      console.log(`   profile: ${user.stravaProfile?.profile || 'NOT SET'}`);
      console.log(`   imghex: ${user.stravaProfile?.imghex || 'NOT SET'}`);
    });

    console.log('\n' + '='.repeat(100));
    const withImghex = users.filter(u => u.stravaProfile?.imghex).length;
    console.log(`\nSummary: ${withImghex}/${users.length} users have imghex URLs`);

    await mongoose.connection.close();
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

checkUsers();
