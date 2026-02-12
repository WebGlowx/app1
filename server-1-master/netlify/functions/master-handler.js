// Netlify Function: Server 1 - Master Data Handler
// Purpose: Encryption key provider & Master data storage

const { Octokit } = require('@octokit/rest');
const CryptoJS = require('crypto-js');

/**
 * Main handler for Server 1
 */
exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };
  
  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
  
  // Only accept POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }
  
  try {
    const body = JSON.parse(event.body);
    const { action } = body;
    
    console.log('[Server 1] Action:', action);
    
    // Route to appropriate handler
    switch (action) {
      case 'HEALTH_CHECK':
        return healthCheck(headers);
      
      case 'REQUEST_KEY':
        return requestKey(headers);
      
      case 'SYNC_MASTER':
        return syncMasterData(body, headers);
      
      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Unknown action' })
        };
    }
  } catch (error) {
    console.error('[Server 1] Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

/**
 * Health check endpoint
 */
function healthCheck(headers) {
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      status: 'ok',
      server: 'Server 1 - Master',
      timestamp: new Date().toISOString()
    })
  };
}

/**
 * Generates and returns an encryption key
 */
function requestKey(headers) {
  const secretKey = process.env.ENCRYPTION_SECRET_KEY;
  
  if (!secretKey) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Secret key not configured' })
    };
  }
  
  // Generate a session-based encryption key
  const sessionKey = CryptoJS.lib.WordArray.random(32).toString();
  
  // Combine with secret key for additional security
  const encryptionKey = CryptoJS.SHA256(sessionKey + secretKey).toString();
  
  console.log('[Server 1] Encryption key generated');
  
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      encryptionKey: encryptionKey,
      sessionId: sessionKey
    })
  };
}

/**
 * Syncs master data to GitHub Master Repository
 */
async function syncMasterData(body, headers) {
  const { records } = body;
  
  if (!records || !Array.isArray(records)) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid records format' })
    };
  }
  
  console.log(`[Server 1] Syncing ${records.length} master records`);
  
  // Apply master key encryption (double encryption)
  const masterKey = process.env.MASTER_KEY;
  if (!masterKey) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Master key not configured' })
    };
  }
  
  const doubleEncryptedRecords = records.map(record => {
    // The record is already encrypted, now apply master key
    const doubleEncrypted = CryptoJS.AES.encrypt(
      JSON.stringify(record),
      masterKey
    ).toString();
    
    return {
      sessionId: record.sessionId,
      data: doubleEncrypted,
      timestamp: record.timestamp || new Date().toISOString()
    };
  });
  
  // Push to GitHub
  try {
    const result = await pushToGitHub(
      doubleEncryptedRecords,
      process.env.GITHUB_ACCESS_TOKEN,
      process.env.MASTER_DATA_REPO
    );
    
    console.log('[Server 1] Successfully pushed to GitHub');
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        synced: records.length,
        githubCommit: result.commitSha,
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('[Server 1] GitHub push failed:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'GitHub push failed: ' + error.message })
    };
  }
}

/**
 * Pushes data to GitHub repository
 */
async function pushToGitHub(data, token, repo) {
  const octokit = new Octokit({ auth: token });
  
  const [owner, repoName] = repo.split('/');
  const filePath = `data/${new Date().toISOString().split('T')[0]}.json`;
  
  // Get existing file (if any)
  let existingContent = [];
  let sha = null;
  
  try {
    const { data: fileData } = await octokit.repos.getContent({
      owner,
      repo: repoName,
      path: filePath
    });
    
    existingContent = JSON.parse(
      Buffer.from(fileData.content, 'base64').toString('utf-8')
    );
    sha = fileData.sha;
  } catch (error) {
    // File doesn't exist, that's okay
    console.log('[Server 1] Creating new file');
  }
  
  // Append new data
  const updatedContent = [...existingContent, ...data];
  
  // Push to GitHub
  const response = await octokit.repos.createOrUpdateFileContents({
    owner,
    repo: repoName,
    path: filePath,
    message: `Sync master data - ${new Date().toISOString()}`,
    content: Buffer.from(JSON.stringify(updatedContent, null, 2)).toString('base64'),
    sha: sha
  });
  
  return {
    commitSha: response.data.commit.sha
  };
}