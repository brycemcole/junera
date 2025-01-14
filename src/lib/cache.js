const memoryCache = new Map();
const cacheExpiry = new Map();

const getCached = async (key) => {
  const expiry = cacheExpiry.get(key);
  
  // Check if cache has expired
  if (expiry && Date.now() > expiry) {
    memoryCache.delete(key);
    cacheExpiry.delete(key);
    return null;
  }
  
  return memoryCache.get(key) || null;
};

const setCached = async (key, value, ttlSeconds = 300) => {
  if (!value) {
    console.warn('Attempted to cache null/undefined value');
    return;
  }

  memoryCache.set(key, value);
  cacheExpiry.set(key, Date.now() + (ttlSeconds * 1000));
};

const clearCache = async (key) => {
  memoryCache.delete(key);
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