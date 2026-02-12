// Work 1: Data Capture & Encryption
import { saveToDatabase, clearDatabase } from '../core/db-manager.js';
import { encryptData, generateSessionId } from '../core/encryption.js';
import { requestEncryptionKey } from '../core/api-client.js';

/**
 * Processes scraped data through the Work 1 workflow:
 * 1. Save to Database X (unencrypted)
 * 2. Request encryption key from Server 1
 * 3. Encrypt data
 * 4. Save to Database Y (encrypted) - for BOTH save and create
 * 5. Extract to Database Z (index) - for BOTH save and create
 * 6. Clear Database X
 * 
 * @param {Object} scrapedData - Data scraped from portal
 * @returns {Promise<Object>} - Result of the operation
 */
export async function processScrapedData(scrapedData) {
  console.log('[Work-1] Starting data capture workflow');
  console.log('[Work-1] Request type:', scrapedData.requestType || 'unknown');
  
  try {
    // Step 1: Save raw data to Database X
    console.log('[Work-1] Step 1: Saving to Database X (unencrypted)');
    const sessionId = generateSessionId();
    const rawData = {
      ...scrapedData,
      sessionId: sessionId
    };
    
    await saveToDatabase('X', rawData);
    
    // Step 2: Request encryption key from Server 1
    console.log('[Work-1] Step 2: Requesting encryption key');
    const encryptionKey = await requestEncryptionKey();
    
    // Step 3: Encrypt the data
    console.log('[Work-1] Step 3: Encrypting data');
    const encryptedPayload = encryptData(scrapedData, encryptionKey);
    
    const encryptedRecord = {
      sessionId: sessionId,
      encryptedData: encryptedPayload,
      district: scrapedData.district,
      sro: scrapedData.sro,
      userId: scrapedData.userId,
      volumeYear: scrapedData.volumeYear,
      volumeNo: scrapedData.volumeNo,
      bookNo: scrapedData.bookNo,
      deedNo: scrapedData.deedNo,
      requestType: scrapedData.requestType, // 'save' or 'create'
      synced: false
    };
    
    // Step 4: Save encrypted data to Database Y (Master)
    // This happens for BOTH save and create requests
    console.log('[Work-1] Step 4: Saving to Database Y (encrypted master)');
    const recordId = await saveToDatabase('Y', encryptedRecord);
    
    // Step 5: Extract lightweight data for Database Z (index)
    // This also happens for BOTH save and create requests
    console.log('[Work-1] Step 5: Creating index in Database Z');
    await createIndexEntry(scrapedData, recordId);
    
    // Step 6: Clear Database X (security requirement)
    console.log('[Work-1] Step 6: Clearing Database X');
    await clearDatabase('X');
    
    console.log('[Work-1] ✓ Workflow completed successfully');
    
    return {
      success: true,
      recordId: recordId,
      sessionId: sessionId,
      requestType: scrapedData.requestType,
      message: 'Data captured and encrypted successfully'
    };
    
  } catch (error) {
    console.error('[Work-1] ✗ Workflow failed:', error);
    
    // Attempt to clear Database X even on failure
    try {
      await clearDatabase('X');
    } catch (clearError) {
      console.error('[Work-1] Failed to clear Database X:', clearError);
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Creates a lightweight index entry in Database Z
 * @param {Object} data - Original scraped data
 * @param {Number} masterRecordId - ID from Database Y
 * @returns {Promise<void>}
 */
async function createIndexEntry(data, masterRecordId) {
  const indexEntry = {
    // Reference to master record
    masterRecordId: masterRecordId,
    
    // Context (for conflict checking)
    district: data.district,
    sro: data.sro,
    
    // Volume information
    volumeYear: data.volumeYear,
    volumeNo: data.volumeNo,
    bookNo: data.bookNo,
    
    // Deed information
    deedNo: data.deedNo,
    
    // Page range (core conflict data)
    startPage: data.startPage,
    endPage: data.endPage,
    
    // Metadata
    userId: data.userId,
    requestType: data.requestType,
    createdAt: data.scrapedAt,
    synced: false
  };
  
  await saveToDatabase('Z', indexEntry);
  console.log('[Work-1] Index entry created in Database Z with deedNo:', data.deedNo);
}