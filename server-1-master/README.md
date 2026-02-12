# Server 1: Master Data Handler

## 🎯 Purpose
Server 1 is the **Security Hub** for the Enibandhan Extension. It handles:
1. Generating and providing temporary encryption keys
2. Receiving encrypted data from Database Y
3. Applying master key encryption (double encryption)
4. Pushing fully encrypted data to GitHub Master Repository

## 📦 Deployment Instructions

### Prerequisites
- Netlify account
- GitHub account with a private repository for master data
- GitHub Personal Access Token with `repo` scope

### Step 1: Setup GitHub Repository
```bash
1. Create a private GitHub repository named "enibandhan-master"
2. Go to GitHub Settings → Developer Settings → Personal Access Tokens
3. Generate new token with "repo" permissions
4. Copy the token (you'll use it in environment variables)
```

### Step 2: Deploy to Netlify

#### Option A: Netlify CLI (Recommended)
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Navigate to server-1 directory
cd server-1-master

# Initialize and deploy
netlify init
netlify deploy --prod
```

#### Option B: Netlify Dashboard
```bash
1. Login to Netlify (https://app.netlify.com)
2. Click "Add new site" → "Deploy manually"
3. Drag and drop the entire server-1-master folder
4. Wait for deployment to complete
```

### Step 3: Configure Environment Variables

In Netlify dashboard:
```bash
1. Go to Site Settings → Environment Variables
2. Add the following variables:

GITHUB_ACCESS_TOKEN=your_github_personal_access_token
MASTER_DATA_REPO=your-github-username/enibandhan-master
ENCRYPTION_SECRET_KEY=your-strong-random-key-here
MASTER_KEY=your-master-encryption-key-here
```

#### Generating Keys
```bash
# Generate random keys (run in terminal):
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Use the output for ENCRYPTION_SECRET_KEY and MASTER_KEY
```

### Step 4: Get Function URL
```bash
1. In Netlify dashboard, go to Functions tab
2. Copy the URL for "master-handler"
3. It should look like:
   https://your-site-name.netlify.app/.netlify/functions/master-handler
4. Use this URL in the extension settings
```

## 🔧 Testing

### Health Check
```bash
curl -X POST https://your-site-name.netlify.app/.netlify/functions/master-handler \
  -H "Content-Type: application/json" \
  -d '{"action": "HEALTH_CHECK"}'

# Expected response:
{"status": "ok", "server": "Server 1 - Master"}
```

### Request Encryption Key
```bash
curl -X POST https://your-site-name.netlify.app/.netlify/functions/master-handler \
  -H "Content-Type: application/json" \
  -d '{"action": "REQUEST_KEY"}'

# Expected response:
{"encryptionKey": "..."}
```

## 🔐 Security Notes

1. **Never commit environment variables** to Git
2. Use Netlify's environment variable encryption
3. Rotate keys every 90 days
4. Monitor function logs for unauthorized access
5. GitHub repository MUST be private

## 📊 Monitoring

- Check Netlify function logs regularly
- Set up alerts for failed GitHub pushes
- Monitor GitHub repository size
- Review access logs monthly

## ⚠️ Troubleshooting

### "GitHub push failed"
- Verify GITHUB_ACCESS_TOKEN is valid
- Check token has `repo` scope
- Ensure repository name is correct

### "Encryption failed"
- Verify ENCRYPTION_SECRET_KEY and MASTER_KEY are set
- Check keys are valid hex strings
- Review function logs for specific errors

### "Function timeout"
- GitHub API may be slow
- Consider batch size limits
- Check Netlify function timeout settings