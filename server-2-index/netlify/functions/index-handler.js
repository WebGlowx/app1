// Netlify Function: Server 2 - Index Data Handler
// Purpose: Index data synchronization to GitHub

const { Octokit } = require('@octokit/rest');

/**
 * Main handler for Server 2
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
    
    console.log('[Server 2] Action:', action);
    
    // Route to appropriate handler
    switch (action) {
      case 'HEALTH_CHECK':
        return healthCheck(headers);
      
      case 'SYNC_INDEX':
        return syncIndexData(body, headers);
      
      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Unknown action' })
        };
    }
  } catch (error) {
    console.error('[Server 2] Error:', error);
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
      server: 'Server 2 - Index',
      timestamp: new Date().toISOString()
    })
  };
}

/**
 * Syncs index data to GitHub Index Repository
 */
async function syncIndexData(body, headers) {
  const { records } = body;
  
  if (!records || !Array.isArray(records)) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid records format' })
    };
  }
  
  console.log(`[Server 2] Syncing ${records.length} index records`);
  
  // Format records for index (lightweight, optimized for searching)
  const formattedRecords = records.map(record => ({
    district: record.district,
    sro: record.sro,
    volumeYear: record.volumeYear,
    volumeNo: record.volumeNo,
    bookNo: record.bookNo,
    startPage: record.startPage,
    endPage: record.endPage,
    userId: record.userId,
    timestamp: record.timestamp
  }));
  
  // Push to GitHub
  try {
    const result = await pushToGitHub(
      formattedRecords,
      process.env.GITHUB_ACCESS_TOKEN,
      process.env.INDEX_REPO
    );
    
    console.log('[Server 2] Successfully pushed to GitHub');
    
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
    console.error('[Server 2] GitHub push failed:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'GitHub push failed: ' + error.message })
    };
  }
}

/**
 * Pushes index data to GitHub repository
 */
async function pushToGitHub(data, token, repo) {
  const octokit = new Octokit({ auth: token });
  
  const [owner, repoName] = repo.split('/');
  const today = new Date().toISOString().split('T')[0];
  const filePath = `index/${today}.json`;
  
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
    console.log('[Server 2] Creating new index file');
  }
  
  // Append new data and remove duplicates
  const combinedData = [...existingContent, ...data];
  
  // Remove duplicates based on district + sro + volume + pages
  const uniqueData = Array.from(
    new Map(
      combinedData.map(item => [
        `${item.district}-${item.sro}-${item.volumeYear}-${item.volumeNo}-${item.startPage}-${item.endPage}`,
        item
      ])
    ).values()
  );
  
  // Push to GitHub
  const response = await octokit.repos.createOrUpdateFileContents({
    owner,
    repo: repoName,
    path: filePath,
    message: `Sync index data - ${new Date().toISOString()}`,
    content: Buffer.from(JSON.stringify(uniqueData, null, 2)).toString('base64'),
    sha: sha
  });
  
  return {
    commitSha: response.data.commit.sha
  };
}