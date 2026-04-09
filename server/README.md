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

## Deploy to Render.com (Free, No Credit Card Required)

1. 打开 [render.com](https://render.com) → 用 **GitHub 账号**注册/登录
2. 点击 **New** → **Web Service**
3. 连接你的 GitHub 仓库（`jikonka/trifit`）
4. 配置：
   - **Name**: `trifit-api`
   - **Root Directory**: `server`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. 在 **Environment** 中添加环境变量：
   - `OWM_API_KEY` = 你的 OpenWeatherMap API 密钥
6. 点击 **Deploy**

你的后端地址为：`https://trifit-api.onrender.com`

> ⚠️ 免费层在 15 分钟无访问后会休眠，第一次唤醒请求约需 30-60 秒。

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
