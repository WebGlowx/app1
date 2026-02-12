# Server 3: Conflict Proxy

## 🎯 Purpose
Server 3 is the **Conflict Checker** for the Enibandhan Extension. It handles:
1. Real-time conflict checking queries from the extension
2. Read-only access to GitHub Index Repository
3. Fast page range conflict detection
4. Context-aware matching (District + SRO + Volume + Pages)

## 📦 Deployment Instructions

### Prerequisites
- Netlify account
- GitHub Personal Access Token with `repo` scope (read-only is sufficient)
- Access to the same GitHub Index Repository used by Server 2

### Step 1: Use Existing GitHub Token
```bash
You'll use the same GitHub repository (enibandhan-index) from Server 2.
The same GitHub token can be reused.
```

### Step 2: Deploy to Netlify

#### Option A: Netlify CLI (Recommended)
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Navigate to server-3 directory
cd server-3-proxy

# Initialize and deploy
netlify init
netlify deploy --prod
```

#### Option B: Netlify Dashboard
```bash
1. Login to Netlify (https://app.netlify.com)
2. Click "Add new site" → "Deploy manually"
3. Drag and drop the entire server-3-proxy folder
4. Wait for deployment to complete
```

### Step 3: Configure Environment Variables

In Netlify dashboard:
```bash
1. Go to Site Settings → Environment Variables
2. Add the following variables:

GITHUB_ACCESS_TOKEN=your_github_personal_access_token
INDEX_REPO=your-github-username/enibandhan-index

Note: Use the same values as Server 2
```

### Step 4: Get Function URL
```bash
1. In Netlify dashboard, go to Functions tab
2. Copy the URL for "conflict-proxy"
3. It should look like:
   https://your-site-name.netlify.app/.netlify/functions/conflict-proxy
4. Use this URL in the extension settings
```

## 🔧 Testing

### Health Check
```bash
curl -X POST https://your-site-name.netlify.app/.netlify/functions/conflict-proxy \
  -H "Content-Type: application/json" \
  -d '{"action": "HEALTH_CHECK"}'

# Expected response:
{"status": "ok", "server": "Server 3 - Proxy"}
```

### Test Conflict Check
```bash
curl -X POST https://your-site-name.netlify.app/.netlify/functions/conflict-proxy \
  -H "Content-Type: application/json" \
  -d '{
    "action": "CHECK_CONFLICT",
    "params": {
      "district": "Patna",
      "sro": "SRO-1",
      "volumeYear": "2024",
      "volumeNo": "100",
      "startPage": "25",
      "endPage": "30"
    }
  }'

# Expected response (no conflict):
{"conflict": false}

# Expected response (conflict found):
{
  "conflict": true,
  "conflictingRecord": {
    "district": "Patna",
    "sro": "SRO-1",
    "volumeYear": "2024",
    "volumeNo": "100",
    "startPage": "1",
    "endPage": "50"
  }
}
```

## 🔍 Conflict Detection Logic

The server checks for page range overlap using this algorithm:

```javascript
// Two ranges overlap if:
// 1. New start is within existing range
// 2. New end is within existing range
// 3. New range completely encompasses existing range

const overlap = 
  (newStart >= recordStart && newStart <= recordEnd) ||
  (newEnd >= recordStart && newEnd <= recordEnd) ||
  (newStart <= recordStart && newEnd >= recordEnd);
```

### Context-Aware Matching
Conflicts are only detected when ALL of these match:
- District
- SRO Office
- Volume Year
- Volume Number
- Page Range Overlap

This prevents false positives from different districts or SROs.

## 📊 Performance

- **Response Time**: Typically < 500ms
- **Read-Only**: No write operations, safe for high-frequency queries
- **Caching**: Consider adding cache for frequently checked volumes

## 🔐 Security Notes

1. This server has **read-only** access
2. No sensitive data is exposed (only index data)
3. Rate limiting recommended for production
4. Monitor for abuse

## ⚠️ Troubleshooting

### "No data found"
- Ensure Server 2 has synced data to GitHub
- Check GitHub repository has files in `/index/` folder
- Verify date format in file path

### "Conflict check slow"
- Consider implementing caching
- Check GitHub API rate limits
- Optimize index data structure

### "False positives"
- Verify context matching (District + SRO)
- Check page number parsing
- Review overlap detection logic

## 🚀 Optimization Tips

1. **Implement caching**: Store recently checked volumes in memory
2. **Batch queries**: Group multiple checks if possible
3. **Index optimization**: Consider using a database for large datasets
4. **Rate limiting**: Prevent abuse with request limits