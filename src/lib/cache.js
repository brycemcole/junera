const memoryCache = new Map();

const getCached = async (key, userId) => {
  const fullKey = `${key}:${userId}`;
  return memoryCache.get(fullKey) || null;
};

const setCached = async (key, userId, value) => {
  if (!value) {
    console.warn('Attempted to cache null/undefined value');
    return;
  }

  const fullKey = `${key}:${userId}`;
  memoryCache.set(fullKey, value);
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