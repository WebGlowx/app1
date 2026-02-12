# Enibandhan Extension - Quick Start Guide

## 🚀 5-Minute Setup

### What You Need
- Chrome browser
- GitHub account
- Netlify account

---

## Step 1: GitHub (2 minutes)

### Create 2 Private Repositories

```bash
1. Go to https://github.com/new
2. Create "enibandhan-master" (Private)
3. Create "enibandhan-index" (Private)
```

### Generate Token

```bash
1. Go to https://github.com/settings/tokens
2. "Generate new token (classic)"
3. Check "repo" (all sub-items)
4. Generate and COPY the token
```

---

## Step 2: Deploy Servers (3 minutes)

### Quick Deploy All 3 Servers

```bash
# Install Netlify CLI (one time)
npm install -g netlify-cli

# Login
netlify login

# Deploy Server 1
cd /app/server-1-master
netlify deploy --prod
# → Copy the function URL

# Deploy Server 2
cd /app/server-2-index
netlify deploy --prod
# → Copy the function URL

# Deploy Server 3
cd /app/server-3-proxy
netlify deploy --prod
# → Copy the function URL
```

### Set Environment Variables

For **each** of the 3 sites in Netlify Dashboard:

**Server 1:**
```
GITHUB_ACCESS_TOKEN = your_github_token
MASTER_DATA_REPO = your-username/enibandhan-master
ENCRYPTION_SECRET_KEY = (generate with command below)
MASTER_KEY = (generate with command below)
```

**Server 2:**
```
GITHUB_ACCESS_TOKEN = your_github_token
INDEX_REPO = your-username/enibandhan-index
```

**Server 3:**
```
GITHUB_ACCESS_TOKEN = your_github_token
INDEX_REPO = your-username/enibandhan-index
```

**Generate Keys:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Run twice, use for ENCRYPTION_SECRET_KEY and MASTER_KEY
```

---

## Step 3: Load Extension (30 seconds)

```bash
1. Open Chrome: chrome://extensions/
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select: /app/enibandhan-extension/
5. Extension icon appears in toolbar
```

---

## Step 4: Configure (30 seconds)

```bash
1. Click extension icon
2. Click "Settings"
3. Paste your 3 Netlify function URLs:
   - Server 1: https://YOUR-SITE-1.netlify.app/.netlify/functions/master-handler
   - Server 2: https://YOUR-SITE-2.netlify.app/.netlify/functions/index-handler
   - Server 3: https://YOUR-SITE-3.netlify.app/.netlify/functions/conflict-proxy
4. Click "Test Connection" (should all be Online)
5. Click "Save Settings"
```

---

## ✅ You're Done!

The extension is now:
- ✅ Capturing data automatically
- ✅ Encrypting with double-layer security
- ✅ Checking for conflicts in real-time
- ✅ Syncing to GitHub daily (3 PM, 4 PM, 10 AM)

---

## Test It

1. Go to https://enibandhan.bihar.gov.in/digitization/meta-data/v1/
2. Save a record
3. Check extension popup for status
4. Try typing page numbers (conflict check)
5. Click "Manual Sync Now" to test syncing

---

## Need Help?

See:
- `/app/PROJECT_README.md` - Complete documentation
- `/app/DEPLOYMENT_CHECKLIST.md` - Detailed deployment steps
- `/app/server-X-xxx/README.md` - Server-specific guides

---

## URLs to Save

**Netlify Dashboards:**
- Server 1: https://app.netlify.com/sites/YOUR-SITE-1
- Server 2: https://app.netlify.com/sites/YOUR-SITE-2
- Server 3: https://app.netlify.com/sites/YOUR-SITE-3

**GitHub Repos:**
- Master: https://github.com/your-username/enibandhan-master
- Index: https://github.com/your-username/enibandhan-index

**Extension:**
- chrome://extensions/ (bookmark this)

---

Happy Data Capturing! 🎉