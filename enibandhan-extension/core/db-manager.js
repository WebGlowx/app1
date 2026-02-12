// IndexedDB Manager for Databases X, Y, Z, and T

const DB_VERSION = 2; // Increased to trigger upgrade and create object stores
const DB_NAMES = {
  X: 'EnibandhanDB_X', // Temporary unencrypted storage
  Y: 'EnibandhanDB_Y', // Encrypted master records
  Z: 'EnibandhanDB_Z', // Lightweight index
  T: 'EnibandhanDB_T'  // Temporary conflict check storage
};

/**
 * Opens an IndexedDB database
 * @param {String} dbName - Name of the database (X, Y, Z, or T)
 * @returns {Promise<IDBDatabase>} - Database instance
 */
function openDatabase(dbName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAMES[dbName], DB_VERSION);
    
    request.onerror = () => {
      console.error(`[DB-${dbName}] Open error:`, request.error);
      reject(request.error);
    };
    
    request.onsuccess = () => {
      const db = request.result;
      console.log(`[DB-${dbName}] Opened successfully, object stores:`, Array.from(db.objectStoreNames));
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      console.log(`[DB-${dbName}] Upgrade needed, version:`, event.oldVersion, '→', event.newVersion);
      const db = event.target.result;
      
      // Create object stores based on database type
      if (!db.objectStoreNames.contains('records')) {
        console.log(`[DB-${dbName}] Creating 'records' object store`);
        const store = db.createObjectStore('records', { keyPath: 'id', autoIncrement: true });
        
        // Indexes for efficient querying
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('district', 'district', { unique: false });
        store.createIndex('sro', 'sro', { unique: false });
        store.createIndex('volumeYear', 'volumeYear', { unique: false });
        store.createIndex('synced', 'synced', { unique: false });
        
        // Compound index for conflict checking
        store.createIndex('conflictKey', ['district', 'sro', 'volumeYear', 'volumeNo', 'bookNo'], { unique: false });
        
        console.log(`[DB-${dbName}] Object store 'records' created with indexes`);
      }
    };
  });
}

/**
 * Saves data to a specific database
 * @param {String} dbName - Database name (X, Y, Z, or T)
 * @param {Object} data - Data to save
 * @returns {Promise<Number>} - Record ID
 */
export async function saveToDatabase(dbName, data) {
  try {
    const db = await openDatabase(dbName);
    const transaction = db.transaction(['records'], 'readwrite');
    const store = transaction.objectStore('records');
    
    const dataWithTimestamp = {
      ...data,
      timestamp: new Date().toISOString(),
      synced: false
    };
    
    const request = store.add(dataWithTimestamp);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        console.log(`[DB-${dbName}] Record saved with ID:`, request.result);
        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`[DB-${dbName}] Save failed:`, error);
    throw error;
  }
}

/**
 * Retrieves all records from a database
 * @param {String} dbName - Database name
 * @param {Object} filter - Optional filter criteria
 * @returns {Promise<Array>} - Array of records
 */
export async function getAllRecords(dbName, filter = {}) {
  try {
    const db = await openDatabase(dbName);
    const transaction = db.transaction(['records'], 'readonly');
    const store = transaction.objectStore('records');
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        let records = request.result;
        
        // Apply filters
        if (Object.keys(filter).length > 0) {
          records = records.filter(record => {
            return Object.keys(filter).every(key => record[key] === filter[key]);
          });
        }
        
        console.log(`[DB-${dbName}] Retrieved ${records.length} records`);
        resolve(records);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`[DB-${dbName}] Retrieval failed:`, error);
    throw error;
  }
}

/**
 * Checks for conflict in Database Z (Index)
 * @param {Object} params - { district, sro, volumeYear, volumeNo, bookNo, startPage, endPage }
 * @returns {Promise<Object|null>} - Conflicting record or null
 */
export async function checkLocalConflict(params) {
  try {
    const { district, sro, volumeYear, volumeNo, bookNo, startPage, endPage } = params;
    
    // First filter by matching context (district, sro, volume, book)
    const records = await getAllRecords('Z', { 
      district, 
      sro, 
      volumeYear, 
      volumeNo,
      bookNo 
    });
    
    console.log(`[DB-Z] Checking conflict for pages ${startPage}-${endPage} against ${records.length} records`);
    
    // Check for page range overlap
    // Any page in the new range should not exist in any existing range
    const conflict = records.find(record => {
      const recordStart = parseInt(record.startPage);
      const recordEnd = parseInt(record.endPage);
      const newStart = parseInt(startPage);
      const newEnd = parseInt(endPage);
      
      // Check if ANY page number from new range overlaps with existing range
      // This covers all cases: start, middle, end, or full overlap
      const hasOverlap = (
        // New range starts within existing range
        (newStart >= recordStart && newStart <= recordEnd) ||
        // New range ends within existing range
        (newEnd >= recordStart && newEnd <= recordEnd) ||
        // New range completely contains existing range
        (newStart <= recordStart && newEnd >= recordEnd)
      );
      
      if (hasOverlap) {
        console.log(`[DB-Z] Overlap detected: New (${newStart}-${newEnd}) conflicts with Deed ${record.deedNo || 'N/A'} (${recordStart}-${recordEnd})`);
      }
      
      return hasOverlap;
    });
    
    if (conflict) {
      console.log('[DB-Z] Local conflict found:', conflict);
      return conflict;
    }
    
    console.log('[DB-Z] No local conflict');
    return null;
  } catch (error) {
    console.error('[DB-Z] Conflict check failed:', error);
    throw error;
  }
}

/**
 * Clears all records from a database
 * @param {String} dbName - Database name
 * @returns {Promise<void>}
 */
export async function clearDatabase(dbName) {
  try {
    const db = await openDatabase(dbName);
    const transaction = db.transaction(['records'], 'readwrite');
    const store = transaction.objectStore('records');
    const request = store.clear();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        console.log(`[DB-${dbName}] Database cleared`);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`[DB-${dbName}] Clear failed:`, error);
    throw error;
  }
}

/**
 * Deletes a specific record by ID
 * @param {String} dbName - Database name
 * @param {Number} recordId - Record ID
 * @returns {Promise<void>}
 */
export async function deleteRecord(dbName, recordId) {
  try {
    const db = await openDatabase(dbName);
    const transaction = db.transaction(['records'], 'readwrite');
    const store = transaction.objectStore('records');
    const request = store.delete(recordId);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        console.log(`[DB-${dbName}] Record ${recordId} deleted`);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`[DB-${dbName}] Delete failed:`, error);
    throw error;
  }
}

/**
 * Updates a record's sync status
 * @param {String} dbName - Database name
 * @param {Number} recordId - Record ID
 * @returns {Promise<void>}
 */
export async function markAsSynced(dbName, recordId) {
  try {
    const db = await openDatabase(dbName);
    const transaction = db.transaction(['records'], 'readwrite');
    const store = transaction.objectStore('records');
    
    const getRequest = store.get(recordId);
    
    return new Promise((resolve, reject) => {
      getRequest.onsuccess = () => {
        const record = getRequest.result;
        if (record) {
          record.synced = true;
          record.syncedAt = new Date().toISOString();
          
          const updateRequest = store.put(record);
          updateRequest.onsuccess = () => {
            console.log(`[DB-${dbName}] Record ${recordId} marked as synced`);
            resolve();
          };
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          reject(new Error('Record not found'));
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  } catch (error) {
    console.error(`[DB-${dbName}] Mark synced failed:`, error);
    throw error;
  }
}