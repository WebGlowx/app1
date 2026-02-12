# Enibandhan Extension - Complete Project

## 📚 Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Quick Start](#quick-start)
4. [Deployment Guide](#deployment-guide)
5. [Usage](#usage)
6. [Development](#development)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

The Enibandhan Extension is a comprehensive Chrome Extension designed for the Bihar Enibandhan Portal. It provides:

### Three Core Workflows

**Work 1: Secure Data Capture**
- Automatically scrapes data from portal on successful save
- Encrypts data using AES-256 with keys from Netlify Server 1
- Stores in local IndexedDB with double-layer security
- Immediately wipes unencrypted temporary storage

**Work 2: Scheduled Synchronization**
- **3:00 PM**: Syncs lightweight index data to GitHub (via Server 2)
- **4:00 PM**: Syncs encrypted master data to GitHub (via Server 1)
- **10:00 AM**: Retries any failed syncs from previous day

**Work 3: Real-Time Conflict Detection**
- Monitors page input fields as user types
- Context-aware checking (District + SRO + Volume + Pages)
- Hierarchical check: Local IndexedDB → Remote GitHub
- Auto-triggers on 400 errors from portal
- Shows visual alerts for conflicts

---

## 🏗️ Architecture

### Data Flow

```
Portal Save (200 OK)
       ↓
[Scraper] Extracts data
       ↓
[Work 1] Database X (temp) → Encrypt → Database Y → Wipe X
       ↓
[Work 2] Extract to Database Z (index)
       ↓
Scheduled Sync:
  3 PM: Database Z → Server 2 → GitHub Index Repo
  4 PM: Database Y → Server 1 → GitHub Master Repo

User Types Pages
       ↓
[Work 3] Database T (temp) → Check Z → Check Server 3
       ↓
Conflict Alert (if found)
```

### Components

#### Extension
- **Manifest V3** with Service Workers
- **4 IndexedDB Databases**: X (temp), Y (master), Z (index), T (conflict)
- **Modular structure**: Core, Work-1, Work-2, Work-3, UI
- **CryptoJS** for AES-256 encryption

#### Netlify Servers

**Server 1 (Master)**
- Provides encryption keys
- Applies master key (double encryption)
- Pushes to GitHub Master Repo

**Server 2 (Index)**
- Formats lightweight index data
- Pushes to GitHub Index Repo
- Manages scheduled syncs

**Server 3 (Proxy)**
- Read-only GitHub access
- Fast conflict checking
- No write operations

---

## 🚀 Quick Start

### Prerequisites
- Chrome browser (version 88+)
- Netlify account
- GitHub account with 2 private repositories
- Node.js 16+ (for Netlify CLI)

### Step 1: Deploy Netlify Functions

```bash
# Deploy Server 1
cd server-1-master
npm install
netlify deploy --prod

# Deploy Server 2
cd ../server-2-index
npm install
netlify deploy --prod

# Deploy Server 3
cd ../server-3-proxy
npm install
netlify deploy --prod
```

See individual server README files for detailed deployment instructions:
- [Server 1 README](./server-1-master/README.md)
- [Server 2 README](./server-2-index/README.md)
- [Server 3 README](./server-3-proxy/README.md)

### Step 2: Load Extension

```bash
1. Open Chrome: chrome://extensions/
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select: /enibandhan-extension/ folder
5. Extension should appear in toolbar
```

### Step 3: Configure Settings

```bash
1. Click extension icon
2. Click "Settings"
3. Enter your 3 Netlify function URLs
4. Click "Test Connection"
5. Click "Save Settings"
```

---

## 📚 Deployment Guide

### GitHub Repositories Setup

#### 1. Master Repository
```bash
# Create private repo
gh repo create enibandhan-master --private

# Or via GitHub web:
# https://github.com/new
# Name: enibandhan-master
# Private: Yes
```

#### 2. Index Repository
```bash
# Create private repo
gh repo create enibandhan-index --private

# Or via GitHub web:
# https://github.com/new
# Name: enibandhan-index
# Private: Yes
```

#### 3. Generate GitHub Token
```bash
1. Go to: https://github.com/settings/tokens
2. Generate new token (classic)
3. Select scopes: repo (all)
4. Copy token immediately (won't be shown again)
```

### Environment Variables

#### Server 1 (Master)
```bash
GITHUB_ACCESS_TOKEN=ghp_xxxxxxxxxxxx
MASTER_DATA_REPO=your-username/enibandhan-master
ENCRYPTION_SECRET_KEY=<generate-random-hex>
MASTER_KEY=<generate-random-hex>
```

#### Server 2 (Index)
```bash
GITHUB_ACCESS_TOKEN=ghp_xxxxxxxxxxxx
INDEX_REPO=your-username/enibandhan-index
```

#### Server 3 (Proxy)
```bash
GITHUB_ACCESS_TOKEN=ghp_xxxxxxxxxxxx
INDEX_REPO=your-username/enibandhan-index
```

#### Generate Encryption Keys
```bash
# Run in terminal to generate random keys:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Use output for ENCRYPTION_SECRET_KEY and MASTER_KEY
```

---

## 💻 Usage

### Daily Workflow

1. **Open Portal**: Navigate to https://enibandhan.bihar.gov.in/digitization/meta-data/v1/
2. **Work Normally**: Extension monitors in background
3. **On Save**: Data is automatically captured and encrypted
4. **Type Pages**: Real-time conflict checking as you type
5. **View Status**: Click extension icon to see sync status

### Manual Sync

```bash
1. Click extension icon
2. Click "Manual Sync Now"
3. Wait for confirmation
4. Check status updates
```

### Viewing Logs

```bash
# Background logs:
1. chrome://extensions/
2. Find "Enibandhan Extension"
3. Click "service worker" link
4. Check console for [Enibandhan] logs

# Content script logs:
1. Open portal page
2. Press F12 (DevTools)
3. Console tab
4. Look for [Scraper] and [Work-3] logs
```

---

## 🔧 Development

### Project Structure

```
enibandhan-extension/
├── manifest.json              # Extension config
├── background.js              # Service worker
├── core/                      # Shared utilities
│   ├── encryption.js          # CryptoJS wrapper
│   ├── db-manager.js          # IndexedDB operations
│   └── api-client.js          # Netlify API calls
├── content-scripts/
│   └── scraper.js             # DOM extraction
├── work-1-capture/            # Data capture workflow
│   ├── capture.js
│   └── listeners.js
├── work-2-sync/               # Scheduled syncing
│   ├── scheduler.js
│   └── sync-manager.js
├── work-3-conflict/           # Conflict detection
│   ├── conflict-checker.js
│   └── error-handler.js
└── ui/                        # User interface
    ├── popup.html/js
    └── settings.html/js

server-1-master/               # Netlify Function
├── netlify/functions/
│   └── master-handler.js
├── package.json
└── README.md

server-2-index/                # Netlify Function
├── netlify/functions/
│   └── index-handler.js
├── package.json
└── README.md

server-3-proxy/                # Netlify Function
├── netlify/functions/
│   └── conflict-proxy.js
├── package.json
└── README.md
```

### Adding Features

#### New Workflow
```bash
1. Create new folder: work-4-your-feature/
2. Add module files
3. Import in background.js
4. Add message handler
5. Test thoroughly
```

#### Database Schema Changes
```bash
1. Update DB_VERSION in core/db-manager.js
2. Modify onupgradeneeded handler
3. Test migration with existing data
```

### Testing

#### Extension Testing
```bash
1. Load unpacked extension
2. Open portal in Chrome
3. Check background console
4. Check content script console
5. Verify IndexedDB contents
```

#### Server Testing
```bash
# Test all endpoints:
curl -X POST https://your-server.netlify.app/.netlify/functions/handler \
  -H "Content-Type: application/json" \
  -d '{"action": "HEALTH_CHECK"}'
```

---

## ⚠️ Troubleshooting

### Extension Issues

**Extension not loading**
```bash
• Check Chrome version (must be 88+)
• Verify manifest.json is valid
• Check background console for errors
```

**Scraper not working**
```bash
• Verify you're on correct portal URL
• Check DOM selectors still match portal
• Look for content script errors in console
```

**Sync not happening**
```bash
• Check server URLs in settings
• Verify alarms are set: chrome.alarms.getAll()
• Check background console for sync logs
• Test manual sync
```

### Server Issues

**Server offline**
```bash
• Check Netlify dashboard for errors
• Verify environment variables are set
• Check function logs
• Test with curl
```

**GitHub push failed**
```bash
• Verify GitHub token is valid
• Check token has 'repo' scope
• Ensure repository exists and is accessible
• Check repository is not archived
```

**Encryption errors**
```bash
• Verify ENCRYPTION_SECRET_KEY is set
• Check MASTER_KEY is valid
• Review encryption logic in logs
```

### Database Issues

**IndexedDB not accessible**
```bash
• Clear browser cache and reload
• Check browser storage permissions
• Verify not in incognito mode
```

**Data not syncing**
```bash
• Check 'synced' flag in database
• Verify records exist in Database Y and Z
• Check server connection
```

---

## 🔐 Security

### Best Practices

1. **Never commit secrets** to Git
2. **Rotate keys** every 90 days
3. **Use private repositories** for GitHub
4. **Monitor logs** regularly
5. **Review access** monthly
6. **Backup data** before major changes

### Data Protection

- **Double Encryption**: Data encrypted locally + master key on server
- **Immediate Wiping**: Database X cleared after encryption
- **Secure Transit**: HTTPS for all communications
- **No Key Storage**: Encryption keys never stored locally

---

## 📝 License

MIT License - See LICENSE file for details

---

## 👥 Support

For issues and questions:
1. Check this documentation
2. Review server-specific READMEs
3. Check browser and server logs
4. Contact development team

---

## 📊 Version History

**v1.0.0** (Initial Release)
- Work 1: Secure data capture
- Work 2: Scheduled synchronization
- Work 3: Real-time conflict detection
- 3 Netlify serverless functions
- Complete documentation