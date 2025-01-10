const memoryCache = new Map();
const cacheExpiry = new Map();

const getCached = async (key, userId = '') => {
  const fullKey = `${key}:${userId}`;
  const expiry = cacheExpiry.get(fullKey);
  
  // Check if cache has expired
  if (expiry && Date.now() > expiry) {
    memoryCache.delete(fullKey);
    cacheExpiry.delete(fullKey);
    return null;
  }
  
  return memoryCache.get(fullKey) || null;
};

const setCached = async (key, userId = '', value, ttlSeconds = 300) => {
  if (!value) {
    console.warn('Attempted to cache null/undefined value');
    return;
  }

  const fullKey = `${key}:${userId}`;
  memoryCache.set(fullKey, value);
  cacheExpiry.set(fullKey, Date.now() + (ttlSeconds * 1000));
};

const clearCache = async (key, userId) => {
  const fullKey = `${key}:${userId}`;
  memoryCache.delete(fullKey);
};

const clearAllCache = async () => {
  memoryCache.clear();
};

module.exports = {
  getCached,
  setCached,
  clearCache,
  clearAllCache,
};