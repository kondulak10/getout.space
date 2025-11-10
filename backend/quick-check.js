require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const users = await mongoose.connection.db.collection('users').find({}, {
    projection: { stravaId: 1, 'stravaProfile.firstname': 1, 'stravaProfile.imghex': 1 }
  }).toArray();

  console.log('Users with imghex:');
  users.forEach(u => {
    if (u.stravaProfile && u.stravaProfile.imghex) {
      console.log(`- ${u.stravaProfile.firstname}: ${u.stravaProfile.imghex}`);
    }
  });

  const withImghex = users.filter(u => u.stravaProfile && u.stravaProfile.imghex).length;
  console.log(`\nTotal: ${withImghex}/${users.length}`);
  await mongoose.connection.close();
}).catch(console.error);
