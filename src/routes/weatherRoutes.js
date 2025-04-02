const express = require('express');
const router = express.Router();
const { getWeatherData } = require('../services/weatherService');

/**
 * @route   GET /api/weather/:location
 * @desc    Get weather data for a specific location
 * @access  Public
 */
router.get('/:location', async (req, res) => {
  try {
    const { location } = req.params;
    
    // Extract query parameters
    const {
      unitGroup, // metric (default) or us, uk
      include, // days,hours,current,alerts
      elements, // specific weather elements
      startDate,
      endDate
    } = req.query;
    
    // Optional parameters for the API
    const params = {};
    
    // Add optional parameters if provided
    if (unitGroup) params.unitGroup = unitGroup;
    if (include) params.include = include;
    if (elements) params.elements = elements;
    if (startDate && endDate) {
      params.startDate = startDate;
      params.endDate = endDate;
    }
    
    // Get weather data
    const weatherData = await getWeatherData(location, params);
    
    return res.json(weatherData);
  } catch (error) {
    console.error('Weather route error:', error.message);
    
    // Determine appropriate status code based on error message
    let statusCode = 500;
    
    if (error.message.includes('Location not found')) {
      statusCode = 404;
    } else if (error.message.includes('Invalid request')) {
      statusCode = 400;
    } else if (error.message.includes('API key') || error.message.includes('authentication')) {
      statusCode = 401;
    } else if (error.message.includes('rate limit')) {
      statusCode = 429;
    }
    
    return res.status(statusCode).json({
      error: true,
      message: error.message
    });
  }
});

/**
 * @route   GET /api/weather/:location/current
 * @desc    Get current weather conditions for a specific location
 * @access  Public
 */
router.get('/:location/current', async (req, res) => {
  try {
    const { location } = req.params;
    const { unitGroup } = req.query;
    
    // Get weather data with current conditions only
    const params = {
      include: 'current',
      unitGroup: unitGroup || 'metric'
    };
    
    const weatherData = await getWeatherData(location, params);
    
    // Extract and return only current conditions
    return res.json({
      location: weatherData.resolvedAddress || weatherData.address,
      coordinates: {
        latitude: weatherData.latitude,
        longitude: weatherData.longitude
      },
      current: weatherData.currentConditions,
      timezone: weatherData.timezone
    });
  } catch (error) {
    console.error('Current weather route error:', error.message);
    
    // Determine appropriate status code based on error message
    let statusCode = 500;
    
    if (error.message.includes('Location not found')) {
      statusCode = 404;
    } else if (error.message.includes('Invalid request')) {
      statusCode = 400;
    } else if (error.message.includes('API key') || error.message.includes('authentication')) {
      statusCode = 401;
    } else if (error.message.includes('rate limit')) {
      statusCode = 429;
    }
    
    return res.status(statusCode).json({
      error: true,
      message: error.message
    });
  }
});

/**
 * @route   GET /api/weather/:location/forecast
 * @desc    Get forecast for a specific location
 * @access  Public
 */
router.get('/:location/forecast', async (req, res) => {
  try {
    const { location } = req.params;
    const { unitGroup, days } = req.query;
    
    // Get weather data with forecast
    const params = {
      include: 'days',
      unitGroup: unitGroup || 'metric'
    };
    
    const weatherData = await getWeatherData(location, params);
    
    // Filter days if requested
    let forecastDays = weatherData.days;
    if (days && !isNaN(days) && days > 0) {
      forecastDays = forecastDays.slice(0, parseInt(days));
    }
    
    // Return forecast data
    return res.json({
      location: weatherData.resolvedAddress || weatherData.address,
      coordinates: {
        latitude: weatherData.latitude,
        longitude: weatherData.longitude
      },
      timezone: weatherData.timezone,
      days: forecastDays
    });
  } catch (error) {
    console.error('Forecast route error:', error.message);
    
    // Determine appropriate status code based on error message
    let statusCode = 500;
    
    if (error.message.includes('Location not found')) {
      statusCode = 404;
    } else if (error.message.includes('Invalid request')) {
      statusCode = 400;
    } else if (error.message.includes('API key') || error.message.includes('authentication')) {
      statusCode = 401;
    } else if (error.message.includes('rate limit')) {
      statusCode = 429;
    }
    
    return res.status(statusCode).json({
      error: true,
      message: error.message
    });
  }
});

module.exports = router; 