// API Client for communicating with Netlify servers
// Server URLs are pre-configured

const SERVER_URLS = {
  server1: 'https://1comfy-tulumba-6a6c47.netlify.app/.netlify/functions/master-handler',
  server2: 'https://2coruscating-peony-79d473.netlify.app/.netlify/functions/index-handler',
  server3: 'https://3eloquent-youtiao-2760e6.netlify.app/.netlify/functions/conflict-proxy'
};

/**
 * Gets the configured server URLs
 * @returns {Object} - Server URLs
 */
function getServerUrls() {
  return SERVER_URLS;
}

/**
 * Requests an encryption key from Server 1
 * @returns {Promise<String>} - Encryption key
 */
export async function requestEncryptionKey() {
  try {
    const urls = getServerUrls();
    console.log('[API] Requesting encryption key from Server 1');
    
    const response = await fetch(urls.server1, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'REQUEST_KEY' })
    });
    
    if (!response.ok) {
      throw new Error(`Server 1 responded with ${response.status}`);
    }
    
    const data = await response.json();
    console.log('[API] Encryption key received');
    return data.encryptionKey;
  } catch (error) {
    console.error('[API] Failed to request encryption key:', error);
    throw error;
  }
}

/**
 * Sends encrypted master data to Server 1 for GitHub Master Repo push
 * @param {Array} records - Array of encrypted records from Database Y
 * @returns {Promise<Object>} - Response from server
 */
export async function syncMasterData(records) {
  try {
    const urls = getServerUrls();
    console.log(`[API] Syncing ${records.length} master records to Server 1`);
    
    const response = await fetch(urls.server1, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'SYNC_MASTER',
        records: records
      })
    });
    
    if (!response.ok) {
      throw new Error(`Server 1 sync failed with ${response.status}`);
    }
    
    const result = await response.json();
    console.log('[API] Master data synced successfully:', result);
    return result;
  } catch (error) {
    console.error('[API] Master data sync failed:', error);
    throw error;
  }
}

/**
 * Sends index data to Server 2 for GitHub Index Repo push
 * @param {Array} indexRecords - Array of lightweight index records from Database Z
 * @returns {Promise<Object>} - Response from server
 */
export async function syncIndexData(indexRecords) {
  try {
    const urls = getServerUrls();
    console.log(`[API] Syncing ${indexRecords.length} index records to Server 2`);
    
    const response = await fetch(urls.server2, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'SYNC_INDEX',
        records: indexRecords
      })
    });
    
    if (!response.ok) {
      throw new Error(`Server 2 sync failed with ${response.status}`);
    }
    
    const result = await response.json();
    console.log('[API] Index data synced successfully:', result);
    return result;
  } catch (error) {
    console.error('[API] Index data sync failed:', error);
    throw error;
  }
}

/**
 * Queries Server 3 for conflict checking (read-only GitHub Index Repo access)
 * @param {Object} params - { district, sro, volumeYear, volumeNo, bookNo, startPage, endPage }
 * @returns {Promise<Object|null>} - Conflicting record or null
 */
export async function checkRemoteConflict(params) {
  try {
    const urls = getServerUrls();
    console.log('[API] Checking remote conflict via Server 3');
    
    const response = await fetch(urls.server3, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'CHECK_CONFLICT',
        params: params
      })
    });
    
    if (!response.ok) {
      throw new Error(`Server 3 responded with ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.conflict) {
      console.log('[API] Remote conflict found:', result.conflictingRecord);
      return result.conflictingRecord;
    }
    
    console.log('[API] No remote conflict');
    return null;
  } catch (error) {
    console.error('[API] Remote conflict check failed:', error);
    throw error;
  }
}

/**
 * Health check for all servers
 * @returns {Promise<Object>} - Status of all servers
 */
export async function checkServerHealth() {
  const urls = getServerUrls();
  const results = {};
  
  for (const [name, url] of Object.entries(urls)) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'HEALTH_CHECK' })
      });
      results[name] = response.ok ? 'Online' : 'Error';
    } catch (error) {
      results[name] = 'Offline';
    }
  }
  
  return results;
}
