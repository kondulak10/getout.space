/**
 * Auto-generate version.ts with build timestamp
 * Version format: DDMM-HHMM
 */
const { writeFileSync } = require('fs');
const { join } = require('path');

try {
  // Generate version from current date/time: DDMM-HHMM
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');

  const version = `${day}${month}-${hours}${minutes}`;
  const buildTime = now.toISOString();

  // Generate version.ts content
  const content = `/**
 * 🤖 AUTO-GENERATED - DO NOT EDIT MANUALLY
 * Generated at build time by scripts/generate-version.js
 */

export const APP_VERSION = '${version}';
export const BUILD_TIMESTAMP = '${buildTime}';

export const getVersionString = () => APP_VERSION;
`;

  // Write to src/version.ts
  const outputPath = join(__dirname, '..', 'src', 'version.ts');
  writeFileSync(outputPath, content, 'utf-8');

  console.log('✅ Generated version.ts:');
  console.log(`   Version: ${version}`);
  console.log(`   Build: ${buildTime}`);
} catch (error) {
  console.error('❌ Failed to generate version.ts:', error.message);
  process.exit(1);
}
