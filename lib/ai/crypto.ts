/**
 * AI Configuration - Cryptographic Utilities
 *
 * Provides AES-256-GCM encryption for storing API keys securely.
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Get encryption key from environment
 * @throws {Error} If ENCRYPTION_KEY is not set
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set. Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  }
  return Buffer.from(key, 'hex');
}

/**
 * Encrypt sensitive data (API keys) using AES-256-GCM
 *
 * Format: IV(16 bytes) + AuthTag(16 bytes) + EncryptedData
 *
 * @param plaintext - The plaintext API key to encrypt
 * @returns Hex string containing IV + AuthTag + EncryptedData
 *
 * @example
 * const encrypted = encryptApiKey('sk-1234567890abcdef');
 * // Returns: "0123456789abcdef0123456789abcdef0123456789abcdef..."
 */
export function encryptApiKey(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Combine: IV + AuthTag + Encrypted
  return iv.toString('hex') + authTag.toString('hex') + encrypted;
}

/**
 * Decrypt sensitive data (API keys) using AES-256-GCM
 *
 * @param ciphertext - Hex string containing IV + AuthTag + EncryptedData
 * @returns The decrypted plaintext API key
 *
 * @example
 * const decrypted = decryptApiKey(encrypted);
 * // Returns: "sk-1234567890abcdef"
 */
export function decryptApiKey(ciphertext: string): string {
  const key = getEncryptionKey();

  // Extract components
  const iv = Buffer.from(ciphertext.slice(0, IV_LENGTH * 2), 'hex');
  const authTag = Buffer.from(
    ciphertext.slice(IV_LENGTH * 2, (IV_LENGTH + AUTH_TAG_LENGTH) * 2),
    'hex'
  );
  const encrypted = ciphertext.slice((IV_LENGTH + AUTH_TAG_LENGTH) * 2);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Validate an API key by making a minimal test request to the provider
 *
 * @param providerId - The provider ID (e.g., "google", "openai")
 * @param apiKey - The API key to validate
 * @returns Promise<boolean> - True if the key is valid, false otherwise
 *
 * @example
 * const isValid = await validateAPIKey('google', 'AIza...');
 */
export async function validateAPIKey(providerId: string, apiKey: string): Promise<boolean> {
  try {
    switch (providerId) {
      case 'google': {
        // Test with Gemini API
        const { google } = await import('@ai-sdk/google');
        const { generateText } = await import('ai');

        // Temporarily set the key
        const originalKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        process.env.GOOGLE_GENERATIVE_AI_API_KEY = apiKey;

        try {
          const model = google('gemini-2.5-flash');
          await generateText({
            model,
            prompt: 'test',
          });
          return true;
        } finally {
          // Restore original key
          if (originalKey) {
            process.env.GOOGLE_GENERATIVE_AI_API_KEY = originalKey;
          } else {
            delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
          }
        }
      }

      // Add other providers as needed (OpenAI, Anthropic, etc.)
      default:
        // Assume valid if no validation method is implemented
        return true;
    }
  } catch (error) {
    console.error('API key validation failed:', error);
    return false;
  }
}

/**
 * Generate a secure random encryption key
 *
 * @returns A 64-character hex string (32 bytes)
 *
 * @example
 * const key = generateEncryptionKey();
 * // Returns: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('hex');
}
