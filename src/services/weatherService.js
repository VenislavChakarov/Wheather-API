const axios = require('axios');
const { cacheClient, cacheExpiration } = require('../config/cache');

// Load environment variables
const apiKey = process.env.WEATHER_API_KEY;
const baseUrl = process.env.WEATHER_API_BASE_URL;

/**
 * Generates a cache key based on location and query parameters
 * @param {string} location - City name or coordinates
 * @param {Object} params - Additional query parameters
 * @returns {string} - Cache key
 */
const generateCacheKey = (location, params = {}) => {
  const queryString = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  
  return `weather:${location}${queryString ? `:${queryString}` : ''}`;
};

/**
 * Get weather data for a location
 * @param {string} location - City name or coordinates
 * @param {Object} params - Additional query parameters
 * @returns {Promise<Object>} - Weather data
 */
const getWeatherData = async (location, params = {}) => {
  try {
    if (!location) {
      throw new Error('Location is required');
    }

    if (!apiKey) {
      throw new Error('Weather API key is not configured');
    }

    // Generate cache key
    const cacheKey = generateCacheKey(location, params);
    
    // Try to get data from cache
    const cachedData = await cacheClient.get(cacheKey);
    
    if (cachedData) {
      console.log(`Cache hit for ${cacheKey}`);
      return cachedData;
    }
    
    console.log(`Cache miss for ${cacheKey}, fetching from API`);
    
    // Build the request URL
    const url = `${baseUrl}/${encodeURIComponent(location)}`;
    
    // Add API key to parameters
    const requestParams = {
      ...params,
      key: apiKey,
      unitGroup: params.unitGroup || 'metric' // Default to metric units
    };
    
    // Make the API request
    const response = await axios.get(url, { params: requestParams });
    
    if (response.status !== 200) {
      throw new Error(`API error: ${response.statusText}`);
    }
    
    const weatherData = response.data;
    
    // Store in cache with expiration
    await cacheClient.set(cacheKey, weatherData, {
      EX: cacheExpiration
    });
    
    return weatherData;
  } catch (error) {
    // Handle axios errors
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const statusCode = error.response.status;
      const errorMessage = error.response.data?.message || error.response.statusText;
      
      // Customize error based on status code
      if (statusCode === 400) {
        throw new Error(`Invalid request: ${errorMessage}`);
      } else if (statusCode === 401 || statusCode === 403) {
        throw new Error('Invalid API key or authentication error');
      } else if (statusCode === 404) {
        throw new Error(`Location not found: ${location}`);
      } else if (statusCode === 429) {
        throw new Error('API rate limit exceeded');
      } else {
        throw new Error(`Weather API error: ${errorMessage}`);
      }
    } else if (error.request) {
      // The request was made but no response was received
      throw new Error('No response from weather service. Please try again later.');
    } else {
      // Something happened in setting up the request that triggered an Error
      throw error;
    }
  }
};

module.exports = {
  getWeatherData
}; 