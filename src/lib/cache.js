import client from './redisClient.js';

// In-memory fallback cache
const memoryCache = new Map();

// Check Redis connection status
const isRedisAvailable = () => client.isReady;

export async function getCached(key, userId) {
  const fullKey = `${key}:${userId}`;
  try {
    if (!isRedisAvailable()) {
      console.warn('Redis not available, using memory cache');
      return memoryCache.get(fullKey) || null;
    }

    const data = await client.get(fullKey);
    if (data) {
      const parsed = JSON.parse(data);
      memoryCache.set(fullKey, parsed);
      return parsed;
    }
    return memoryCache.get(fullKey) || null;
  } catch (error) {
    console.error('Error fetching data from Redis:', error);
    return memoryCache.get(fullKey) || null;
  }
}

export async function setCached(key, userId, value, ttl = 3600) {
  const fullKey = `${key}:${userId}`;
  try {
    if (!isRedisAvailable()) {
      console.warn('Redis not available, using memory cache only');
      memoryCache.set(fullKey, value);
      return;
    }

    const stringValue = JSON.stringify(value);
    await client.set(fullKey, stringValue, { EX: ttl });
    memoryCache.set(fullKey, value);
  } catch (error) {
    console.error('Error setting data in Redis:', error);
    memoryCache.set(fullKey, value);
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