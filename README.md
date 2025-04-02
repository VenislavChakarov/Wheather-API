# Weather API

A Node.js API that serves as a wrapper for the Visual Crossing Weather API with in-memory caching for improved performance.

## Features

- Fetches weather data from Visual Crossing API
- Implements in-memory caching using node-cache to reduce external API calls
- Provides current conditions, forecasts, and historical weather data
- Handles error cases and provides clear error messages
- Includes rate limiting to prevent abuse
- Uses environment variables for configuration
- Offers both a REST API and a CLI interface

## Prerequisites

- Node.js (v14+)
- npm (v6+)

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/VenislavChakarov/Wheather-API.git
   cd Wheather-API
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=9090
   WEATHER_API_KEY=your_visual_crossing_api_key
   WEATHER_API_BASE_URL=https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline
   CACHE_EXPIRATION=43200
   RATE_LIMIT_WINDOW_MS=60000
   RATE_LIMIT_MAX_REQUESTS=30
   ```

   > **Note:** You'll need to sign up for a free API key from [Visual Crossing](https://www.visualcrossing.com/weather-api).

## Usage

### REST API

Start the API server:
```
npm start
```

### CLI Version

For systems where network connectivity might be an issue, you can use the CLI version:
```
npm run cli
```

The CLI version provides a simple text-based interface to fetch weather data without using a web server.

## API Endpoints

### Get Weather Data

```
GET /api/weather/:location
```

Fetches comprehensive weather data for a location.

**Parameters:**
- `location` (path parameter): City name, zip code, or coordinates (e.g., "London", "90210", "37.8267,-122.4233")

**Query Parameters:**
- `unitGroup` (optional): Unit system to use (metric, us, uk)
- `include` (optional): Data to include (days,hours,current,alerts)
- `elements` (optional): Specific weather elements to return
- `startDate` (optional): Start date for historical data
- `endDate` (optional): End date for historical data

**Example:**
```
GET /api/weather/London?unitGroup=metric
```

### Get Current Weather

```
GET /api/weather/:location/current
```

Fetches only the current weather conditions for a location.

**Parameters:**
- `location` (path parameter): City name, zip code, or coordinates
- `unitGroup` (optional): Unit system to use (metric, us, uk)

**Example:**
```
GET /api/weather/New%20York/current
```

### Get Weather Forecast

```
GET /api/weather/:location/forecast
```

Fetches forecast data for a location.

**Parameters:**
- `location` (path parameter): City name, zip code, or coordinates
- `unitGroup` (optional): Unit system to use (metric, us, uk)
- `days` (optional): Number of days to include in the forecast

**Example:**
```
GET /api/weather/San%20Francisco/forecast?days=5
```

## Caching

The API uses node-cache for in-memory caching of responses from the Visual Crossing API. By default, cached data expires after 12 hours (configurable via `CACHE_EXPIRATION` in seconds).

The cache key is generated based on the location and query parameters, ensuring that different requests get their own cache entries.

## Rate Limiting

To prevent abuse, the API implements rate limiting. By default, it allows 30 requests per minute per IP address. This can be configured via environment variables.

## Error Handling

The API provides clear error messages for various scenarios:
- Invalid API key
- Location not found
- API rate limit exceeded
- Invalid request parameters
- Server errors

## Troubleshooting

If you experience issues with the web server due to networking constraints, use the CLI version instead:

```
npm run cli
```

## Development

For development, you can use nodemon for automatic server restarts:

```
npm run dev
```

To test connectivity to the Visual Crossing API:

```
npm test
```

## License

This project is licensed under the ISC License - see the LICENSE file for details.
