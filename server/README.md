# TriFit Weather Proxy Server

A lightweight Express.js server that proxies OpenWeatherMap API requests. The API key stays server-side and is never exposed to the browser.

## Security Features

| Feature | Description |
|---------|-------------|
| **Server-side API key** | Key stored as env var, never sent to client |
| **CORS whitelist** | Only allowed origins can call the proxy |
| **Rate limiting** | 60 requests per 15 minutes per IP |
| **Helmet** | Adds security headers (CSP, HSTS, etc.) |
| **Input validation** | All query params are validated and sanitized |
| **Minimal response** | Only forwards necessary weather data fields |

## Local Development

```bash
cd server
cp .env.example .env.local
# Edit .env.local and add your OpenWeatherMap API key
npm install
npm start
```

Server runs at `http://localhost:3001`

## Deploy to Render.com

1. Go to [render.com](https://render.com) → **New** → **Web Service**
2. Connect your GitHub repo (`jikonka/trifit`)
3. Configure:
   - **Name**: `trifit-api`
   - **Root Directory**: `server`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add environment variable:
   - `OWM_API_KEY` = your OpenWeatherMap API key
5. Click **Deploy**

Your proxy will be available at `https://trifit-api.onrender.com`

## API Endpoint

### `GET /api/weather`

Query by coordinates:
```
GET /api/weather?lat=31.23&lon=121.47
```

Query by city name:
```
GET /api/weather?city=Shanghai
```

Response: OpenWeatherMap weather data (with API key stripped).
