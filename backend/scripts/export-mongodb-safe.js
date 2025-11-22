#!/usr/bin/env node

/**
 * SAFE MongoDB Collection Export Script
 *
 * This script connects to MongoDB and exports all collections to JSON files.
 * IMPORTANT: Sensitive fields (tokens, credentials) are EXCLUDED from exports.
 *
 * Usage: node scripts/export-mongodb-safe.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Create exports directory if it doesn't exist
const EXPORT_DIR = path.join(__dirname, '..', 'exports');
if (!fs.existsSync(EXPORT_DIR)) {
  fs.mkdirSync(EXPORT_DIR, { recursive: true });
}

// Define field exclusions for sensitive collections
const SENSITIVE_FIELD_EXCLUSIONS = {
  users: {
    // EXCLUDE these sensitive fields from users collection
    accessToken: 0,
    refreshToken: 0,
    tokenExpiresAt: 0,
  },
};

async function exportCollections() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB successfully\n');

    // Get the database
    const db = mongoose.connection.db;

    // Get all collection names
    const collections = await db.listCollections().toArray();
    console.log(`📊 Found ${collections.length} collections:\n`);

    collections.forEach((collection, index) => {
      console.log(`  ${index + 1}. ${collection.name}`);
    });
    console.log('');

    // Export each collection
    let totalDocuments = 0;
    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      console.log(`📦 Exporting collection: ${collectionName}...`);

      const collection = db.collection(collectionName);

      // Check if this collection has field exclusions
      const projection = SENSITIVE_FIELD_EXCLUSIONS[collectionName] || {};
      const hasSensitiveFields = Object.keys(projection).length > 0;

      if (hasSensitiveFields) {
        console.log(`  🔒 Excluding sensitive fields: ${Object.keys(projection).join(', ')}`);
      }

      // Fetch documents with field exclusions applied
      const documents = await collection.find({}, { projection }).toArray();

      const count = documents.length;
      totalDocuments += count;

      // Save to JSON file
      const filename = path.join(EXPORT_DIR, `${collectionName}.json`);
      fs.writeFileSync(filename, JSON.stringify(documents, null, 2), 'utf-8');

      console.log(`  ✅ Exported ${count} documents to ${path.basename(filename)}`);
    }

    console.log(`\n🎉 Export completed successfully!`);
    console.log(`   Total collections: ${collections.length}`);
    console.log(`   Total documents: ${totalDocuments}`);
    console.log(`   Export directory: ${EXPORT_DIR}`);
    console.log(`\n🔒 Security: Sensitive fields (tokens, credentials) were EXCLUDED`);

  } catch (error) {
    console.error('❌ Error during export:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

// Run the export
exportCollections();
