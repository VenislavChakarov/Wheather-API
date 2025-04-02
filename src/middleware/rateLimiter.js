const rateLimit = require('express-rate-limit');

// Load environment variables
const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000; // 1 minute default
const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 30; // 30 requests per minute default

// Create rate limiter middleware
const limiter = rateLimit({
  windowMs,
  max: maxRequests,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    status: 429,
    error: 'Too many requests',
    message: `You have exceeded the rate limit of ${maxRequests} requests per ${windowMs / 1000} seconds`
  },
  // Simple in-memory store instead of the default Memory Store
  skipSuccessfulRequests: false, // Track all requests
  skip: (req) => {
    // Skip health checks
    return req.path === '/health';
  }
});

module.exports = limiter; 