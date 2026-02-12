// Work 3: Conflict Checker
// Performs hierarchical conflict checking: Temp → Local → Remote
// ONLY triggered on 400 Bad Request from server

import { checkLocalConflict, saveToDatabase } from '../core/db-manager.js';
import { checkRemoteConflict } from '../core/api-client.js';

/**
 * Performs comprehensive conflict check
 * Hierarchy: Database T (temp) → Database Z (local index) → Server 3 (remote)
 * 
 * @param {Object} data - Scraped data with page range
 * @returns {Promise<Object>} - { conflict: boolean, conflictingRecord: Object, source: string }
 */
export async function checkConflict(data) {
  console.log('[Work-3] Starting conflict check for:', {
    district: data.district,
    sro: data.sro,
    volume: `${data.volumeYear}/${data.volumeNo}`,
    book: data.bookNo,
    pages: `${data.startPage}-${data.endPage}`
  });
  
  try {
    // Step 1: Save to Database T (temporary storage)
    await saveToDatabase('T', {
      ...data,
      checkTimestamp: new Date().toISOString()
    });
    
    // Step 2: Check Database Z (local index)
    console.log('[Work-3] Step 1: Checking local index (Database Z)');
    const localConflict = await checkLocalConflict({
      district: data.district,
      sro: data.sro,
      volumeYear: data.volumeYear,
      volumeNo: data.volumeNo,
      bookNo: data.bookNo,
      startPage: data.startPage,
      endPage: data.endPage
    });
    
    if (localConflict) {
      console.log('[Work-3] ⚠ Local conflict found');
      return {
        conflict: true,
        source: 'local',
        conflictingRecord: localConflict
      };
    }
    
    // Step 3: Check remote via Server 3 (GitHub Index Repo)
    console.log('[Work-3] Step 2: Checking remote index (Server 3)');
    const remoteConflict = await checkRemoteConflict({
      district: data.district,
      sro: data.sro,
      volumeYear: data.volumeYear,
      volumeNo: data.volumeNo,
      bookNo: data.bookNo,
      startPage: data.startPage,
      endPage: data.endPage
    });
    
    if (remoteConflict) {
      console.log('[Work-3] ⚠ Remote conflict found');
      return {
        conflict: true,
        source: 'remote',
        conflictingRecord: remoteConflict
      };
    }
    
    // No conflict found
    console.log('[Work-3] ✓ No conflict detected');
    return {
      conflict: false,
      conflictingRecord: null
    };
    
  } catch (error) {
    console.error('[Work-3] ✗ Conflict check failed:', error);
    
    // On error, return error info but don't assume conflict
    return {
      conflict: false,
      error: error.message
    };
  }
}

/**
 * Validates page range format
 * @param {String} startPage - Start page number
 * @param {String} endPage - End page number
 * @returns {Object} - { valid: boolean, error: string }
 */
export function validatePageRange(startPage, endPage) {
  const start = parseInt(startPage);
  const end = parseInt(endPage);
  
  if (isNaN(start) || isNaN(end)) {
    return {
      valid: false,
      error: 'Page numbers must be numeric'
    };
  }
  
  if (start < 1 || end < 1) {
    return {
      valid: false,
      error: 'Page numbers must be positive'
    };
  }
  
  if (start > end) {
    return {
      valid: false,
      error: 'Start page cannot be greater than end page'
    };
  }
  
  return { valid: true };
}