/**
 * Auto-generate version.ts with git commit hash and build timestamp
 */
import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

export const logVersion = () => {
  const styles = {
    title: 'color: #667eea; font-size: 20px; font-weight: bold;',
    version: 'color: #10b981; font-size: 14px; font-weight: bold;',
    info: 'color: #6b7280; font-size: 12px;',
    border: 'color: #667eea;',
  };

  console.log(
    '%c╔═══════════════════════════════════════════╗',
    styles.border
  );
  console.log(
    '%c║          🚀 GetOut.space LOADED           ║',
    styles.title
  );
  console.log(
    '%c╠═══════════════════════════════════════════╣',
    styles.border
  );
  console.log(
    \`%c║  Version: \${getVersionString().padEnd(30, ' ')}║\`,
    styles.version
  );
  console.log(
    \`%c║  Branch: \${GIT_BRANCH.padEnd(31, ' ')}║\`,
    styles.info
  );
  console.log(
    \`%c║  Build: \${BUILD_DATE.padEnd(32, ' ')}║\`,
    styles.info
  );
  console.log(
    \`%c║  Backend: \${(import.meta.env.VITE_BACKEND_URL || 'localhost:4000').padEnd(28, ' ')}║\`,
    styles.info
  );
  console.log(
    '%c╚═══════════════════════════════════════════╝',
    styles.border
  );
  console.log(
    '%c💡 Cache-busted on every deployment via git hash',
    'color: #f59e0b; font-size: 11px;'
  );
};
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
