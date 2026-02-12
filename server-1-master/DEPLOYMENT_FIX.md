# Netlify Deployment Fix for Server 1

## ✅ Solution: Deploy from Server-Specific Directory

### Option A: Using Netlify CLI (Recommended)

```bash
# Navigate INSIDE the server-1-master directory
cd /app/server-1-master

# Login to Netlify (if not already logged in)
netlify login

# Initialize (one time only)
netlify init

# Deploy to production
netlify deploy --prod --dir=.
```

### Option B: Using Netlify Dashboard (Manual Upload)

1. **Compress the folder:**
   ```bash
   cd /app
   zip -r server-1-master.zip server-1-master/ -x '*/node_modules/*'
   ```

2. **Upload to Netlify:**
   - Go to https://app.netlify.com
   - Click "Add new site" → "Deploy manually"
   - Drag and drop `server-1-master.zip`
   - Wait for deployment

### Option C: Using Git (If connected to GitHub)

If you've pushed to GitHub, configure Netlify to deploy from a subdirectory:

1. In Netlify Dashboard:
   - Site Settings → Build & Deploy → Build Settings

2. Set **Base directory**: `server-1-master`

3. Set **Build command**: (leave empty)

4. Set **Publish directory**: (leave empty)

5. Set **Functions directory**: `netlify/functions`

---

## 🔍 What Went Wrong?

The error occurred because Netlify was trying to build from `/app` (parent directory) instead of `/app/server-1-master`. The parent directory doesn't have a valid package.json for this server.

---

## ✅ Verify Package.json

Before deploying, ensure the package.json exists:

```bash
cd /app/server-1-master
cat package.json
# Should show valid JSON with dependencies
```

---

## 🚀 Step-by-Step Fix

### 1. Navigate to Server Directory
```bash
cd /app/server-1-master
```

### 2. Verify Files
```bash
ls -la
# Should see: package.json, netlify.toml, netlify/ folder
```

### 3. Install Dependencies Locally (Optional - for testing)
```bash
npm install
# or
yarn install
```

### 4. Deploy
```bash
netlify deploy --prod
```

### 5. When Prompted:
- **Publish directory**: Press Enter (leave empty)
- **Functions directory**: Should auto-detect `netlify/functions`

---

## ⚙️ Environment Variables

After successful deployment, don't forget to set:

```bash
GITHUB_ACCESS_TOKEN=your_token_here
MASTER_DATA_REPO=your-username/enibandhan-master
ENCRYPTION_SECRET_KEY=<random-hex-64-chars>
MASTER_KEY=<random-hex-64-chars>
```

**Generate keys:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🧪 Test After Deployment

```bash
curl -X POST https://YOUR-SITE.netlify.app/.netlify/functions/master-handler \
  -H "Content-Type: application/json" \
  -d '{"action": "HEALTH_CHECK"}'
```

**Expected Response:**
```json
{"status": "ok", "server": "Server 1 - Master", "timestamp": "..."}
```

---

## 📝 Same Fix for Server 2 & 3

Apply the same approach for other servers:

```bash
# Server 2
cd /app/server-2-index
netlify deploy --prod

# Server 3
cd /app/server-3-proxy
netlify deploy --prod
```

---

## ❓ Still Having Issues?

### Check netlify.toml
```bash
cat netlify.toml
```

Should contain:
```toml
[build]
  functions = "netlify/functions"

[functions]
  node_bundler = "esbuild"
```

### Check Function File
```bash
cat netlify/functions/master-handler.js | head -20
```

Should start with:
```javascript
const { Octokit } = require('@octokit/rest');
const CryptoJS = require('crypto-js');
```

---

## ✅ Success Checklist

- [ ] Navigated to `/app/server-1-master` directory
- [ ] Ran `netlify deploy --prod` from inside that directory
- [ ] Deployment completed without errors
- [ ] Function URL received
- [ ] Environment variables set in Netlify Dashboard
- [ ] Health check passes

---

Try the CLI deployment method from inside the server-1-master directory and let me know if you encounter any other issues!