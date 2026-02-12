// Background Service Worker for Enibandhan Extension
import { initializeScheduler } from './work-2-sync/scheduler.js';
import { handleWebRequest } from './work-1-capture/listeners.js';
import { handle400Error, processConflictCheck } from './work-3-conflict/error-handler.js';

console.log('[Enibandhan] Background service worker started');

// Initialize schedulers for Work 2 (3PM, 4PM, 10AM sync)
initializeScheduler();

// Listen for successful web requests (200 OK)
chrome.webRequest.onCompleted.addListener(
  handleWebRequest,
  { urls: [
    'https://enibandhan.bihar.gov.in/digitization/meta-data/v1/request/save',
    'https://enibandhan.bihar.gov.in/digitization/meta-data/v1/request/create'
  ] },
  ['responseHeaders']
);

// Listen for 400 errors to trigger conflict checking
chrome.webRequest.onErrorOccurred.addListener(
  handle400Error,
  { urls: [
    'https://enibandhan.bihar.gov.in/digitization/meta-data/v1/request/save',
    'https://enibandhan.bihar.gov.in/digitization/meta-data/v1/request/create'
  ] }
);

// Also listen for completed requests with error status codes
chrome.webRequest.onCompleted.addListener(
  (details) => {
    // Check if response is 400
    if (details.statusCode === 400) {
      console.log('[Enibandhan] 400 status detected via onCompleted');
      handle400Error(details);
    }
  },
  { urls: [
    'https://enibandhan.bihar.gov.in/digitization/meta-data/v1/request/save',
    'https://enibandhan.bihar.gov.in/digitization/meta-data/v1/request/create'
  ] },
  ['responseHeaders']
);

// Message handler for communication from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[Enibandhan] Message received:', request.type);
  
  if (request.type === 'DATA_SCRAPED') {
    // Forward to Work 1 capture
    import('./work-1-capture/capture.js').then(module => {
      module.processScrapedData(request.data).then(sendResponse);
    });
    return true; // Keep channel open for async response
  }
  
  if (request.type === 'CHECK_CONFLICT') {
    // Forward to Work 3 conflict checker
    processConflictCheck(request.data).then(sendResponse);
    return true;
  }
  
  if (request.type === 'GET_SETTINGS') {
    // No settings needed anymore, but keeping for compatibility
    sendResponse({ configured: true });
    return true;
  }
});

// Handle alarms for scheduled syncing
chrome.alarms.onAlarm.addListener((alarm) => {
  console.log('[Enibandhan] Alarm triggered:', alarm.name);
  
  import('./work-2-sync/sync-manager.js').then(module => {
    if (alarm.name === 'SYNC_INDEX_3PM') {
      module.syncIndexData();
    } else if (alarm.name === 'SYNC_MASTER_4PM') {
      module.syncMasterData();
    } else if (alarm.name === 'SYNC_RETRY_10AM') {
      module.retryFailedSyncs();
    }
  });
});

console.log('[Enibandhan] All listeners initialized');
