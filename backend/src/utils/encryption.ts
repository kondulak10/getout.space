import crypto from 'crypto';

// CRITICAL: Encryption key for sensitive data (access/refresh tokens)
// Validate and ensure it's a string (fail fast if not set)
if (!process.env.ENCRYPTION_KEY) {
  console.error('❌ CRITICAL: ENCRYPTION_KEY environment variable is not set!');
  console.error('❌ Application cannot start without an encryption key for sensitive tokens.');
  console.error('❌ Generate a secure key with: node -e "console.log(crypto.randomBytes(32).toString(\'hex\'))"');
  console.error('❌ Add ENCRYPTION_KEY to your .env file.');
  process.exit(1);
}

// Validate encryption key length (must be 32 bytes = 64 hex characters)
if (process.env.ENCRYPTION_KEY.length !== 64) {
  console.error('❌ CRITICAL: ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes)!');
  console.error('❌ Generate a new key with: node -e "console.log(crypto.randomBytes(32).toString(\'hex\'))"');
  process.exit(1);
}

// After validation, we know it's definitely a string - use type assertion
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY as string;

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 16 bytes for AES-GCM
const AUTH_TAG_LENGTH = 16; // 16 bytes authentication tag

/**
 * Encrypt sensitive data (access tokens, refresh tokens)
 * Uses AES-256-GCM for authenticated encryption
 *
 * @param text - Plain text to encrypt
 * @returns Encrypted text in format: iv:authTag:encryptedData (all hex encoded)
 */
export function encrypt(text: string): string {
  try {
    // Generate random IV for each encryption (never reuse IVs!)
    const iv = crypto.randomBytes(IV_LENGTH);

    // Create cipher with encryption key
    const cipher = crypto.createCipheriv(
      ALGORITHM,
      Buffer.from(ENCRYPTION_KEY, 'hex'),
      iv
    );

    // Encrypt the data
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Get authentication tag (ensures data integrity)
    const authTag = cipher.getAuthTag();

    // Return format: iv:authTag:encryptedData (all hex encoded)
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('❌ Encryption failed:', error);
    throw new Error('Failed to encrypt sensitive data');
  }
}

/**
 * Decrypt sensitive data (access tokens, refresh tokens)
 *
 * @param encryptedText - Encrypted text in format: iv:authTag:encryptedData
 * @returns Decrypted plain text
 */
export function decrypt(encryptedText: string): string {
  try {
    // Parse the encrypted format: iv:authTag:encryptedData
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const [ivHex, authTagHex, encryptedData] = parts;

    // Convert from hex to buffers
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    // Create decipher
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      Buffer.from(ENCRYPTION_KEY, 'hex'),
      iv
    );

    // Set authentication tag for verification
    decipher.setAuthTag(authTag);

    // Decrypt the data
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('❌ Decryption failed:', error);
    throw new Error('Failed to decrypt sensitive data');
  }
}

/**
 * Hash sensitive data for comparison (one-way)
 * Use this for data that doesn't need to be decrypted
 */
export function hash(text: string): string {
  return crypto
    .createHash('sha256')
    .update(text)
    .digest('hex');
}
