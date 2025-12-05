/**
 * Encryption Utility using Web Crypto API
 * Provides AES-GCM encryption for backup data with password-based key derivation
 */

const ENCRYPTION_VERSION = '1.0';
const SALT_LENGTH = 16; // 128 bits
const IV_LENGTH = 12; // 96 bits for GCM
const ITERATIONS = 100000; // PBKDF2 iterations
const KEY_LENGTH = 256; // AES-256

/**
 * Generate a random salt
 */
const generateSalt = () => {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
};

/**
 * Generate a random initialization vector
 */
const generateIV = () => {
  return crypto.getRandomValues(new Uint8Array(IV_LENGTH));
};

/**
 * Derive encryption key from password using PBKDF2
 */
const deriveKey = async (password, salt) => {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  // Derive AES key
  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
};

/**
 * Encrypt data with password
 * @param {string} data - JSON string to encrypt
 * @param {string} password - Encryption password
 * @returns {Promise<ArrayBuffer>} Encrypted data with metadata
 */
export const encryptData = async (data, password) => {
  try {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);

    // Generate salt and IV
    const salt = generateSalt();
    const iv = generateIV();

    // Derive encryption key
    const key = await deriveKey(password, salt);

    // Encrypt data
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      dataBuffer
    );

    // Create metadata
    const metadata = {
      version: ENCRYPTION_VERSION,
      algorithm: 'AES-GCM',
      keyDerivation: 'PBKDF2',
      iterations: ITERATIONS,
      encrypted: true
    };

    const metadataString = JSON.stringify(metadata);
    const metadataBuffer = encoder.encode(metadataString);
    const metadataLength = new Uint32Array([metadataBuffer.length]);

    // Combine: [metadata length (4 bytes)][metadata][salt][iv][encrypted data]
    const result = new Uint8Array(
      4 + metadataBuffer.length + salt.length + iv.length + encryptedData.byteLength
    );

    let offset = 0;
    result.set(new Uint8Array(metadataLength.buffer), offset);
    offset += 4;
    result.set(metadataBuffer, offset);
    offset += metadataBuffer.length;
    result.set(salt, offset);
    offset += salt.length;
    result.set(iv, offset);
    offset += iv.length;
    result.set(new Uint8Array(encryptedData), offset);

    return result.buffer;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data: ' + error.message);
  }
};

/**
 * Decrypt data with password
 * @param {ArrayBuffer} encryptedBuffer - Encrypted data buffer
 * @param {string} password - Decryption password
 * @returns {Promise<string>} Decrypted JSON string
 */
export const decryptData = async (encryptedBuffer, password) => {
  try {
    const decoder = new TextDecoder();
    const data = new Uint8Array(encryptedBuffer);

    // Read metadata length
    const metadataLength = new Uint32Array(data.slice(0, 4).buffer)[0];
    let offset = 4;

    // Read and parse metadata
    const metadataBuffer = data.slice(offset, offset + metadataLength);
    const metadataString = decoder.decode(metadataBuffer);
    const metadata = JSON.parse(metadataString);
    offset += metadataLength;

    // Validate metadata
    if (!metadata.encrypted || metadata.algorithm !== 'AES-GCM') {
      throw new Error('Invalid encryption format');
    }

    // Extract salt, IV, and encrypted data
    const salt = data.slice(offset, offset + SALT_LENGTH);
    offset += SALT_LENGTH;

    const iv = data.slice(offset, offset + IV_LENGTH);
    offset += IV_LENGTH;

    const encryptedData = data.slice(offset);

    // Derive decryption key
    const key = await deriveKey(password, salt);

    // Decrypt data
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      encryptedData
    );

    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error('Decryption error:', error);
    if (error.name === 'OperationError') {
      throw new Error('Incorrect password or corrupted data');
    }
    throw new Error('Failed to decrypt data: ' + error.message);
  }
};

/**
 * Check if data is encrypted
 * @param {ArrayBuffer} buffer - Data buffer to check
 * @returns {boolean} True if data appears to be encrypted
 */
export const isEncrypted = (buffer) => {
  try {
    const decoder = new TextDecoder();
    const data = new Uint8Array(buffer);

    if (data.length < 4) return false;

    const metadataLength = new Uint32Array(data.slice(0, 4).buffer)[0];
    if (metadataLength > 1000 || metadataLength < 10) return false;

    const metadataBuffer = data.slice(4, 4 + metadataLength);
    const metadataString = decoder.decode(metadataBuffer);
    const metadata = JSON.parse(metadataString);

    return metadata.encrypted === true;
  } catch {
    return false;
  }
};

