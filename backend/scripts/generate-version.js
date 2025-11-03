/**
 * Auto-generate version.ts with git commit hash and build timestamp
 */
const { execSync } = require('child_process');
const { writeFileSync } = require('fs');
const { join } = require('path');

try {
  // Get git commit hash (short version)
  const gitHash = execSync('git rev-parse --short HEAD')
    .toString()
    .trim();

  // Get git branch
  const gitBranch = execSync('git rev-parse --abbrev-ref HEAD')
    .toString()
    .trim();

  // Get total commit count (auto-incrementing patch number)
  const commitCount = execSync('git rev-list --count HEAD')
    .toString()
    .trim();

  // Get build timestamp
  const buildDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const buildTime = new Date().toISOString();

  // Auto-generate version: 1.0.{commitCount}
  const version = `1.0.${commitCount}`;

  // Generate version.ts content
  const content = `/**
 * 🤖 AUTO-GENERATED - DO NOT EDIT MANUALLY
 * Generated at build time by scripts/generate-version.js
 */

export const APP_VERSION = '${version}';
export const GIT_HASH = '${gitHash}';
export const GIT_BRANCH = '${gitBranch}';
export const BUILD_DATE = '${buildDate}';
export const BUILD_TIMESTAMP = '${buildTime}';

export const getVersionString = () => \`v\${APP_VERSION}-\${GIT_HASH}\`;
`;

  // Write to src/version.ts
  const outputPath = join(__dirname, '..', 'src', 'version.ts');
  writeFileSync(outputPath, content, 'utf-8');

  console.log('✅ Generated version.ts:');
  console.log(`   Version: ${version}`);
  console.log(`   Git: ${gitHash} (${gitBranch})`);
  console.log(`   Build: ${buildDate}`);
} catch (error) {
  console.error('❌ Failed to generate version.ts:', error.message);
  process.exit(1);
}
