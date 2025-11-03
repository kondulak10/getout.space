/**
 * 🤖 AUTO-GENERATED - DO NOT EDIT MANUALLY
 * Generated at build time by scripts/generate-version.js
 */

export const APP_VERSION = '1.0.48';
export const GIT_HASH = 'cb10859';
export const GIT_BRANCH = 'main';
export const BUILD_DATE = '2025-11-03';
export const BUILD_TIMESTAMP = '2025-11-03T15:53:45.033Z';

export const getVersionString = () => `v${APP_VERSION}-${GIT_HASH}`;

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
    `%c║  Version: ${getVersionString().padEnd(30, ' ')}║`,
    styles.version
  );
  console.log(
    `%c║  Branch: ${GIT_BRANCH.padEnd(31, ' ')}║`,
    styles.info
  );
  console.log(
    `%c║  Build: ${BUILD_DATE.padEnd(32, ' ')}║`,
    styles.info
  );
  console.log(
    `%c║  Backend: ${(import.meta.env.VITE_BACKEND_URL || 'localhost:4000').padEnd(28, ' ')}║`,
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
