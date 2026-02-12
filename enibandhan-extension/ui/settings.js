// Settings Page Script
import { checkServerHealth } from '../core/api-client.js';

const form = document.getElementById('settings-form');
const testBtn = document.getElementById('test-connection');
const alert = document.getElementById('alert');

/**
 * Shows an alert message
 * @param {String} message - Alert message
 * @param {String} type - 'success' or 'error'
 */
function showAlert(message, type = 'success') {
  alert.textContent = message;
  alert.className = `alert ${type}`;
  alert.style.display = 'block';
  
  setTimeout(() => {
    alert.style.display = 'none';
  }, 5000);
}

/**
 * Loads saved settings
 */
async function loadSettings() {
  chrome.storage.sync.get(['server1Url', 'server2Url', 'server3Url'], (result) => {
    if (result.server1Url) {
      document.getElementById('server1Url').value = result.server1Url;
    }
    if (result.server2Url) {
      document.getElementById('server2Url').value = result.server2Url;
    }
    if (result.server3Url) {
      document.getElementById('server3Url').value = result.server3Url;
    }
  });
}

/**
 * Saves settings
 */
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const settings = {
    server1Url: document.getElementById('server1Url').value.trim(),
    server2Url: document.getElementById('server2Url').value.trim(),
    server3Url: document.getElementById('server3Url').value.trim()
  };
  
  try {
    await chrome.storage.sync.set(settings);
    showAlert('✓ Settings saved successfully!', 'success');
    console.log('Settings saved:', settings);
  } catch (error) {
    showAlert('✗ Failed to save settings: ' + error.message, 'error');
    console.error('Failed to save settings:', error);
  }
});

/**
 * Tests server connections
 */
testBtn.addEventListener('click', async () => {
  testBtn.textContent = 'Testing...';
  testBtn.disabled = true;
  
  try {
    const health = await checkServerHealth();
    
    const results = Object.entries(health)
      .map(([server, status]) => `${server}: ${status}`)
      .join(', ');
    
    const allOnline = Object.values(health).every(status => status === 'Online');
    
    if (allOnline) {
      showAlert(`✓ All servers online! (${results})`, 'success');
    } else {
      showAlert(`⚠ Some servers offline: ${results}`, 'error');
    }
  } catch (error) {
    showAlert('✗ Connection test failed: ' + error.message, 'error');
  } finally {
    testBtn.textContent = 'Test Connection';
    testBtn.disabled = false;
  }
});

// Load settings on page load
loadSettings();