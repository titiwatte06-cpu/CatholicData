# Church data caching

## Runtime configuration

The API uses Upstash Redis over HTTPS when both variables are configured:

```text
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

Without these variables, or whenever Redis times out or returns an error, the API keeps working with its process-local cache and MongoDB. Redis is an optional cache; MongoDB remains the source of truth. Do not put either value in source control.

The cache key is `churches:all:v1`. The entry is fresh for 60 seconds, then can be served stale for up to 5 more minutes while one background MongoDB refresh runs. The Redis key expires after the full fresh plus stale window. Concurrent cold requests in one server process share one MongoDB query.

## Data flow

```text
Map opens
  -> browser reads localStorage immediately, if present
  -> GET /api/churches with If-None-Match
  -> server checks Redis, then process cache if Redis is unavailable
      -> fresh: return HTTP 200, X-Cache: HIT
      -> stale: return HTTP 200, X-Cache: STALE; refresh MongoDB once in background
      -> miss: query MongoDB once, store cache, return HTTP 200, X-Cache: MISS
  -> unchanged ETag: HTTP 304, no church JSON body
```

The first visit after the Render service sleeps can still wait for Render to wake. The server binds its HTTP port before it connects to MongoDB, answers `/api/health` during that connection, retries MongoDB in the background, and warms the church cache after MongoDB connects. This removes MongoDB/cache warm-up from the HTTP listener startup path; it cannot remove the hosting provider's free-instance wake time.

## Invalidation

Admin create/update/delete, approved add/edit/delete requests, and the checked-in seed scripts invalidate `churches:all:v1`. A MongoDB change stream also invalidates the cache after direct writes made outside this API; MongoDB must support change streams for that path. If the stream cannot start, the cache's six-minute maximum lifetime bounds stale data. In a no-Redis local setup, restart the server after manual database edits if immediate invalidation is needed.

## Browser storage and tiles

`useChurches` stores only the public church JSON and its ETag in `localStorage`, shows it immediately on later visits, and revalidates after 30 seconds or when the tab becomes visible. This is suitable for the current roughly 100-row dataset and avoids IndexedDB's async schema/migration work. Revisit IndexedDB if records or nested schedules grow enough that synchronous JSON parsing causes visible main-thread work or the payload nears browser storage quotas.

No service worker is added: it would duplicate this cache and add another invalidation layer. Do not prefetch or persist OpenStreetMap tiles; the app should follow the tile provider's usage policy.

## Verify in a browser or with curl

```sh
curl -i https://YOUR_API/api/churches
curl -i -H 'If-None-Match: W/"ETAG_FROM_FIRST_RESPONSE"' https://YOUR_API/api/churches
curl -i https://YOUR_API/api/health
```

Check `X-Cache` for `MISS`, `HIT`, or `STALE`; the conditional request should return `304` when the ETag is unchanged. `ETag`, `X-Cache`, and `Cache-Control` are exposed through CORS for browser diagnostics. Authenticated routes use `Cache-Control: no-store`.
