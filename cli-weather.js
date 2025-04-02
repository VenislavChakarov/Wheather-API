require('dotenv').config();
const axios = require('axios');
const readline = require('readline');
const NodeCache = require('node-cache');

// Create a simple cache
const cache = new NodeCache({ stdTTL: 43200 }); // 12 hours

// Visual Crossing API configuration
const apiKey = process.env.WEATHER_API_KEY;
const baseUrl = process.env.WEATHER_API_BASE_URL;

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Generate a cache key for a location
 * @param {string} location - The location to get weather for
 * @returns {string} - Cache key
 */
const generateCacheKey = (location) => {
  return `weather:${location.toLowerCase()}`;
};

/**
 * Get weather data for a location
 * @param {string} location - The location to get weather for
 * @returns {Promise<Object>} - Weather data
 */
async function getWeatherData(location) {
  try {
    // Check cache first
    const cacheKey = generateCacheKey(location);
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      console.log('Using cached data');
      return cachedData;
    }
    
    console.log(`Fetching weather data for ${location}...`);
    
    // Build the request URL
    const url = `${baseUrl}/${encodeURIComponent(location)}`;
    
    // Make the API request
    const response = await axios.get(url, { 
      params: { 
        key: apiKey,
        unitGroup: 'metric'
      }
    });
    
    const weatherData = response.data;
    
    // Store in cache
    cache.set(cacheKey, weatherData);
    
    return weatherData;
  } catch (error) {
    if (error.response) {
      throw new Error(`API Error: ${error.response.status} - ${error.response.data?.message || error.response.statusText}`);
    } else if (error.request) {
      throw new Error('Network Error: No response received from the API');
    } else {
      throw error;
    }
  }
}

/**
 * Format and display current weather
 * @param {Object} weatherData - Weather data from the API
 */
function displayCurrentWeather(weatherData) {
  const current = weatherData.currentConditions;
  console.log('\n===== Current Weather =====');
  console.log(`Location: ${weatherData.resolvedAddress}`);
  console.log(`Time: ${current.datetime}`);
  console.log(`Temperature: ${current.temp}°C`);
  console.log(`Feels Like: ${current.feelslike}°C`);
  console.log(`Conditions: ${current.conditions}`);
  console.log(`Humidity: ${current.humidity}%`);
  console.log(`Wind: ${current.windspeed} km/h ${current.winddir}°`);
  console.log(`UV Index: ${current.uvindex}`);
  console.log('===========================\n');
}

/**
 * Format and display weather forecast
 * @param {Object} weatherData - Weather data from the API
 * @param {number} days - Number of days to display
 */
function displayForecast(weatherData, days = 5) {
  console.log('\n====== Weather Forecast ======');
  
  // Take only the specified number of days
  const forecast = weatherData.days.slice(0, days);
  
  forecast.forEach(day => {
    console.log(`\nDate: ${day.datetime}`);
    console.log(`Temp: ${day.tempmin}°C to ${day.tempmax}°C`);
    console.log(`Conditions: ${day.conditions}`);
    console.log(`Precipitation: ${day.precip} mm`);
    console.log(`Humidity: ${day.humidity}%`);
    console.log('-----------------------------');
  });
  
  console.log('\n=============================');
}

/**
 * Main application function
 */
async function main() {
  console.log('==================================');
  console.log('Welcome to the Weather CLI App');
  console.log('==================================\n');
  
  // Check API key
  if (!apiKey || apiKey === 'ABC123XYZ456') {
    console.error('ERROR: API key not properly configured!');
    console.error('Please set up your API key in the .env file.');
    process.exit(1);
  }
  
  // Main application loop
  async function promptUser() {
    rl.question('\nEnter a location (or "exit" to quit): ', async (location) => {
      if (location.toLowerCase() === 'exit') {
        console.log('\nThank you for using the Weather CLI App. Goodbye!');
        rl.close();
        return;
      }
      
      try {
        const weatherData = await getWeatherData(location);
        
        rl.question('\nView [1] Current weather or [2] 5-day forecast? (1/2): ', (choice) => {
          if (choice === '1') {
            displayCurrentWeather(weatherData);
          } else if (choice === '2') {
            displayForecast(weatherData);
          } else {
            console.log('Invalid choice. Showing current weather by default.');
            displayCurrentWeather(weatherData);
          }
          
          promptUser();
        });
      } catch (error) {
        console.error(`Error: ${error.message}`);
        promptUser();
      }
    });
  }
  
  // Start the prompt loop
  promptUser();
}

// Run the application
main(); 