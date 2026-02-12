// Work 2: Sync Manager
// Handles actual syncing of data to GitHub via Netlify servers

import { getAllRecords, markAsSynced } from '../core/db-manager.js';
import { syncIndexData, syncMasterData } from '../core/api-client.js';

/**
 * Syncs index data from Database Z to GitHub Index Repo (via Server 2)
 * Scheduled for 3:00 PM daily
 */
export async function syncIndexData() {
  console.log('[Work-2] Starting index sync (Database Z → Server 2)');
  
  try {
    // Get all unsynced records from Database Z
    const records = await getAllRecords('Z', { synced: false });
    
    if (records.length === 0) {
      console.log('[Work-2] No index records to sync');
      return { success: true, synced: 0 };
    }
    
    console.log(`[Work-2] Found ${records.length} index records to sync`);
    
    // Prepare records for syncing (remove internal IDs)
    const syncPayload = records.map(record => ({
      district: record.district,
      sro: record.sro,
      volumeYear: record.volumeYear,
      volumeNo: record.volumeNo,
      bookNo: record.bookNo,
      startPage: record.startPage,
      endPage: record.endPage,
      userId: record.userId,
      timestamp: record.timestamp
    }));
    
    // Send to Server 2
    const result = await syncIndexData(syncPayload);
    
    // Mark records as synced
    for (const record of records) {
      await markAsSynced('Z', record.id);
    }
    
    console.log(`[Work-2] ✓ Successfully synced ${records.length} index records`);
    
    return {
      success: true,
      synced: records.length,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('[Work-2] ✗ Index sync failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Syncs master data from Database Y to GitHub Master Repo (via Server 1)
 * Scheduled for 4:00 PM daily
 */
export async function syncMasterData() {
  console.log('[Work-2] Starting master sync (Database Y → Server 1)');
  
  try {
    // Get all unsynced encrypted records from Database Y
    const records = await getAllRecords('Y', { synced: false });
    
    if (records.length === 0) {
      console.log('[Work-2] No master records to sync');
      return { success: true, synced: 0 };
    }
    
    console.log(`[Work-2] Found ${records.length} master records to sync`);
    
    // Send encrypted records to Server 1
    // Server 1 will apply master key encryption before GitHub push
    const result = await syncMasterData(records);
    
    // Mark records as synced
    for (const record of records) {
      await markAsSynced('Y', record.id);
    }
    
    console.log(`[Work-2] ✓ Successfully synced ${records.length} master records`);
    
    return {
      success: true,
      synced: records.length,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('[Work-2] ✗ Master sync failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Retries any failed syncs from previous day
 * Scheduled for 10:00 AM daily
 */
export async function retryFailedSyncs() {
  console.log('[Work-2] Starting retry of failed syncs');
  
  try {
    // Retry both index and master syncs
    const indexResult = await syncIndexData();
    const masterResult = await syncMasterData();
    
    console.log('[Work-2] ✓ Retry completed:', {
      index: indexResult,
      master: masterResult
    });
    
    return {
      success: true,
      indexSynced: indexResult.synced || 0,
      masterSynced: masterResult.synced || 0
    };
    
  } catch (error) {
    console.error('[Work-2] ✗ Retry failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Gets sync status for dashboard/popup
 * @returns {Promise<Object>} - Sync statistics
 */
export async function getSyncStatus() {
  try {
    const indexRecords = await getAllRecords('Z');
    const masterRecords = await getAllRecords('Y');
    
    const indexPending = indexRecords.filter(r => !r.synced).length;
    const masterPending = masterRecords.filter(r => !r.synced).length;
    
    return {
      index: {
        total: indexRecords.length,
        pending: indexPending,
        synced: indexRecords.length - indexPending
      },
      master: {
        total: masterRecords.length,
        pending: masterPending,
        synced: masterRecords.length - masterPending
      }
    };
  } catch (error) {
    console.error('[Work-2] Failed to get sync status:', error);
    return null;
  }
}