// /lib/cache.js
const db = require('./pgdb'); // Import the PostgreSQL query function
const memoryCache = new Map();

// Function to check PostgreSQL connection
const isPostgresAvailable = async () => {
  try {
    await db.query('SELECT 1');
    return true;
  } catch (error) {
    console.warn('PostgreSQL not available, using in-memory cache');
    return false;
  }
};

// Function to get cached data
const getCached = async (key, userId) => {
  const fullKey = `${key}:${userId}`;
  try {
    if (!(await isPostgresAvailable())) {
      return memoryCache.get(fullKey) || null;
    }

    const res = await db.query('SELECT value FROM cache WHERE key = $1', [fullKey]);
    if (res.rows.length > 0) {
      const parsed = res.rows[0].value; // assuming 'value' is JSONB
      memoryCache.set(fullKey, parsed);

      // Update last_read for potential LRU eviction
      await db.query('UPDATE cache SET last_read = NOW() WHERE key = $1', [fullKey]);

      return parsed;
    }
    return memoryCache.get(fullKey) || null;
  } catch (error) {
    console.error('Error fetching data from PostgreSQL:', error);
    return memoryCache.get(fullKey) || null;
  }
};

// Function to set cached data
const setCached = async (key, userId, value, ttl = 3600) => {
  const fullKey = `${key}:${userId}`;
  try {
    if (!(await isPostgresAvailable())) {
      console.warn('PostgreSQL not available, using in-memory cache only');
      memoryCache.set(fullKey, value);
      return;
    }

    const stringValue = JSON.stringify(value);
    await db.query(
      `INSERT INTO cache (key, value, inserted_at, last_read)
             VALUES ($1, $2, NOW(), NOW())
             ON CONFLICT (key) DO UPDATE 
             SET value = EXCLUDED.value, 
                 inserted_at = EXCLUDED.inserted_at, 
                 last_read = EXCLUDED.last_read`,
      [fullKey, stringValue]
    );
    memoryCache.set(fullKey, value);
  } catch (error) {
    console.error('Error setting data in PostgreSQL:', error);
    memoryCache.set(fullKey, value);
  }
};

// Function to clear a specific cache entry
const clearCache = async (key, userId) => {
  const fullKey = `${key}:${userId}`;
  try {
    if (await isPostgresAvailable()) {
      await db.query('DELETE FROM cache WHERE key = $1', [fullKey]);
    }
    memoryCache.delete(fullKey);
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};

// Function to clear all cache entries
const clearAllCache = async () => {
  try {
    if (await isPostgresAvailable()) {
      await db.query('TRUNCATE cache');
    }
    memoryCache.clear();
  } catch (error) {
    console.error('Error clearing all cache:', error);
  }
};

module.exports = {
  getCached,
  setCached,
  clearCache,
  clearAllCache,
};