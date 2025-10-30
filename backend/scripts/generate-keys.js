#!/usr/bin/env node

/**
 * Generate secure random keys for JWT_SECRET and ENCRYPTION_KEY
 *
 * Usage: node scripts/generate-keys.js
 */

const crypto = require('crypto');

console.log('\n🔐 Security Keys Generator\n');
console.log('═'.repeat(70));

console.log('\n📋 Add these to your .env file:\n');

const jwtSecret = crypto.randomBytes(32).toString('hex');
const encryptionKey = crypto.randomBytes(32).toString('hex');

console.log(`JWT_SECRET=${jwtSecret}`);
console.log(`ENCRYPTION_KEY=${encryptionKey}`);

console.log('\n' + '═'.repeat(70));
console.log('\n⚠️  IMPORTANT SECURITY NOTES:\n');
console.log('1. Never commit these keys to version control');
console.log('2. Use different keys for development and production');
console.log('3. Store production keys securely (AWS Secrets Manager, etc.)');
console.log('4. If keys are compromised, regenerate immediately and:');
console.log('   - JWT_SECRET: All users will need to re-login');
console.log('   - ENCRYPTION_KEY: You cannot decrypt existing tokens!');
console.log('     (Users will need to re-authenticate with Strava)\n');
