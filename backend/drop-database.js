require('dotenv').config();
const mongoose = require('mongoose');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function dropDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const dbName = db.databaseName;

    console.log('⚠️  WARNING: This will DROP the entire database!');
    console.log(`📦 Database: ${dbName}`);

    // Show what will be deleted
    const collections = await db.listCollections().toArray();
    console.log('\n📋 Collections to be deleted:');
    collections.forEach(coll => {
      console.log(`   - ${coll.name}`);
    });

    // Get counts
    console.log('\n📊 Current data:');
    for (const coll of collections) {
      const count = await db.collection(coll.name).countDocuments();
      console.log(`   ${coll.name}: ${count} documents`);
    }

    console.log('\n🔥 This action CANNOT be undone!\n');

    rl.question('Type "DELETE EVERYTHING" to confirm: ', async (answer) => {
      if (answer === 'DELETE EVERYTHING') {
        console.log('\n🗑️  Dropping database...');

        await db.dropDatabase();

        console.log('✅ Database dropped successfully!');
        console.log('🎉 You now have a clean slate!\n');
      } else {
        console.log('\n❌ Operation cancelled - database was NOT dropped');
      }

      await mongoose.connection.close();
      rl.close();
      process.exit(0);
    });

  } catch (err) {
    console.error('❌ Error:', err);
    await mongoose.connection.close();
    rl.close();
    process.exit(1);
  }
}

dropDatabase();
