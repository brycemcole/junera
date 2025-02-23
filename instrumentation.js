export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const cron = require('node-cron');
    const { processAllPendingTasks } = require('./src/services/agentProcessor');
    const { checkDB } = require('./src/lib/pgdb');

    console.log('Initializing agent processor...');
  
    // Wait for database to be ready
    let dbReady = false;
    while (!dbReady) {
      try {
        dbReady = await checkDB();
        if (!dbReady) {
          console.log('Waiting for database to be ready...');
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      } catch (err) {
        console.error('Database not ready:', err);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    console.log('Database is ready, starting agent processor...');

    // Process jobs immediately once database is ready
    try {
      await processAllPendingTasks();
      console.log('✓ Initial job processing complete');
    } catch (err) {
      console.error('✕ Error in initial job processing:', err);
    }

    // Schedule to run every hour
    cron.schedule('0 * * * *', async () => {
      console.log('Running scheduled job processing...');
      try {
        await processAllPendingTasks();
        console.log('✓ Scheduled job processing complete');
      } catch (err) {
        console.error('✕ Error in scheduled job processing:', err);
      }
    });

    console.log('✓ Agent processor initialization complete');
  }nearbyStates
}