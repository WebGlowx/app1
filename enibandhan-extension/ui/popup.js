// Popup Script
import { checkServerHealth } from '../core/api-client.js';

// Elements
const loading = document.getElementById('loading');
const mainContent = document.getElementById('main-content');
const manualSyncBtn = document.getElementById('manual-sync');
const openSettingsBtn = document.getElementById('open-settings');

/**
 * Loads and displays sync status
 */
async function loadSyncStatus() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_SYNC_STATUS' });
    
    if (response) {
      document.getElementById('index-pending').textContent = 
        `${response.index.pending} pending / ${response.index.synced} synced`;
      
      document.getElementById('master-pending').textContent = 
        `${response.master.pending} pending / ${response.master.synced} synced`;
    }
  } catch (error) {
    console.error('Failed to load sync status:', error);
  }
}

/**
 * Loads next scheduled sync time
 */
async function loadNextSyncTime() {
  try {
    const alarms = await chrome.alarms.getAll();
    
    if (alarms.length > 0) {
      // Find the next alarm
      const nextAlarm = alarms.reduce((closest, alarm) => 
        !closest || alarm.scheduledTime < closest.scheduledTime ? alarm : closest
      );
      
      const date = new Date(nextAlarm.scheduledTime);
      const timeString = date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
      
      document.getElementById('next-sync').textContent = timeString;
    } else {
      document.getElementById('next-sync').textContent = 'Not scheduled';
    }
  } catch (error) {
    console.error('Failed to load next sync time:', error);
  }
}

/**
 * Checks server health and updates status badges
 */
async function loadServerStatus() {
  try {
    const serverHealth = await checkServerHealth();
    
    // Update server status badges
    for (const [server, status] of Object.entries(serverHealth)) {
      const element = document.getElementById(`${server}-status`);
      if (element) {
        const badgeClass = status === 'Online' ? 'online' : 'offline';
        element.innerHTML = `<span class="badge ${badgeClass}">${status}</span>`;
      }
    }
  } catch (error) {
    console.error('Failed to check server health:', error);
    
    // Set all to offline on error
    ['server1', 'server2', 'server3'].forEach(server => {
      const element = document.getElementById(`${server}-status`);
      if (element) {
        element.innerHTML = '<span class="badge offline">Offline</span>';
      }
    });
  }
}

/**
 * Initializes the popup
 */
async function init() {
  try {
    // Load all status data
    await Promise.all([
      loadSyncStatus(),
      loadNextSyncTime(),
      loadServerStatus()
    ]);
    
    // Hide loading, show content
    loading.style.display = 'none';
    mainContent.style.display = 'block';
  } catch (error) {
    console.error('Failed to initialize popup:', error);
    loading.innerHTML = '<p style="color: #ef4444;">Failed to load status</p>';
  }
}

// Event Listeners
manualSyncBtn.addEventListener('click', async () => {
  manualSyncBtn.textContent = 'Syncing...';
  manualSyncBtn.disabled = true;
  
  try {
    await chrome.runtime.sendMessage({ type: 'MANUAL_SYNC' });
    manualSyncBtn.textContent = '✓ Sync Complete';
    
    // Reload status after 1 second
    setTimeout(() => {
      init();
      manualSyncBtn.textContent = 'Manual Sync Now';
      manualSyncBtn.disabled = false;
    }, 1000);
  } catch (error) {
    console.error('Manual sync failed:', error);
    manualSyncBtn.textContent = '✗ Sync Failed';
    manualSyncBtn.disabled = false;
  }
});

openSettingsBtn.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

// Initialize on load
init();

// Refresh status every 30 seconds
setInterval(init, 30000);