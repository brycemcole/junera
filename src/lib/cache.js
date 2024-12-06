import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300 });

export function getCached(route, key) {
  return cache.get(`${route}:${key}`);
}

export function setCached(route, key, value) {
  cache.set(`${route}:${key}`, value);
}

export default cache;