// Work 1: Web Request Listeners
// Listens for 200 OK responses from portal save and create endpoints

/**
 * Handles completed web requests (200 OK)
 * @param {Object} details - Request details from chrome.webRequest API
 */
export function handleWebRequest(details) {
  console.log('[Work-1 Listener] Web request completed:', details.url, 'Status:', details.statusCode);
  
  // Check if this is a successful save (Index only)
  if (details.statusCode === 200 && details.url.includes('/request/save')) {
    console.log('[Work-1 Listener] ✓ Save successful (200 OK) - Index workflow');
    
    // Send a message to content script to confirm
    chrome.tabs.sendMessage(details.tabId, {
      type: 'SAVE_CONFIRMED',
      requestType: 'save',
      url: details.url,
      timestamp: new Date().toISOString()
    }).catch(error => {
      console.warn('[Work-1 Listener] Could not notify content script:', error);
    });
  }
  
  // Check if this is a successful create/submit (Both Index and Master)
  if (details.statusCode === 200 && details.url.includes('/request/create')) {
    console.log('[Work-1 Listener] ✓ Create/Submit successful (200 OK) - Index & Master workflow');
    
    // Send a message to content script to confirm
    chrome.tabs.sendMessage(details.tabId, {
      type: 'SAVE_CONFIRMED',
      requestType: 'create',
      url: details.url,
      timestamp: new Date().toISOString()
    }).catch(error => {
      console.warn('[Work-1 Listener] Could not notify content script:', error);
    });
  }
}
