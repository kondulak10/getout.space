import crypto from 'crypto';

if (!process.env.ENCRYPTION_KEY) {
  console.error('❌ CRITICAL: ENCRYPTION_KEY environment variable is not set!');
  console.error('❌ Application cannot start without an encryption key for sensitive tokens.');
  console.error('❌ Generate a secure key with: node -e "console.log(crypto.randomBytes(32).toString(\'hex\'))"');
  console.error('❌ Add ENCRYPTION_KEY to your .env file.');
  process.exit(1);
}

if (process.env.ENCRYPTION_KEY.length !== 64) {
  console.error('❌ CRITICAL: ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes)!');
  console.error('❌ Generate a new key with: node -e "console.log(crypto.randomBytes(32).toString(\'hex\'))"');
  process.exit(1);
}

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY as string;

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

export function encrypt(text: string): string {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(
      ALGORITHM,
      Buffer.from(ENCRYPTION_KEY, 'hex'),
      iv
    );

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('❌ Encryption failed:', error);
    throw new Error('Failed to encrypt sensitive data');
  }
}

export function decrypt(encryptedText: string): string {
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const [ivHex, authTagHex, encryptedData] = parts;

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      Buffer.from(ENCRYPTION_KEY, 'hex'),
      iv
    );

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('❌ Decryption failed:', error);
    throw new Error('Failed to decrypt sensitive data');
  }
}

export function hash(text: string): string {
  return crypto
    .createHash('sha256')
    .update(text)
    .digest('hex');
}
