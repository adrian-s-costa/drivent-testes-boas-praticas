# Redis Caching Setup

This document describes the Redis caching implementation for the events module.

## Prerequisites

Before running the application or tests, you need to start the Docker services:

```bash
docker compose up -d
```

This will start:
- PostgreSQL on port 5433
- Redis on port 6379

## Implementation Details

### 1. Docker Configuration
- Added Redis service to `docker-compose.yml`
- Added `REDIS_HOST` and `REDIS_PORT` environment variables to `.env.example`, `.env`, `.env.development`, and `.env.test`

### 2. Redis Configuration Module
- Created `src/config/redis.ts` with connection management
- Integrated Redis connection into `src/app.ts` initialization

### 3. Cache Middleware
- Created `src/middlewares/cache-middleware.ts`
- Middleware checks `allow-cache` header (must be "true" to enable caching)
- Cache key format: `event:{eventId}`
- TTL: 5 minutes (300 seconds)

### 4. Events Module Updates
- **GET /event**: Added cache middleware and cache writing when `allow-cache: true`
- **POST /event/:id**: New endpoint for write-through cache updates
- Updated service and repository to support event updates by ID

### 5. Tests
- Integration tests in `tests/integration/event.test.ts`:
  - Cache is NOT used when `allow-cache` is false or not provided
  - Cache is used when `allow-cache` is true
  - Cached data is returned on subsequent requests (Postgres not hit)
  - Cache TTL is 5 minutes
  - POST endpoint updates both database and cache
  - 404 returned for non-existent events

## Usage

### Enable Cache in GET Request
```bash
curl -H "allow-cache: true" http://localhost:4000/event
```

### Disable Cache (Default)
```bash
curl http://localhost:4000/event
# or
curl -H "allow-cache: false" http://localhost:4000/event
```

### Update Event (Write-Through Cache)
```bash
curl -X POST http://localhost:4000/event/1 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Event Title",
    "backgroundImageUrl": "http://new-image.com",
    "logoImageUrl": "http://new-logo.com"
  }'
```

## Running Tests

1. Start Docker services:
```bash
docker compose up -d
```

2. Run migrations:
```bash
npm run test:migration:run
```

3. Run tests:
```bash
npm test
# or for specific test file:
npm test -- event.test.ts
```

## Architecture

```
Client Request (with allow-cache: true)
    ↓
Cache Middleware
    ↓
Check Redis Cache
    ↓
├─ Cache Hit → Return Cached Data
└─ Cache Miss → Continue to Controller
                    ↓
                Events Controller
                    ↓
                Events Service
                    ↓
                Event Repository (Postgres)
                    ↓
                Return Data + Write to Cache (5min TTL)
```

## Cache Invalidation

The cache is updated through the POST endpoint:
- POST /event/:id updates the database
- Then writes the new data to cache (write-through pattern)
- Maintains 5-minute TTL on the updated cache entry
