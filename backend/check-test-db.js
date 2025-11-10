const mongoose = require('mongoose');

const uri = "mongodb+srv://server:4u6adtCvbH9PngF@getoutcluster.6rnoter.mongodb.net/test?appName=GetOutCluster";

async function checkUsers() {
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB (test database)');

    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');

    // Get users with imghex
    const usersWithImghex = await User.find(
      { 'stravaProfile.imghex': { $exists: true, $ne: null, $ne: '' } },
      {
        stravaId: 1,
        'stravaProfile.firstname': 1,
        'stravaProfile.imghex': 1
      }
    ).limit(10);

    console.log(`\nUsers WITH imghex:`);
    console.log('='.repeat(80));
    usersWithImghex.forEach(user => {
      console.log(`${user.stravaProfile?.firstname} (${user.stravaId}): ${user.stravaProfile?.imghex}`);
    });

    // Also show sample users without imghex
    const usersWithoutImghex = await User.find(
      { $or: [
        { 'stravaProfile.imghex': { $exists: false } },
        { 'stravaProfile.imghex': null },
        { 'stravaProfile.imghex': '' }
      ]},
      {
        stravaId: 1,
        'stravaProfile.firstname': 1,
        'stravaProfile.profile': 1,
        'stravaProfile.imghex': 1
      }
    ).limit(5);

    console.log(`\n\nUsers WITHOUT imghex (sample):`);
    console.log('='.repeat(80));
    usersWithoutImghex.forEach(user => {
      console.log(`${user.stravaProfile?.firstname} (${user.stravaId})`);
      console.log(`  profile: ${user.stravaProfile?.profile}`);
      console.log(`  imghex: ${user.stravaProfile?.imghex || 'NOT SET'}`);
    });

    const totalUsers = await User.countDocuments({});
    const withImghex = await User.countDocuments({ 'stravaProfile.imghex': { $exists: true, $ne: null, $ne: '' } });

    console.log('\n' + '='.repeat(80));
    console.log(`Total users: ${totalUsers}`);
    console.log(`Users with imghex: ${withImghex}`);
    console.log(`Users without imghex: ${totalUsers - withImghex}`);

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUsers();
