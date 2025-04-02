require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const weatherRoutes = require('./src/routes/weatherRoutes');
const rateLimiter = require('./src/middleware/rateLimiter');
const { cacheClient } = require('./src/config/cache');

// Check for required environment variables
function checkEnvironment() {
  const apiKey = process.env.WEATHER_API_KEY;
  
  if (!apiKey) {
    console.error('\n❌ ERROR: API key not configured!');
    console.error('Please set the WEATHER_API_KEY in your .env file');
    return false;
  }
  
  if (apiKey === 'ABC123XYZ456') {
    console.error('\n❌ ERROR: You are using a placeholder API key!');
    console.error('Please sign up for a free account at https://www.visualcrossing.com/weather-api');
    console.error('Then update your .env file with your actual API key');
    return false;
  }
  
  return true;
}

// Initialize express app
const app = express();
const PORT = process.env.PORT || 9090;

// Apply middlewares
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies

// Apply rate limiting
app.use(rateLimiter);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    message: 'Weather API is running',
    timestamp: new Date().toISOString(),
    cache: {
      type: 'node-cache',
      enabled: !!cacheClient
    }
  });
});

// API routes
app.use('/api/weather', weatherRoutes);

// Default route for API documentation
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Weather API',
    endpoints: {
      health: '/health',
      weather: '/api/weather/:location',
      current: '/api/weather/:location/current',
      forecast: '/api/weather/:location/forecast'
    },
    documentation: 'See README.md for detailed usage information',
    alternativeUsage: 'If you experience connectivity issues, try the CLI version with: npm run cli'
  });
});

// Error handling middleware
app.use((req, res, next) => {
  res.status(404).json({
    error: true,
    message: `Route ${req.originalUrl} not found`
  });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({
    error: true,
    message: 'Internal server error'
  });
});

// Try different ports if the primary port is unavailable
function startServerOnAvailablePort(ports, index = 0) {
  if (index >= ports.length) {
    console.error('\n❌ Could not start server on any of the specified ports.');
    console.error('You can still use the CLI version with: npm run cli');
    process.exit(1);
    return;
  }
  
  const port = ports[index];
  
  try {
    const server = app.listen(port, () => {
      console.log('\n===================================');
      console.log('       WEATHER API SERVER');
      console.log('===================================\n');
      console.log(`⚡️ Server running on http://localhost:${port}`);
      console.log(`Try visiting http://localhost:${port}/health in your browser`);
      console.log('');
      console.log('If you have connectivity issues, use the CLI version:');
      console.log('npm run cli');
    });
    
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`\n⚠️ Port ${port} is already in use, trying next port...`);
        startServerOnAvailablePort(ports, index + 1);
      } else {
        console.error(`\n❌ Error starting server on port ${port}:`, err.message);
        startServerOnAvailablePort(ports, index + 1);
      }
    });
  } catch (err) {
    console.error(`\n❌ Failed to start server on port ${port}:`, err.message);
    startServerOnAvailablePort(ports, index + 1);
  }
}

// Start the server if environment check passes
if (checkEnvironment()) {
  const portOptions = [PORT, 8080, 3000, 5000, 9090, 9091, 9092];
  startServerOnAvailablePort(portOptions);
} else {
  console.error('\n❌ Server not started due to configuration issues');
  console.error('Please fix the issues above and try again.');
  process.exit(1);
} 