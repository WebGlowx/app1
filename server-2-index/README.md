# Server 2: Index Data Handler

## 🎯 Purpose
Server 2 is the **Sync Manager** for the Enibandhan Extension. It handles:
1. Receiving lightweight index data from Database Z
2. Formatting data for fast searching
3. Pushing index data to GitHub Index Repository
4. Managing scheduled sync operations (3 PM daily)

## 📦 Deployment Instructions

### Prerequisites
- Netlify account
- GitHub account with a private repository for index data
- GitHub Personal Access Token with `repo` scope

### Step 1: Setup GitHub Repository
```bash
1. Create a private GitHub repository named "enibandhan-index"
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

# Navigate to server-2 directory
cd server-2-index

# Initialize and deploy
netlify init
netlify deploy --prod
```

#### Option B: Netlify Dashboard
```bash
1. Login to Netlify (https://app.netlify.com)
2. Click "Add new site" → "Deploy manually"
3. Drag and drop the entire server-2-index folder
4. Wait for deployment to complete
```

### Step 3: Configure Environment Variables

In Netlify dashboard:
```bash
1. Go to Site Settings → Environment Variables
2. Add the following variables:

GITHUB_ACCESS_TOKEN=your_github_personal_access_token
INDEX_REPO=your-github-username/enibandhan-index
```

### Step 4: Get Function URL
```bash
1. In Netlify dashboard, go to Functions tab
2. Copy the URL for "index-handler"
3. It should look like:
   https://your-site-name.netlify.app/.netlify/functions/index-handler
4. Use this URL in the extension settings
```

## 🔧 Testing

### Health Check
```bash
curl -X POST https://your-site-name.netlify.app/.netlify/functions/index-handler \
  -H "Content-Type: application/json" \
  -d '{"action": "HEALTH_CHECK"}'

# Expected response:
{"status": "ok", "server": "Server 2 - Index"}
```

### Test Index Sync
```bash
curl -X POST https://your-site-name.netlify.app/.netlify/functions/index-handler \
  -H "Content-Type: application/json" \
  -d '{
    "action": "SYNC_INDEX",
    "records": [
      {
        "district": "Patna",
        "sro": "SRO-1",
        "volumeYear": "2024",
        "volumeNo": "100",
        "startPage": "1",
        "endPage": "50"
      }
    ]
  }'

# Expected response:
{"success": true, "synced": 1, "githubCommit": "..."}
```

## 📊 Index Data Structure

The index repository stores data in this format:
```json
{
  "district": "District Name",
  "sro": "SRO Office",
  "volumeYear": "2024",
  "volumeNo": "100",
  "bookNo": "1",
  "startPage": "1",
  "endPage": "50",
  "userId": "user123",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## 🔐 Security Notes

1. **Never commit environment variables** to Git
2. GitHub repository should be private
3. Regularly review access logs
4. Monitor for unusual activity

## ⚠️ Troubleshooting

### "GitHub push failed"
- Verify GITHUB_ACCESS_TOKEN is valid
- Check token has `repo` scope
- Ensure repository name is correct

### "Invalid records format"
- Verify data structure matches expected format
- Check all required fields are present

### "Function timeout"
- Consider batch size limits (max 100 records per sync)
- Check Netlify function timeout settings