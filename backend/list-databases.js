const mongoose = require('mongoose');

const uri = "mongodb+srv://server:4u6adtCvbH9PngF@getoutcluster.6rnoter.mongodb.net/?appName=GetOutCluster";

async function listDatabases() {
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    const admin = mongoose.connection.db.admin();
    const dbs = await admin.listDatabases();

    console.log('\nAvailable databases:');
    console.log('='.repeat(80));
    dbs.databases.forEach(db => {
      console.log(`- ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });

    // Try to find collections in common database names
    const dbNames = ['getout', 'test', 'admin', 'getoutspace', 'production'];

    for (const dbName of dbNames) {
      try {
        const db = mongoose.connection.client.db(dbName);
        const collections = await db.listCollections().toArray();

        if (collections.length > 0) {
          console.log(`\nCollections in "${dbName}":`);
          collections.forEach(coll => {
            console.log(`  - ${coll.name}`);
          });
        }
      } catch (e) {
        // Skip if database doesn't exist
      }
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

listDatabases();
