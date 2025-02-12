const cron = require('node-cron');
const { processAllPendingJobs } = require('./agentProcessor');

console.log('Starting agent processor service...');

// Process jobs immediately on startup
processAllPendingJobs()
  .then(() => console.log('✓ Initial job processing complete'))
  .catch(err => console.error('✕ Error in initial job processing:', err));

// Schedule to run every hour
cron.schedule('0 * * * *', async () => {
  console.log('Running scheduled job processing...');
  try {
    await processAllPendingJobs();
    console.log('✓ Scheduled job processing complete');
  } catch (err) {
    console.error('✕ Error in scheduled job processing:', err);
  }
});