const mongoose = require('mongoose');

const uri = "mongodb+srv://server:4u6adtCvbH9PngF@getoutcluster.6rnoter.mongodb.net/getout?appName=GetOutCluster";

async function checkUsers() {
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');

    // Get a few sample users
    const users = await User.find({}).limit(5);

    console.log(`\nSample users (showing first 5):`);
    console.log('='.repeat(80));

    users.forEach(user => {
      console.log(`\nUser ID: ${user._id}`);
      console.log(`Strava ID: ${user.stravaId}`);
      console.log(`Name: ${user.stravaProfile?.firstname} ${user.stravaProfile?.lastname}`);
      console.log(`Profile image: ${user.stravaProfile?.profile}`);
      console.log(`Hex image: ${user.stravaProfile?.imghex || 'NOT SET'}`);
      console.log('-'.repeat(80));
    });

    const totalUsers = await User.countDocuments({});
    console.log(`\nTotal users in database: ${totalUsers}`);

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUsers();
