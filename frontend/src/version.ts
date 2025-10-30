// 🚨 IMPORTANT: Update version on EVERY frontend change! 🚨
// Increment: 1.0.1 -> 1.0.2 (minor), 1.0.9 -> 1.1.0 (feature), 2.0.0 (major)
export const APP_VERSION = '1.0.1';
export const BUILD_DATE = '2025-10-30';

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
    `%c║  Version: ${APP_VERSION.padEnd(30, ' ')}║`,
    styles.version
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
    '%c💡 Check cache invalidation by watching version changes',
    'color: #f59e0b; font-size: 11px;'
  );
};
