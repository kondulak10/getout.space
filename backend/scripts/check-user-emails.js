// Script to check how many users have filled in their email address
require('dotenv').config();
const mongoose = require('mongoose');

async function checkEmails() {
  try {
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected\n');

    const User = mongoose.connection.db.collection('users');

    // Count total users
    const totalUsers = await User.countDocuments({});
    console.log(`👥 Total users: ${totalUsers}`);

    // Count users with email
    const usersWithEmail = await User.countDocuments({
      email: { $exists: true, $ne: null, $ne: '' }
    });
    console.log(`📧 Users with email: ${usersWithEmail}`);

    // Count users without email
    const usersWithoutEmail = totalUsers - usersWithEmail;
    console.log(`❌ Users without email: ${usersWithoutEmail}`);

    // Calculate percentage
    const percentage = totalUsers > 0 ? ((usersWithEmail / totalUsers) * 100).toFixed(1) : 0;
    console.log(`\n📊 Email completion rate: ${percentage}%`);

    // Show sample of users with emails (first 5)
    const sampleUsers = await User.find(
      { email: { $exists: true, $ne: null, $ne: '' } },
      { projection: { email: 1, stravaProfile: 1, createdAt: 1 } }
    ).limit(5).toArray();

    if (sampleUsers.length > 0) {
      console.log('\n📋 Sample users with emails:');
      sampleUsers.forEach((user, idx) => {
        const name = user.stravaProfile
          ? `${user.stravaProfile.firstname} ${user.stravaProfile.lastname}`
          : 'Unknown';
        console.log(`   ${idx + 1}. ${name}: ${user.email}`);
      });
    }

    process.exit(0);

  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

checkEmails();
