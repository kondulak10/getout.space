const { MongoClient } = require('mongodb');
require('dotenv').config({ path: './backend/.env' });

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('❌ MONGODB_URI environment variable is not set');
  console.error('   Make sure backend/.env file exists and contains MONGODB_URI');
  process.exit(1);
}

async function checkImghex() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('getout');
    const users = db.collection('users');

    // Get all users with imghex field
    const usersWithImghex = await users.find(
      { 'stravaProfile.imghex': { $exists: true, $ne: null, $ne: '' } },
      {
        projection: {
          stravaId: 1,
          'stravaProfile.firstname': 1,
          'stravaProfile.lastname': 1,
          'stravaProfile.imghex': 1
        }
      }
    ).limit(10).toArray();

    console.log(`\nFound ${usersWithImghex.length} users with imghex URLs:`);
    console.log('='.repeat(80));

    usersWithImghex.forEach(user => {
      console.log(`\nUser: ${user.stravaProfile.firstname} ${user.stravaProfile.lastname} (${user.stravaId})`);
      console.log(`imghex: ${user.stravaProfile.imghex}`);
    });

    // Count total users with imghex
    const totalCount = await users.countDocuments(
      { 'stravaProfile.imghex': { $exists: true, $ne: null, $ne: '' } }
    );

    console.log('\n' + '='.repeat(80));
    console.log(`Total users with imghex: ${totalCount}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkImghex();
