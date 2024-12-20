import client from './redisClient.js';

// In-memory fallback cache
const memoryCache = new Map();

// Check Redis connection status
const isRedisAvailable = () => client.isReady;

export async function getCached(key) {
  try {
    if (!isRedisAvailable()) {
      console.warn('Redis not available, using memory cache');
      return memoryCache.get(key) || null;
    }

    const data = await client.get(key);
    if (data) {
      // Update memory cache with Redis data
      const parsed = JSON.parse(data);
      memoryCache.set(key, parsed);
      return parsed;
    }
    return memoryCache.get(key) || null;
  } catch (error) {
    console.error('Error fetching data from Redis:', error);
    return memoryCache.get(key) || null;
  }
}

export async function setCached(key, value, ttl = 3600) {
  try {
    if (!isRedisAvailable()) {
      console.warn('Redis not available, using memory cache only');
      memoryCache.set(key, value);
      return;
    }

    const stringValue = JSON.stringify(value);
    await client.set(key, stringValue, { EX: ttl });
    memoryCache.set(key, value);
  } catch (error) {
    console.error('Error setting data in Redis:', error);
    memoryCache.set(key, value);
  }
}

// Optional: Add cache clear functions
export async function clearCache(key) {
  try {
    if (isRedisAvailable()) {
      await client.del(key);
    }
    memoryCache.delete(key);
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

export async function clearAllCache() {
  try {
    if (isRedisAvailable()) {
      await client.flushAll();
    }
    memoryCache.clear();
  } catch (error) {
    console.error('Error clearing all cache:', error);
  }
}