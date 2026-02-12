// Work 2: Scheduler for timed syncing
// Sets up alarms for 3PM (index), 4PM (master), and 10AM (retry)

/**
 * Initializes all scheduled alarms
 */
export function initializeScheduler() {
  console.log('[Scheduler] Initializing sync schedules');
  
  // Schedule 3:00 PM - Index Sync (Database Z → Server 2)
  chrome.alarms.create('SYNC_INDEX_3PM', {
    when: getNextScheduledTime(15, 0), // 3:00 PM
    periodInMinutes: 24 * 60 // Daily
  });
  
  // Schedule 4:00 PM - Master Sync (Database Y → Server 1)
  chrome.alarms.create('SYNC_MASTER_4PM', {
    when: getNextScheduledTime(16, 0), // 4:00 PM
    periodInMinutes: 24 * 60 // Daily
  });
  
  // Schedule 10:00 AM - Retry Failed Syncs
  chrome.alarms.create('SYNC_RETRY_10AM', {
    when: getNextScheduledTime(10, 0), // 10:00 AM
    periodInMinutes: 24 * 60 // Daily
  });
  
  console.log('[Scheduler] All sync schedules created');
  
  // Log next scheduled times
  chrome.alarms.getAll((alarms) => {
    alarms.forEach(alarm => {
      const date = new Date(alarm.scheduledTime);
      console.log(`[Scheduler] ${alarm.name} next run: ${date.toLocaleString()}`);
    });
  });
}

/**
 * Calculates the next scheduled time for a given hour and minute
 * @param {Number} hour - Hour in 24h format (0-23)
 * @param {Number} minute - Minute (0-59)
 * @returns {Number} - Timestamp in milliseconds
 */
function getNextScheduledTime(hour, minute) {
  const now = new Date();
  const scheduled = new Date();
  
  scheduled.setHours(hour, minute, 0, 0);
  
  // If the scheduled time has already passed today, schedule for tomorrow
  if (scheduled <= now) {
    scheduled.setDate(scheduled.getDate() + 1);
  }
  
  return scheduled.getTime();
}

/**
 * Manually triggers a sync (for testing or manual operation)
 * @param {String} syncType - 'INDEX', 'MASTER', or 'RETRY'
 */
export function manualSync(syncType) {
  console.log(`[Scheduler] Manual sync triggered: ${syncType}`);
  
  chrome.alarms.create(`MANUAL_${syncType}`, {
    when: Date.now() + 1000 // 1 second from now
  });
}