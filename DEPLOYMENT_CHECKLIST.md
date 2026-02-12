# ✅ Deployment Checklist for Enibandhan Extension

## Phase 1: GitHub Setup

### 1.1 Create Repositories
- [ ] Create private repository: `enibandhan-master`
- [ ] Create private repository: `enibandhan-index`
- [ ] Initialize both repositories (can be empty)

### 1.2 Generate Access Token
- [ ] Go to GitHub Settings → Developer Settings → Personal Access Tokens
- [ ] Generate new token (classic)
- [ ] Select scope: `repo` (full control)
- [ ] Copy token and save securely
- [ ] Token format: `ghp_xxxxxxxxxxxxxxxxxxxx`

---

## Phase 2: Netlify Deployment

### 2.1 Prepare Netlify Account
- [ ] Create Netlify account (https://app.netlify.com)
- [ ] Verify email address
- [ ] Install Netlify CLI: `npm install -g netlify-cli`
- [ ] Login: `netlify login`

### 2.2 Deploy Server 1 (Master)

**Navigation:**
```bash
cd /app/server-1-master
```

**Deployment:**
- [ ] Run: `netlify init`
- [ ] Choose: "Create & configure a new site"
- [ ] Deploy: `netlify deploy --prod`
- [ ] Copy function URL from output

**Environment Variables:**
Go to Netlify Dashboard → Site Settings → Environment Variables

- [ ] `GITHUB_ACCESS_TOKEN` = `your_github_token`
- [ ] `MASTER_DATA_REPO` = `your-username/enibandhan-master`
- [ ] `ENCRYPTION_SECRET_KEY` = Generate using:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- [ ] `MASTER_KEY` = Generate using same command above

**Testing:**
- [ ] Test health check:
  ```bash
  curl -X POST https://YOUR-SITE.netlify.app/.netlify/functions/master-handler \
    -H "Content-Type: application/json" \
    -d '{"action": "HEALTH_CHECK"}'
  ```
- [ ] Expected: `{"status": "ok", "server": "Server 1 - Master"}`

---

### 2.3 Deploy Server 2 (Index)

**Navigation:**
```bash
cd /app/server-2-index
```

**Deployment:**
- [ ] Run: `netlify init`
- [ ] Choose: "Create & configure a new site"
- [ ] Deploy: `netlify deploy --prod`
- [ ] Copy function URL from output

**Environment Variables:**
- [ ] `GITHUB_ACCESS_TOKEN` = `your_github_token` (same as Server 1)
- [ ] `INDEX_REPO` = `your-username/enibandhan-index`

**Testing:**
- [ ] Test health check:
  ```bash
  curl -X POST https://YOUR-SITE.netlify.app/.netlify/functions/index-handler \
    -H "Content-Type: application/json" \
    -d '{"action": "HEALTH_CHECK"}'
  ```
- [ ] Expected: `{"status": "ok", "server": "Server 2 - Index"}`

---

### 2.4 Deploy Server 3 (Proxy)

**Navigation:**
```bash
cd /app/server-3-proxy
```

**Deployment:**
- [ ] Run: `netlify init`
- [ ] Choose: "Create & configure a new site"
- [ ] Deploy: `netlify deploy --prod`
- [ ] Copy function URL from output

**Environment Variables:**
- [ ] `GITHUB_ACCESS_TOKEN` = `your_github_token` (same as others)
- [ ] `INDEX_REPO` = `your-username/enibandhan-index` (same as Server 2)

**Testing:**
- [ ] Test health check:
  ```bash
  curl -X POST https://YOUR-SITE.netlify.app/.netlify/functions/conflict-proxy \
    -H "Content-Type: application/json" \
    -d '{"action": "HEALTH_CHECK"}'
  ```
- [ ] Expected: `{"status": "ok", "server": "Server 3 - Proxy"}`

---

## Phase 3: Extension Setup

### 3.1 Load Extension in Chrome

- [ ] Open Chrome browser
- [ ] Navigate to: `chrome://extensions/`
- [ ] Enable "Developer mode" (toggle in top right)
- [ ] Click "Load unpacked"
- [ ] Select folder: `/app/enibandhan-extension/`
- [ ] Verify extension appears in toolbar

### 3.2 Configure Extension Settings

- [ ] Click extension icon in Chrome toolbar
- [ ] Click "Settings" button (or right-click icon → Options)
- [ ] Enter Server URLs:

**Server 1 URL:**
```
https://YOUR-SERVER-1.netlify.app/.netlify/functions/master-handler
```

**Server 2 URL:**
```
https://YOUR-SERVER-2.netlify.app/.netlify/functions/index-handler
```

**Server 3 URL:**
```
https://YOUR-SERVER-3.netlify.app/.netlify/functions/conflict-proxy
```

- [ ] Click "Test Connection"
- [ ] Verify all servers show "Online"
- [ ] Click "Save Settings"

---

## Phase 4: Verification & Testing

### 4.1 Test Work 1 (Data Capture)

- [ ] Open portal: https://enibandhan.bihar.gov.in/digitization/meta-data/v1/
- [ ] Fill in a test record
- [ ] Save the record (should get 200 OK)
- [ ] Open Chrome DevTools (F12)
- [ ] Check Console for: `[Work-1] Workflow completed successfully`
- [ ] Verify in Application → IndexedDB → EnibandhanDB_Y has data
- [ ] Verify EnibandhanDB_X is empty (wiped)

### 4.2 Test Work 3 (Conflict Detection)

- [ ] On portal page, enter page numbers
- [ ] Type in "Start Page" and "End Page" fields
- [ ] Watch for conflict alerts (if any existing data matches)
- [ ] Check Console for: `[Work-3] Starting conflict check`

### 4.3 Test Work 2 (Manual Sync)

- [ ] Click extension icon
- [ ] Click "Manual Sync Now"
- [ ] Wait for "Sync Complete" message
- [ ] Check GitHub repositories:
  - [ ] `enibandhan-index` should have `/index/YYYY-MM-DD.json`
  - [ ] `enibandhan-master` should have `/data/YYYY-MM-DD.json`

### 4.4 Check Background Service Worker

- [ ] Go to `chrome://extensions/`
- [ ] Find "Enibandhan Extension"
- [ ] Click "service worker" link
- [ ] Check for logs:
  - [ ] `[Enibandhan] Background service worker started`
  - [ ] `[Scheduler] All sync schedules created`
  - [ ] `[Enibandhan] All listeners initialized`

---

## Phase 5: Production Readiness

### 5.1 Security Checklist

- [ ] All GitHub repositories are **private**
- [ ] GitHub token has minimal required scope (`repo` only)
- [ ] Environment variables are set in Netlify (not in code)
- [ ] Encryption keys are randomly generated (not default values)
- [ ] No sensitive data in Git history
- [ ] `.env` files are in `.gitignore`

### 5.2 Documentation

- [ ] Review main README.md
- [ ] Review each server's README
- [ ] Document any custom modifications
- [ ] Create internal team documentation

### 5.3 Monitoring Setup

- [ ] Bookmark Netlify function logs:
  - Server 1: `https://app.netlify.com/sites/YOUR-SITE-1/logs`
  - Server 2: `https://app.netlify.com/sites/YOUR-SITE-2/logs`
  - Server 3: `https://app.netlify.com/sites/YOUR-SITE-3/logs`

- [ ] Set up Netlify notifications for failures
- [ ] Create calendar reminder for key rotation (90 days)

### 5.4 Backup Plan

- [ ] Export current GitHub data
- [ ] Save encryption keys securely (password manager)
- [ ] Document recovery procedures
- [ ] Test data recovery process

---

## Phase 6: User Rollout

### 6.1 Internal Testing

- [ ] Test with 5-10 internal users
- [ ] Collect feedback
- [ ] Monitor for errors
- [ ] Verify data accuracy

### 6.2 User Training

- [ ] Create user guide
- [ ] Document common issues
- [ ] Prepare FAQ
- [ ] Train support team

### 6.3 Production Release

- [ ] Announce to users
- [ ] Provide installation instructions
- [ ] Set up support channel
- [ ] Monitor initial usage

---

## Troubleshooting Quick Reference

### Extension Not Loading
```bash
• Check Chrome version (must be 88+)
• Verify manifest.json has no errors
• Check background service worker console
```

### Server Connection Failed
```bash
• Verify URLs in settings (must include /.netlify/functions/...)
• Check CORS settings in Netlify
• Test with curl commands
```

### GitHub Push Failed
```bash
• Verify token is valid (not expired)
• Check repository exists and is accessible
• Ensure token has 'repo' scope
```

### Data Not Syncing
```bash
• Check IndexedDB has data
• Verify 'synced' flag is false
• Check alarm schedules
• Try manual sync
```

---

## Contact & Support

For deployment issues:
1. Check this checklist
2. Review server logs in Netlify
3. Check browser console
4. Contact development team

---

## ✅ Final Sign-Off

**Deployment completed by:** _______________  
**Date:** _______________  
**Server URLs documented:** ☐ Yes ☐ No  
**All tests passed:** ☐ Yes ☐ No  
**Production ready:** ☐ Yes ☐ No  

---

**Next scheduled review:** _______________ (90 days for key rotation)