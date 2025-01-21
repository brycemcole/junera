import { query } from '@/lib/pgdb';

export async function initializeDatabaseExtensions() {
  try {
    // Create the pg_trgm extension if it doesn't exist
    await query('CREATE EXTENSION IF NOT EXISTS pg_trgm;');
    console.log('Successfully initialized pg_trgm extension');
  } catch (error) {
    console.error('Error initializing database extensions:', error);
  }
}
