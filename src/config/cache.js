const NodeCache = require('node-cache');

// Load environment variables
const cacheExpiration = parseInt(process.env.CACHE_EXPIRATION) || 43200; // 12 hours default in seconds

// Create a cache with default settings
const cache = new NodeCache({
  stdTTL: cacheExpiration, // default time to live in seconds
  checkperiod: cacheExpiration * 0.2, // check for expired keys every 20% of TTL
  useClones: false, // don't clone data for better performance with large objects
});

// Log cache statistics when cache is cleared
cache.on('del', (key, value) => {
  if (key === '__CACHE_STATS__') return; // Skip stats key
  console.log(`Cache: Key expired/deleted: ${key}`);
});

// Log cache statistics periodically
setInterval(() => {
  const stats = cache.getStats();
  const keys = cache.keys();
  console.log(`Cache Stats - Keys: ${keys.length}, Hits: ${stats.hits}, Misses: ${stats.misses}, Hit Rate: ${stats.hits > 0 ? Math.round((stats.hits / (stats.hits + stats.misses)) * 100) : 0}%`);
  cache.set('__CACHE_STATS__', stats); // Store stats in cache for potential monitoring
}, cacheExpiration * 1000 * 0.5); // Log stats every 50% of expiration time

/**
 * Simple cache interface that mimics basic Redis functionality
 */
const cacheClient = {
  /**
   * Get a value from the cache
   * @param {string} key - The key to get
   * @returns {Promise<any>} - The value or null if not found
   */
  get: async (key) => {
    try {
      const value = cache.get(key);
      return value !== undefined ? value : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },
  
  /**
   * Set a value in the cache
   * @param {string} key - The key to set
   * @param {any} value - The value to set
   * @param {Object} options - Options (supports {EX: seconds} for TTL)
   * @returns {Promise<string>} - "OK" if successful
   */
  set: async (key, value, options = {}) => {
    try {
      // Check if custom TTL is provided via EX option (Redis compatibility)
      const ttl = options.EX || cacheExpiration;
      cache.set(key, value, ttl);
      return 'OK';
    } catch (error) {
      console.error('Cache set error:', error);
      throw error;
    }
  },
  
  /**
   * Delete a key from the cache
   * @param {string} key - The key to delete
   * @returns {Promise<number>} - 1 if deleted, 0 if not found
   */
  del: async (key) => {
    try {
      return cache.del(key) ? 1 : 0;
    } catch (error) {
      console.error('Cache delete error:', error);
      return 0;
    }
  },
  
  /**
   * Flush the entire cache
   * @returns {Promise<string>} - "OK" if successful
   */
  flushAll: async () => {
    try {
      cache.flushAll();
      return 'OK';
    } catch (error) {
      console.error('Cache flush error:', error);
      throw error;
    }
  }
};

// Print startup message
console.log(`In-memory cache initialized with ${cacheExpiration} seconds (${Math.round(cacheExpiration/3600)} hours) expiration time`);

// Export cache client and configuration
module.exports = {
  cacheClient,
  cacheExpiration
}; 