require('dotenv').config();
const mongoose = require('mongoose');

console.log('🔍 Testing MongoDB connection...');
console.log(`📍 MongoDB URI: ${process.env.MONGODB_URI?.substring(0, 30)}...`);

mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
})
  .then(() => {
    console.log('✅ MongoDB connection successful!');
    console.log(`📊 Connected to: ${mongoose.connection.name}`);
    mongoose.connection.close();
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ MongoDB connection failed:');
    console.error(error.message);
    process.exit(1);
  });
