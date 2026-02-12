// Content Script: DOM Scraper for Enibandhan Portal
// Extracts data from specific DOM elements and handles conflict checking

console.log('[Enibandhan Scraper] Content script loaded');

/**
 * Extracts text content from a DOM element
 * @param {String} selector - CSS selector or ID
 * @returns {String} - Text content or empty string
 */
function extractText(selector) {
  // Try as ID first
  let element = document.getElementById(selector);
  
  // If not found, try as querySelector
  if (!element) {
    element = document.querySelector(selector);
  }
  
  if (element) {
    return element.innerText?.trim() || element.textContent?.trim() || '';
  }
  
  return '';
}

/**
 * Extracts input value from a form field
 * @param {String} id - Input element ID
 * @returns {String} - Input value
 */
function extractInputValue(id) {
  const element = document.getElementById(id);
  return element ? element.value.trim() : '';
}

/**
 * Scrapes all required data from the portal
 * @returns {Object} - Complete scraped data
 */
function scrapePortalData() {
  const data = {
    // Identity & Context
    userId: extractText('hdr'),
    district: extractText('volume_edit_district'),
    sro: extractText('volume_edit_sro'),
    
    // Volume Information
    volumeYear: extractText('volume_year'),
    volumeNo: extractText('volume_no'),
    bookNo: extractText('book_no'),
    
    // Deed Information (if available)
    deedNo: extractInputValue('deed_no') || extractText('deed_no'),
    
    // Page Range
    startPage: extractInputValue('start_page'),
    endPage: extractInputValue('end_page'),
    
    // Metadata
    scrapedAt: new Date().toISOString(),
    portalUrl: window.location.href
  };
  
  console.log('[Scraper] Data scraped:', data);
  return data;
}

/**
 * Shows a conflict alert using native browser alert
 * @param {Object} conflictingRecord - The conflicting record details
 * @param {String} source - 'local' or 'remote'
 */
function showConflictAlert(conflictingRecord, source) {
  const deedInfo = conflictingRecord.deedNo 
    ? `Deed No: ${conflictingRecord.deedNo}` 
    : 'Unknown Deed';
  
  const pageInfo = `Pages: ${conflictingRecord.startPage} - ${conflictingRecord.endPage}`;
  
  const sourceInfo = source === 'local' 
    ? 'Found in local database' 
    : 'Found in server database';
  
  const message = `⚠️ CONFLICT DETECTED!\n\n${deedInfo}\n${pageInfo}\n\nDistrict: ${conflictingRecord.district}\nSRO: ${conflictingRecord.sro}\nVolume: ${conflictingRecord.volumeYear}/${conflictingRecord.volumeNo}\nBook: ${conflictingRecord.bookNo || 'N/A'}\n\n${sourceInfo}\n\nThis page range is already in use. Please check your entries.`;
  
  // Use native browser alert
  alert(message);
  
  console.log('[Scraper] Conflict alert shown to user');
}

/**
 * Performs conflict check by sending data to background
 * @param {Boolean} showLoading - Whether to show loading message
 */
async function performConflictCheck(showLoading = false) {
  const data = scrapePortalData();
  
  // Validate page range
  if (!data.startPage || !data.endPage) {
    console.log('[Scraper] Page range incomplete, skipping conflict check');
    return;
  }
  
  if (showLoading) {
    console.log('[Scraper] Checking for conflicts...');
  }
  
  // Send to background for conflict check
  chrome.runtime.sendMessage({
    type: 'CHECK_CONFLICT',
    data: data
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('[Scraper] Error checking conflict:', chrome.runtime.lastError);
      return;
    }
    
    if (response?.conflict) {
      console.log('[Scraper] Conflict detected:', response);
      showConflictAlert(response.conflictingRecord, response.source);
    } else if (response?.error) {
      console.error('[Scraper] Conflict check error:', response.error);
    } else {
      console.log('[Scraper] No conflict found');
    }
  });
}

/**
 * Intercepts form submission to capture data (Work 1)
 */
function interceptFormSubmission() {
  // Monitor for successful saves and creates
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const response = await originalFetch.apply(this, args);
    
    // Check if this is a save or create request
    const url = args[0];
    if (typeof url === 'string') {
      if (url.includes('/request/save') && response.ok) {
        console.log('[Scraper] Save detected (200 OK), scraping data for Index');
        
        const scrapedData = scrapePortalData();
        
        // Send to background for processing (Work 1 - Index only)
        chrome.runtime.sendMessage({
          type: 'DATA_SCRAPED',
          data: { ...scrapedData, requestType: 'save' }
        });
      }
      
      if (url.includes('/request/create') && response.ok) {
        console.log('[Scraper] Create/Submit detected (200 OK), scraping data for Index & Master');
        
        const scrapedData = scrapePortalData();
        
        // Send to background for processing (Work 1 - Both Index and Master)
        chrome.runtime.sendMessage({
          type: 'DATA_SCRAPED',
          data: { ...scrapedData, requestType: 'create' }
        });
      }
    }
    
    return response;
  };
  
  console.log('[Scraper] Form submission interception active');
}

/**
 * Listen for messages from background (e.g., 400 error trigger)
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[Scraper] Message received from background:', request.type);
  
  if (request.type === 'TRIGGER_CONFLICT_CHECK') {
    console.log('[Scraper] 400 error detected, performing conflict check');
    performConflictCheck(true);
    sendResponse({ status: 'checking' });
  }
  
  if (request.type === 'SAVE_CONFIRMED') {
    console.log('[Scraper] Save confirmed by background');
    sendResponse({ status: 'acknowledged' });
  }
});

// Initialize all monitoring
function init() {
  console.log('[Scraper] Initializing...');
  
  // Wait for page to be fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
    return;
  }
  
  interceptFormSubmission();
  
  console.log('[Scraper] All monitors active');
}

init();
