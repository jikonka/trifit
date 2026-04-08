/**
 * TriFit Weather Proxy Server
 * 
 * Security design:
 * - API keys stay server-side only (via environment variables)
 * - CORS whitelist restricts which origins can call this proxy
 * - Rate limiting prevents abuse / key exhaustion
 * - Helmet adds security headers
 * - Input validation on all query parameters
 * - No API key is ever sent to the client
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3001;

// --- Security: Helmet (security headers) ---
app.use(helmet());

// --- Security: CORS whitelist ---
const ALLOWED_ORIGINS = [
  'https://jikonka.github.io',
  'http://localhost:8080',
  'http://127.0.0.1:8080',
  'http://localhost:5500',   // Live Server
  'http://127.0.0.1:5500',
];

// Allow additional origins from env (comma-separated)
if (process.env.ALLOWED_ORIGINS) {
  process.env.ALLOWED_ORIGINS.split(',').forEach(origin => {
    ALLOWED_ORIGINS.push(origin.trim());
  });
}

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (e.g. curl, mobile apps in dev)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS: Origin not allowed'), false);
  },
  methods: ['GET'],
  optionsSuccessStatus: 200,
}));

// --- Security: Rate limiting ---
const weatherLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60,                    // max 60 requests per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});

// --- Health check ---
app.get('/', (req, res) => {
  res.json({
    service: 'TriFit Weather Proxy',
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// --- Weather API proxy ---
app.get('/api/weather', weatherLimiter, async (req, res) => {
  const apiKey = process.env.OWM_API_KEY;
  if (!apiKey) {
    console.error('[ERROR] OWM_API_KEY not configured');
    return res.status(500).json({ error: 'Weather service not configured on server.' });
  }

  const { lat, lon, city } = req.query;

  // Input validation
  if (!city && (!lat || !lon)) {
    return res.status(400).json({ error: 'Provide either "city" or "lat" & "lon" query parameters.' });
  }

  if (lat && (isNaN(Number(lat)) || Number(lat) < -90 || Number(lat) > 90)) {
    return res.status(400).json({ error: 'Invalid latitude. Must be between -90 and 90.' });
  }
  if (lon && (isNaN(Number(lon)) || Number(lon) < -180 || Number(lon) > 180)) {
    return res.status(400).json({ error: 'Invalid longitude. Must be between -180 and 180.' });
  }
  if (city && (typeof city !== 'string' || city.length > 100 || !/^[a-zA-Z\s\-,.]+$/.test(city))) {
    return res.status(400).json({ error: 'Invalid city name.' });
  }

  // Build OpenWeatherMap URL (API key stays server-side!)
  let owmUrl;
  if (lat && lon) {
    owmUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&appid=${apiKey}&units=metric`;
  } else {
    owmUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
  }

  try {
    const response = await fetch(owmUrl);
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.message || 'Weather API error',
      });
    }

    // Only forward the data we need — never leak the API key
    res.json({
      name: data.name,
      weather: data.weather,
      main: {
        temp: data.main.temp,
        feels_like: data.main.feels_like,
        humidity: data.main.humidity,
        temp_min: data.main.temp_min,
        temp_max: data.main.temp_max,
      },
      wind: {
        speed: data.wind.speed,
        deg: data.wind.deg,
      },
      visibility: data.visibility,
      clouds: data.clouds,
      dt: data.dt,
      sys: {
        country: data.sys.country,
        sunrise: data.sys.sunrise,
        sunset: data.sys.sunset,
      },
    });
  } catch (err) {
    console.error('[ERROR] Weather fetch failed:', err.message);
    res.status(502).json({ error: 'Failed to fetch weather data from upstream.' });
  }
});

// --- 404 handler ---
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// --- Error handler ---
app.use((err, req, res, next) => {
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({ error: 'Origin not allowed' });
  }
  console.error('[ERROR]', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`✅ TriFit Weather Proxy running on port ${PORT}`);
  console.log(`📡 Allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);
  console.log(`🔑 OWM API Key: ${process.env.OWM_API_KEY ? '✓ configured' : '✗ MISSING!'}`);
});
