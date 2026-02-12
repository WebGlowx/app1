# 🚀 Quick Start Guide - Enibandhan Extension

## 📦 Installation (5 minutes)

### Step 1: Open Chrome Extensions
1. Open Google Chrome browser
2. Type in address bar: `chrome://extensions/`
3. Press Enter

### Step 2: Enable Developer Mode
1. Look for "Developer mode" toggle in top-right corner
2. Click to enable it (should turn blue/on)

### Step 3: Load Extension
1. Click "Load unpacked" button (appears after enabling Developer mode)
2. Navigate to your project folder
3. Select: `/app/enibandhan-extension/`
4. Click "Select Folder"

### Step 4: Verify Installation
✅ Extension icon should appear in Chrome toolbar  
✅ Extension name: "Enibandhan Extension"  
✅ Status should show: "Service worker (active)"

---

## 🧪 Testing the Extension

### Test 1: Verify Background Service is Running

1. Go to `chrome://extensions/`
2. Find "Enibandhan Extension"
3. Click blue text: "service worker" or "Inspect views: background page"
4. Console should show:
   ```
   [Enibandhan] Background service worker started
   [Enibandhan] All listeners initialized
   ```

✅ **Pass**: Console shows initialization messages  
❌ **Fail**: Check for errors in console

---

### Test 2: Verify Content Script Loads

1. Navigate to: `https://enibandhan.bihar.gov.in/digitize/metaDataCreate?Y3NyZnRva2Vu=[token]`
   - Replace `[token]` with actual token from portal
2. Open DevTools (F12)
3. Check Console tab
4. Should see:
   ```
   [Enibandhan Scraper] Content script loaded
   [Scraper] Initializing...
   [Scraper] Form submission interception active
   [Scraper] All monitors active
   ```

✅ **Pass**: Content script loads successfully  
❌ **Fail**: Check manifest.json content_scripts matches

---

### Test 3: Test Data Capture (Save Request)

1. On portal, fill in form with test data:
   - District: Select any
   - SRO: Select any
   - Volume Year/No: Enter test values
   - Book No: Enter test value
   - Start Page: 10
   - End Page: 20
   
2. Click **"Save"** button

3. Check background console for:
   ```
   [Work-1 Listener] ✓ Save successful (200 OK)
   [Work-1] Starting data capture workflow
   [Work-1] Request type: save
   [Work-1] Step 1: Saving to Database X
   [Work-1] Step 2: Requesting encryption key
   [Work-1] Step 3: Encrypting data
   [Work-1] Step 4: Saving to Database Y
   [Work-1] Step 5: Creating index in Database Z
   [Work-1] ✓ Workflow completed successfully
   ```

4. Verify data in IndexedDB:
   - Open DevTools (F12)
   - Go to: Application → Storage → IndexedDB
   - Check databases:
     - `EnibandhanDB_Y` → Should have 1 record (encrypted)
     - `EnibandhanDB_Z` → Should have 1 record (index)
     - `EnibandhanDB_X` → Should be empty (wiped after encryption)

✅ **Pass**: Data captured and stored correctly  
❌ **Fail**: Check server connectivity and API responses

---

### Test 4: Test Conflict Detection (400 Error)

#### Setup:
First, create a deed with known page range (e.g., pages 50-60)

#### Test Scenario:
1. On portal, fill in form with **same volume/book** but overlapping pages:
   - District: Same as before
   - SRO: Same as before
   - Volume: Same as before
   - Book: Same as before
   - Start Page: **57** (overlaps with 50-60)
   - End Page: **68**

2. Click "Submit" or "Save"

3. Server should return **400 Bad Request**

4. Check background console:
   ```
   [Work-3 Error Handler] 400 Bad Request detected
   [Work-3 Error Handler] ⚠ Triggering conflict check
   ```

5. Check page console:
   ```
   [Scraper] Message received from background: TRIGGER_CONFLICT_CHECK
   [Scraper] 400 error detected, performing conflict check
   [Work-3] Starting conflict check for: {...}
   [DB-Z] Checking conflict for pages 57-68
   [DB-Z] Overlap detected: New (57-68) conflicts with Deed...
   [Work-3] ⚠ Local conflict found
   ```

6. **Native browser alert should appear**:
   ```
   ⚠️ CONFLICT DETECTED!

   Deed No: [deed number]
   Pages: 50 - 60

   District: [district]
   SRO: [sro]
   Volume: [year]/[no]
   Book: [book no]

   Found in local database

   This page range is already in use. Please check your entries.
   ```

✅ **Pass**: Conflict detected and alert shown  
❌ **Fail**: Check 400 error is actually triggered, verify network tab

---

### Test 5: Test No Conflict (Valid Pages)

1. Fill in form with **non-overlapping** pages:
   - Same volume/book as before
   - Start Page: **70** (doesn't overlap with 50-60)
   - End Page: **80**

2. Check console:
   ```
   [DB-Z] No local conflict
   [Work-3] ✓ No conflict detected
   ```

3. **No alert should appear**

✅ **Pass**: No false positives  
❌ **Fail**: Check conflict logic in db-manager.js

---

### Test 6: Verify Server URLs are Hardcoded

1. Open background console
2. Type: `chrome.storage.sync.get(['server1Url', 'server2Url', 'server3Url'], console.log)`
3. Should return empty or undefined (storage not used anymore)

4. Check `/core/api-client.js` file:
   ```javascript
   const SERVER_URLS = {
     server1: 'https://1comfy-tulumba-6a6c47.netlify.app/...',
     server2: 'https://2coruscating-peony-79d473.netlify.app/...',
     server3: 'https://3eloquent-youtiao-2760e6.netlify.app/...'
   };
   ```

✅ **Pass**: URLs are hardcoded  
❌ **Fail**: Check api-client.js was updated correctly

---

### Test 7: Verify UI is Disabled

1. Click extension icon in Chrome toolbar
2. Should see minimal page: "Extension is running in background"
3. No settings or configuration options available

4. Right-click extension icon → Options
5. Should see: "No user configuration needed"

✅ **Pass**: No functional UI  
❌ **Fail**: Check manifest.json removed action and options_page

---

## 🔍 Common Issues & Solutions

### Issue 1: Content Script Not Loading
**Symptoms**: No logs in page console  
**Solution**: 
- Check URL matches pattern in manifest.json
- Reload extension: `chrome://extensions/` → Click reload icon
- Refresh portal page

### Issue 2: 400 Error Not Triggering Conflict Check
**Symptoms**: 400 in Network tab but no alert  
**Solution**:
- Check background console for error handlers
- Verify `chrome.webRequest` permission in manifest
- Check content script is loaded

### Issue 3: Alert Not Showing
**Symptoms**: Conflict detected in console but no alert  
**Solution**:
- Check browser popup blocker settings
- Verify native `alert()` is being called
- Check for JavaScript errors in page console

### Issue 4: Data Not Saving to IndexedDB
**Symptoms**: No records in Database Y or Z  
**Solution**:
- Check server connectivity (Server 1 for encryption key)
- Verify network requests are successful (200 OK)
- Check for errors in background console

---

## 📊 Success Criteria

✅ Extension loads without errors  
✅ Content script initializes on portal  
✅ Save/Create requests are captured (200 OK)  
✅ Data is encrypted and stored in Database Y  
✅ Index is created in Database Z  
✅ 400 errors trigger conflict checking  
✅ Overlapping page ranges are detected  
✅ Native browser alert displays conflict info  
✅ No UI configuration needed  

---

## 🎯 Next Steps

1. ✅ **Complete Installation**: Follow steps above
2. ✅ **Run All Tests**: Verify each test passes
3. ✅ **Test on Real Portal**: Use actual credentials and data
4. ✅ **Monitor Scheduled Syncs**: Wait for 3 PM, 4 PM, 10 AM alarms
5. ✅ **Verify GitHub Syncing**: Check if data reaches GitHub repos

---

## 📞 Support

**Check Logs**: Background console (`chrome://extensions/` → service worker)  
**Check Storage**: DevTools → Application → IndexedDB  
**Check Network**: DevTools → Network tab  

**Common Log Prefixes**:
- `[Enibandhan]` - Main background service
- `[Scraper]` - Content script
- `[Work-1]` - Data capture workflow
- `[Work-3]` - Conflict detection
- `[DB-X/Y/Z/T]` - Database operations
- `[API]` - Server communication

---

**Installation Time**: ~5 minutes  
**Testing Time**: ~15 minutes  
**Total Setup Time**: ~20 minutes  

✅ **Ready to Deploy!**
