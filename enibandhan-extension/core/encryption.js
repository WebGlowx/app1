// Core Encryption Module using CryptoJS
import CryptoJS from 'crypto-js';

/**
 * Encrypts data using AES-256 encryption
 * @param {Object} data - The data to encrypt
 * @param {String} key - The encryption key from Server 1
 * @returns {String} - Encrypted string
 */
export function encryptData(data, key) {
  try {
    const jsonString = JSON.stringify(data);
    const encrypted = CryptoJS.AES.encrypt(jsonString, key).toString();
    console.log('[Encryption] Data encrypted successfully');
    return encrypted;
  } catch (error) {
    console.error('[Encryption] Encryption failed:', error);
    throw new Error('Encryption failed: ' + error.message);
  }
}

/**
 * Decrypts AES-256 encrypted data
 * @param {String} encryptedData - The encrypted string
 * @param {String} key - The decryption key
 * @returns {Object} - Decrypted data object
 */
export function decryptData(encryptedData, key) {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedData, key);
    const jsonString = decrypted.toString(CryptoJS.enc.Utf8);
    const data = JSON.parse(jsonString);
    console.log('[Encryption] Data decrypted successfully');
    return data;
  } catch (error) {
    console.error('[Encryption] Decryption failed:', error);
    throw new Error('Decryption failed: ' + error.message);
  }
}

/**
 * Generates a random session ID for tracking
 * @returns {String} - Random session ID
 */
export function generateSessionId() {
  return CryptoJS.lib.WordArray.random(16).toString();
}

/**
 * Creates a hash of data for integrity checking
 * @param {Object} data - Data to hash
 * @returns {String} - SHA-256 hash
 */
export function hashData(data) {
  const jsonString = JSON.stringify(data);
  return CryptoJS.SHA256(jsonString).toString();
}