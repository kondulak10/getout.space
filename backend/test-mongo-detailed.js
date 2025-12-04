require('dotenv').config();
const { MongoClient } = require('mongodb');

console.log('🔍 Testing MongoDB connection with detailed error info...\n');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  serverSelectionTimeoutMS: 5000,
});

async function testConnection() {
  try {
    console.log('Attempting to connect...');
    await client.connect();
    console.log('✅ Connected successfully!');

    const admin = client.db().admin();
    const status = await admin.serverStatus();
    console.log(`📊 MongoDB version: ${status.version}`);

    await client.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed with detailed error:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
    process.exit(1);
  }
}

testConnection();
