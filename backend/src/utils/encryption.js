/**
 * Enhanced Encryption Utility with Post-Quantum Support
 * Provides both classical and quantum-resistant encryption
 */

const crypto = require('crypto');
const pqc = require('./postQuantumCrypto');

const ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 32) {
    throw new Error('FATAL: ENCRYPTION_KEY must be set and at least 32 characters');
}
const KEY = Buffer.from(ENCRYPTION_KEY.substring(0, 32));
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Encrypt data (Classical AES-256-GCM)
 * @param {string} text - Plain text to encrypt
 * @returns {string} Encrypted text with IV and auth tag
 */
const encrypt = (text) => {
    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        const authTag = cipher.getAuthTag();

        // Combine IV + encrypted data + auth tag
        return iv.toString('hex') + ':' + encrypted + ':' + authTag.toString('hex');
    } catch (error) {
        throw new Error('Encryption failed: ' + error.message);
    }
};

/**
 * Decrypt data (Classical AES-256-GCM)
 * @param {string} encryptedText - Encrypted text with IV and auth tag
 * @returns {string} Decrypted plain text
 */
const decrypt = (encryptedText) => {
    try {
        const parts = encryptedText.split(':');
        if (parts.length !== 3) {
            throw new Error('Invalid encrypted data format');
        }

        const iv = Buffer.from(parts[0], 'hex');
        const encrypted = parts[1];
        const authTag = Buffer.from(parts[2], 'hex');

        const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        throw new Error('Decryption failed: ' + error.message);
    }
};

/**
 * Encrypt with Post-Quantum Security
 * Uses hybrid encryption for quantum resistance
 * 
 * @param {string} text - Plain text to encrypt
 * @param {string} recipientPublicKey - Optional PQC public key
 * @returns {string} JSON string of encrypted data
 */
const encryptQuantumSafe = (text, recipientPublicKey = null) => {
    try {
        const encrypted = pqc.hybridEncrypt(text, recipientPublicKey);
        return JSON.stringify(encrypted);
    } catch (error) {
        throw new Error('Quantum-safe encryption failed: ' + error.message);
    }
};

/**
 * Decrypt quantum-safe encrypted data
 * 
 * @param {string} encryptedText - JSON string of encrypted data
 * @param {string} privateKey - Optional PQC private key
 * @returns {string} Decrypted plain text
 */
const decryptQuantumSafe = (encryptedText, privateKey = null) => {
    try {
        const encryptedData = JSON.parse(encryptedText);
        return pqc.hybridDecrypt(encryptedData, privateKey);
    } catch (error) {
        throw new Error('Quantum-safe decryption failed: ' + error.message);
    }
};

/**
 * Hash data (one-way) - Quantum-resistant
 * Uses SHA3-512 which is quantum-resistant
 * 
 * @param {string} text - Text to hash
 * @returns {string} Hashed text
 */
const hash = (text) => {
    return pqc.quantumResistantHash(text);
};

/**
 * Hash data (classical SHA-256)
 * For backward compatibility
 * 
 * @param {string} text - Text to hash
 * @returns {string} Hashed text
 */
const hashClassical = (text) => {
    return crypto.createHash('sha256').update(text).digest('hex');
};

/**
 * Generate random token
 * @param {number} length - Token length in bytes
 * @returns {string} Random token
 */
const generateToken = (length = 32) => {
    return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate encryption key for user
 * @returns {string} Base64 encoded key
 */
const generateUserKey = () => {
    return crypto.randomBytes(32).toString('base64');
};

/**
 * Generate post-quantum key pair for user
 * @returns {Object} { publicKey, privateKey }
 */
const generatePQCKeyPair = () => {
    return pqc.generateKeyPair();
};

/**
 * Get encryption security information
 * @returns {Object} Security details
 */
const getSecurityInfo = () => {
    return {
        classical: {
            algorithm: ALGORITHM,
            keySize: 256,
            mode: 'Authenticated Encryption'
        },
        postQuantum: pqc.getSecurityInfo(),
        recommendation: 'Use quantum-safe encryption for sensitive long-term data'
    };
};

module.exports = {
    // Classical encryption (backward compatible)
    encrypt,
    decrypt,

    // Post-quantum encryption
    encryptQuantumSafe,
    decryptQuantumSafe,

    // Hashing
    hash, // Quantum-resistant (SHA3-512)
    hashClassical, // Classical (SHA-256)

    // Utilities
    generateToken,
    generateUserKey,
    generatePQCKeyPair,
    getSecurityInfo,

    // Direct access to PQC module
    pqc
};
