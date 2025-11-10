const mongoose = require('mongoose');

const uri = "mongodb+srv://server:4u6adtCvbH9PngF@getoutcluster.6rnoter.mongodb.net/getout?appName=GetOutCluster";

async function checkImghex() {
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');

    // Get all users with imghex field
    const usersWithImghex = await User.find(
      { 'stravaProfile.imghex': { $exists: true, $ne: null, $ne: '' } },
      {
        stravaId: 1,
        'stravaProfile.firstname': 1,
        'stravaProfile.lastname': 1,
        'stravaProfile.imghex': 1
      }
    ).limit(10);

    console.log(`\nFound ${usersWithImghex.length} users with imghex URLs:`);
    console.log('='.repeat(80));

    usersWithImghex.forEach(user => {
      console.log(`\nUser: ${user.stravaProfile?.firstname} ${user.stravaProfile?.lastname} (${user.stravaId})`);
      console.log(`imghex: ${user.stravaProfile?.imghex}`);
    });

    // Count total users with imghex
    const totalCount = await User.countDocuments(
      { 'stravaProfile.imghex': { $exists: true, $ne: null, $ne: '' } }
    );

    console.log('\n' + '='.repeat(80));
    console.log(`Total users with imghex: ${totalCount}`);

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkImghex();
