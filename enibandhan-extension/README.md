# Enibandhan Extension - Updated Configuration

## 🎯 Overview
A Chrome Extension for the Enibandhan Bihar Portal that provides:
- **Work 1**: Secure data capture and encryption (for both save and create requests)
- **Work 2**: Automated indexing and scheduled cloud synchronization
- **Work 3**: Real-time conflict detection triggered by 400 errors

## ✨ Key Features
- ✅ **No UI Configuration Required**: Server URLs are pre-configured
- ✅ **Automatic Conflict Detection**: Triggers only on 400 Bad Request errors
- ✅ **Smart Page Range Checking**: Detects overlapping pages in any position
- ✅ **Native Browser Alerts**: Uses standard Chrome alert() for notifications
- ✅ **Dual Request Handling**: Monitors both `/request/save` and `/request/create`

## 📦 Installation

### Load Extension in Chrome
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Select the `/app/enibandhan-extension/` folder
5. Extension icon should appear in Chrome toolbar

### Pre-configured Servers
The following Netlify server URLs are already configured in the extension:

- **Server 1 (Master)**: `https://1comfy-tulumba-6a6c47.netlify.app/.netlify/functions/master-handler`
- **Server 2 (Index)**: `https://2coruscating-peony-79d473.netlify.app/.netlify/functions/index-handler`
- **Server 3 (Conflict)**: `https://3eloquent-youtiao-2760e6.netlify.app/.netlify/functions/conflict-proxy`

**No manual configuration needed!**

## 🏗️ Architecture

### IndexedDB Databases
- **Database X**: Temporary unencrypted storage (immediately wiped after encryption)
- **Database Y**: Encrypted master records (synced at 4 PM)
- **Database Z**: Lightweight index for fast conflict checking (synced at 3 PM)
- **Database T**: Temporary conflict check storage

### Request Handling

#### 1. Save Request (`/request/save`)
- **URL**: `https://enibandhan.bihar.gov.in/digitization/meta-data/v1/request/save`
- **Workflow**: Index data capture
- **Triggers**: Data scraping → Database Y → Database Z

#### 2. Create/Submit Request (`/request/create`)
- **URL**: `https://enibandhan.bihar.gov.in/digitization/meta-data/v1/request/create`
- **Workflow**: Both Index and Master data capture
- **Triggers**: Data scraping → Database Y → Database Z

### Workflows

#### Work 1: Secure Data Capture
**Triggered by**: 200 OK response from `/request/save` OR `/request/create`

1. Scrapes data from portal (District, SRO, User ID, Volume, Book, Deed, Pages)
2. Stores raw data in Database X
3. Requests encryption key from Server 1
4. Encrypts and moves to Database Y (Master)
5. Creates lightweight index in Database Z
6. Wipes Database X

#### Work 2: Indexing & Sync
1. **3:00 PM Daily**: Syncs Database Z to GitHub Index Repo (via Server 2)
2. **4:00 PM Daily**: Syncs Database Y to GitHub Master Repo (via Server 1)
3. **10:00 AM Daily**: Retries any failed syncs from previous day

#### Work 3: Conflict Detection
**Triggered by**: 400 Bad Request error from server

1. Server returns 400 error
2. Extension captures 400 error via `chrome.webRequest`
3. Content script scrapes current form data
4. Checks Database Z (local) for conflicts
   - Matches: District + SRO + Volume Year + Volume No + Book No
   - Checks if ANY page in new range overlaps with existing ranges
5. If not found locally, queries Server 3 (GitHub Index Repo)
6. Displays native browser alert if conflict found

### Page Range Conflict Logic

**How it works:**
```
Example:
Existing Deed: Pages 50-60
User enters: Pages 57-68

Conflict Check:
- District matches? ✓
- SRO matches? ✓
- Volume Year matches? ✓
- Volume No matches? ✓
- Book No matches? ✓
- Page overlap? 
  - 57 is between 50-60 ✓
  - Result: CONFLICT DETECTED
```

**Overlap Detection Scenarios:**
- ✓ New range starts within existing range (57-68 vs 50-60)
- ✓ New range ends within existing range (45-52 vs 50-60)
- ✓ New range completely contains existing range (40-70 vs 50-60)
- ✓ New range is completely contained (52-58 vs 50-60)

## 🔧 File Structure
```
enibandhan-extension/
├── manifest.json              # Extension configuration (no popup/options)
├── background.js              # Service worker (handles requests & alarms)
├── /core                      # Shared utilities
│   ├── encryption.js          # CryptoJS AES-256
│   ├── db-manager.js          # IndexedDB operations
│   └── api-client.js          # Pre-configured Netlify URLs
├── /content-scripts           # DOM scraping
│   └── scraper.js             # Native alert() for conflicts
├── /work-1-capture            # Data capture workflow
│   ├── capture.js             # Handles both save & create
│   └── listeners.js           # Monitors 200 OK responses
├── /work-2-sync               # Scheduled syncing
│   ├── scheduler.js
│   └── sync-manager.js
├── /work-3-conflict           # Conflict detection
│   ├── conflict-checker.js    # Enhanced page range logic
│   └── error-handler.js       # 400 error trigger
└── /ui                        # Disabled UI files
    ├── popup-disabled.html
    └── settings-disabled.html
```

## 🔐 Security
- All sensitive data is encrypted with AES-256 before cloud storage
- Encryption keys are never stored locally
- Database X is wiped immediately after encryption
- Netlify functions use environment variables for GitHub tokens
- No API keys are hardcoded (uses server-side storage)

## 🐛 Debugging

### Check Background Console
1. Go to `chrome://extensions/`
2. Find "Enibandhan Extension"
3. Click "service worker" or "Inspect views: background page"
4. Check console for logs: `[Enibandhan] ...`

### Check IndexedDB
1. Open DevTools (F12) on `enibandhan.bihar.gov.in`
2. Go to Application tab → IndexedDB
3. Look for: `EnibandhanDB_X`, `EnibandhanDB_Y`, `EnibandhanDB_Z`, `EnibandhanDB_T`

### Check Network Requests
1. Open DevTools (F12) on portal
2. Go to Network tab
3. Look for requests to:
   - `/request/save` (should show 200 OK or 400 error)
   - `/request/create` (should show 200 OK or 400 error)

### Common Issues

**Conflict alert not showing:**
- Check if 400 error is being triggered in Network tab
- Verify content script is loaded (check Console for `[Enibandhan Scraper] Content script loaded`)
- Check background console for conflict check logs

**Data not syncing:**
- Check alarms are set: Go to background console, look for `[Enibandhan] Alarm triggered`
- Verify server URLs are accessible
- Check Database Y and Z for unsynced records

## 📝 Testing

### Test Conflict Detection
1. Navigate to: `https://enibandhan.bihar.gov.in/digitize/metaDataCreate?Y3NyZnRva2Vu=[token]`
2. Fill in form with existing page range
3. Try to submit
4. Server returns 400 error
5. Extension should show native alert with conflict details

### Test Data Capture
1. Fill in form with new data
2. Click "Save" or "Submit"
3. Check background console for workflow logs
4. Verify data appears in IndexedDB

## 🌐 Server Deployment
This extension requires 3 Netlify functions to be deployed:
- **Server 1**: See `/app/server-1-master/README.md`
- **Server 2**: See `/app/server-2-index/README.md`
- **Server 3**: See `/app/server-3-proxy/README.md`

## 📄 License
MIT License - See LICENSE file for details

---

**Version**: 1.0.0  
**Last Updated**: 2025  
**Status**: Production Ready ✅
