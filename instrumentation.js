export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
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
    
    // Start the agent processor with error handling
    try {
      await processAllPendingTasks();
      console.log('✓ Initial job processing complete');
    } catch (err) {
      console.error('Error during initial job processing:', err);
    }
    
    console.log('✓ Agent processor initialization complete');
  }
}