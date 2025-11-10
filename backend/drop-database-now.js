require('dotenv').config();
const mongoose = require('mongoose');

async function dropDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const dbName = db.databaseName;

    console.log('📦 Database: ' + dbName);

    // Show what will be deleted
    const collections = await db.listCollections().toArray();
    console.log('\n📋 Collections to be deleted:');
    collections.forEach(coll => {
      console.log('   - ' + coll.name);
    });

    // Get counts
    console.log('\n📊 Current data:');
    for (const coll of collections) {
      const count = await db.collection(coll.name).countDocuments();
      console.log('   ' + coll.name + ': ' + count + ' documents');
    }

    console.log('\n🔥 DROPPING DATABASE IN 3 SECONDS...\n');

    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('🗑️  Dropping database...');
    await db.dropDatabase();

    console.log('✅ Database dropped successfully!');
    console.log('🎉 You now have a clean slate!\n');

    await mongoose.connection.close();
    process.exit(0);

  } catch (err) {
    console.error('❌ Error:', err);
    await mongoose.connection.close();
    process.exit(1);
  }
}

dropDatabase();
