// Work 3: Error Handler
// Handles 400 Bad Request errors and triggers conflict checking

import { checkConflict } from './conflict-checker.js';

/**
 * Handles 400 errors from web requests
 * This is the ONLY trigger for conflict checking
 * @param {Object} details - Request details from chrome.webRequest API
 */
export async function handle400Error(details) {
  console.log('[Work-3 Error Handler] 400 Bad Request detected:', details.url);
  
  // Only process if it's a create or save request
  if (!details.url.includes('/request/save') && !details.url.includes('/request/create')) {
    return;
  }
  
  console.log('[Work-3 Error Handler] ⚠ Triggering conflict check due to 400 error');
  
  // Notify content script to scrape current form data and check for conflicts
  try {
    await chrome.tabs.sendMessage(details.tabId, {
      type: 'TRIGGER_CONFLICT_CHECK',
      reason: '400_ERROR',
      url: details.url,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Work-3 Error Handler] Failed to notify content script:', error);
  }
}

/**
 * Processes a conflict check request from content script
 * @param {Object} data - Scraped form data
 * @returns {Promise<Object>} - Conflict check result
 */
export async function processConflictCheck(data) {
  console.log('[Work-3 Error Handler] Processing conflict check for scraped data');
  
  try {
    const result = await checkConflict(data);
    return result;
  } catch (error) {
    console.error('[Work-3 Error Handler] Conflict check processing failed:', error);
    return {
      conflict: false,
      error: error.message
    };
  }
}
