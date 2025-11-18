/**
 * 🤖 AUTO-GENERATED - DO NOT EDIT MANUALLY
 * Generated at build time by scripts/generate-version.js
 */

export const APP_VERSION = '1811-1155';
export const BUILD_TIMESTAMP = '2025-11-18T10:55:42.451Z';

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
    `%c║  Version: ${getVersionString().padEnd(30, ' ')}║`,
    styles.version
  );
  console.log(
    `%c║  Build: ${BUILD_TIMESTAMP.split('T')[0].padEnd(32, ' ')}║`,
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
};
