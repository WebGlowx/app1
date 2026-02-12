// Netlify Function: Server 3 - Conflict Proxy
// Purpose: Real-time read-only conflict checking

const { Octokit } = require('@octokit/rest');

/**
 * Main handler for Server 3
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
    
    console.log('[Server 3] Action:', action);
    
    // Route to appropriate handler
    switch (action) {
      case 'HEALTH_CHECK':
        return healthCheck(headers);
      
      case 'CHECK_CONFLICT':
        return checkConflict(body, headers);
      
      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Unknown action' })
        };
    }
  } catch (error) {
    console.error('[Server 3] Error:', error);
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
      server: 'Server 3 - Proxy',
      timestamp: new Date().toISOString()
    })
  };
}

/**
 * Checks for conflicts in GitHub Index Repository
 */
async function checkConflict(body, headers) {
  const { params } = body;
  
  if (!params) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Missing params' })
    };
  }
  
  const { district, sro, volumeYear, volumeNo, startPage, endPage } = params;
  
  if (!district || !sro || !volumeYear || !volumeNo || !startPage || !endPage) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Missing required parameters' })
    };
  }
  
  console.log('[Server 3] Checking conflict for:', params);
  
  try {
    // Fetch index data from GitHub
    const indexData = await fetchIndexData(
      process.env.GITHUB_ACCESS_TOKEN,
      process.env.INDEX_REPO
    );
    
    if (!indexData || indexData.length === 0) {
      console.log('[Server 3] No index data found');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ conflict: false })
      };
    }
    
    // Filter by context (District + SRO + Volume)
    const relevantRecords = indexData.filter(record => 
      record.district === district &&
      record.sro === sro &&
      record.volumeYear === volumeYear &&
      record.volumeNo === volumeNo
    );
    
    console.log(`[Server 3] Found ${relevantRecords.length} relevant records`);
    
    // Check for page range overlap
    const newStart = parseInt(startPage);
    const newEnd = parseInt(endPage);
    
    const conflictingRecord = relevantRecords.find(record => {
      const recordStart = parseInt(record.startPage);
      const recordEnd = parseInt(record.endPage);
      
      // Check if ranges overlap
      const overlap = 
        (newStart >= recordStart && newStart <= recordEnd) ||
        (newEnd >= recordStart && newEnd <= recordEnd) ||
        (newStart <= recordStart && newEnd >= recordEnd);
      
      return overlap;
    });
    
    if (conflictingRecord) {
      console.log('[Server 3] Conflict detected:', conflictingRecord);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          conflict: true,
          conflictingRecord: conflictingRecord
        })
      };
    }
    
    console.log('[Server 3] No conflict found');
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ conflict: false })
    };
    
  } catch (error) {
    console.error('[Server 3] Conflict check failed:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Conflict check failed: ' + error.message })
    };
  }
}

/**
 * Fetches index data from GitHub repository
 */
async function fetchIndexData(token, repo) {
  const octokit = new Octokit({ auth: token });
  
  const [owner, repoName] = repo.split('/');
  
  // Try to get today's index file
  const today = new Date().toISOString().split('T')[0];
  const filePath = `index/${today}.json`;
  
  try {
    const { data: fileData } = await octokit.repos.getContent({
      owner,
      repo: repoName,
      path: filePath
    });
    
    const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.log('[Server 3] Today\'s index not found, trying to get all index files');
    
    // If today's file doesn't exist, get all files from index folder
    try {
      const { data: files } = await octokit.repos.getContent({
        owner,
        repo: repoName,
        path: 'index'
      });
      
      // Get the most recent file
      if (files.length > 0) {
        const latestFile = files.sort((a, b) => 
          b.name.localeCompare(a.name)
        )[0];
        
        const { data: fileData } = await octokit.repos.getContent({
          owner,
          repo: repoName,
          path: latestFile.path
        });
        
        const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
        return JSON.parse(content);
      }
    } catch (innerError) {
      console.error('[Server 3] Failed to fetch index data:', innerError);
      return [];
    }
  }
  
  return [];
}