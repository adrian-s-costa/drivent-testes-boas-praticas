# Redis Caching Implementation Summary

## Problem Statement
Implement Redis caching for the events endpoint with:
- Optional caching via `allow-cache` header
- 5-minute TTL
- Cache key based on event ID
- Write-through cache updates via POST /event/:id
- Docker configuration for Redis
- Comprehensive tests

## Files Modified

### 1. Docker Configuration
**File:** `docker-compose.yml`
- Added Redis service (redis:7-alpine)
- Exposed on port 6379
- Added healthcheck

### 2. Environment Configuration
**Files:** `.env.example`, `.env`, `.env.development`, `.env.test`
- Added `REDIS_HOST` variable
- Added `REDIS_PORT` variable

### 3. Redis Configuration Module
**File:** `src/config/redis.ts` (NEW)
- Created Redis client connection management
- Exported `connectRedis()`, `disconnectRedis()`, `getRedis()`
- Added error handling and reconnection strategy

**File:** `src/config/index.ts`
- Exported Redis configuration

**File:** `src/app.ts`
- Imported Redis connection functions
- Added `connectRedis()` to `init()`
- Added `disconnectRedis()` to `close()`

### 4. Cache Middleware
**File:** `src/middlewares/cache-middleware.ts` (NEW)
- Created `cacheMiddleware()` to check cache before controller
- Created `setCacheData()` to write data to cache with 5-min TTL
- Created `invalidateCache()` for cache invalidation
- Cache key format: `event:{eventId}`

**File:** `src/middlewares/index.ts`
- Exported cache middleware

### 5. Events Module Updates

**File:** `src/controllers/events-controller.ts`
- Modified `getDefaultEvent()` to write to cache when `allow-cache: true`
- Added `updateEvent()` for POST /event/:id endpoint
- Write-through pattern: update DB + update cache

**File:** `src/controllers/index.ts`
- Already exports all controllers (no change needed)

**File:** `src/services/events-service/index.ts`
- Added `updateEvent()` function
- Validates event exists before update
- Returns formatted event data

**File:** `src/repositories/event-repository/index.ts`
- Added `findById()` function
- Added `update()` function

**File:** `src/routers/events-router.ts`
- Added `cacheMiddleware` to GET /event route
- Added POST /event/:id route

### 6. Test Updates

**File:** `tests/helpers.ts`
- Added `cleanRedis()` function to flush Redis between tests

**File:** `tests/integration/event.test.ts`
- Added cache-related tests:
  1. Cache not used when `allow-cache` is false
  2. Cache not used when `allow-cache` header is not provided
  3. Cache is written when `allow-cache: true`
  4. Cached data is returned on subsequent requests (Postgres not hit)
  5. Cache TTL is 5 minutes
  6. POST /event/:id updates both DB and cache
  7. POST returns 404 for non-existent event

### 7. Documentation

**File:** `README.md`
- Added Redis to features section
- Updated Docker instructions
- Added Redis environment variables documentation

**File:** `REDIS_SETUP.md` (NEW)
- Comprehensive setup guide
- Usage examples
- Architecture diagram
- Testing instructions

**File:** `IMPLEMENTATION_SUMMARY.md` (NEW - this file)
- Complete change summary

## Dependencies

**File:** `package.json`
- Downgraded `redis` from 6.1.0 to ^4.6.0 for Jest compatibility

## Cache Behavior

### GET /event

**Without cache (default):**
```
Request → Controller → Service → Repository → Database → Response
```

**With allow-cache: false:**
```
Request → Middleware (skip) → Controller → Service → Repository → Database → Response
```

**With allow-cache: true (first request):**
```
Request → Middleware (miss) → Controller → Service → Repository → Database → Write Cache → Response
```

**With allow-cache: true (subsequent requests within 5 min):**
```
Request → Middleware (hit) → Return Cached Data
```

### POST /event/:id

```
Request → Controller → Service → Repository → Database → Update Cache → Response
```

## Testing

### Prerequisites
1. Start Docker services:
```bash
docker compose up -d
```

2. Run migrations:
```bash
npm run test:migration:run
```

### Run Tests
```bash
npm test
# or
npm test -- event.test.ts
```

### Test Coverage
- Cache disabled by default ✓
- Cache enabled with header ✓
- Cache hit behavior (Postgres not queried) ✓
- Cache TTL validation ✓
- Write-through updates ✓
- Error handling ✓

## API Usage

### Get Event (with cache)
```bash
curl -H "allow-cache: true" http://localhost:4000/event
```

### Get Event (without cache)
```bash
curl http://localhost:4000/event
```

### Update Event (write-through)
```bash
curl -X POST http://localhost:4000/event/1 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Title",
    "backgroundImageUrl": "http://image.url",
    "logoImageUrl": "http://logo.url",
    "startsAt": "2024-01-01T00:00:00.000Z",
    "endsAt": "2024-01-31T23:59:59.000Z"
  }'
```

## Technical Decisions

1. **Redis Version**: Downgraded to 4.6.x for better Jest/ts-jest compatibility
2. **Cache Key Strategy**: `event:{id}` for per-event granularity
3. **TTL**: 5 minutes (300 seconds) as specified
4. **Cache Pattern**: Write-through for POST updates (immediate consistency)
5. **Opt-in Caching**: Requires explicit `allow-cache: true` header (safe default)
6. **Error Handling**: Graceful degradation if Redis is unavailable

## Constraints Satisfied

- ✅ Redis caching module created
- ✅ Caching on events endpoint
- ✅ `allow-cache` header support (true/false, defaults to no cache)
- ✅ 5-minute TTL
- ✅ Cache key uses event ID
- ✅ POST /event/:id endpoint for cache updates
- ✅ Write-through pattern (update DB + cache)
- ✅ Docker configuration for Redis
- ✅ Same pattern as Postgres configuration
- ✅ Tests verify Postgres is not hit when cache is enabled
- ✅ Database populated according to Prisma schema constraints
