/**
 * Auto-generate version.ts with build timestamp
 * Version format: YYYYMMDD-HHMMSS
 */
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
    \`%c║  Build: \${BUILD_TIMESTAMP.split('T')[0].padEnd(32, ' ')}║\`,
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
};
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
