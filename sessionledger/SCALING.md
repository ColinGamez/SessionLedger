# SessionLedger — Performance & Scaling (10k+ Users)

## Database (Supabase / Postgres)

### Indexes already in schema
- `sessions_user_id_idx` — all per-user queries
- `sessions_started_at_idx` — composite (user_id, started_at DESC) for sorted pagination
- `sessions_tags_gin_idx` — GIN index for `@>` array containment
- `sessions_title_trgm_idx` — trigram index for future fuzzy search

### Additional recommendations
```sql
-- If you add full aggregate queries for large user datasets:
CREATE MATERIALIZED VIEW user_session_stats AS
  SELECT
    user_id,
    COUNT(*)              AS session_count,
    SUM(in_amount)        AS total_in,
    SUM(out_amount)       AS total_out,
    SUM(out_amount - in_amount) AS net_profit
  FROM sessions
  GROUP BY user_id;

CREATE UNIQUE INDEX ON user_session_stats(user_id);

-- Refresh after writes (or via pg_cron every minute):
-- REFRESH MATERIALIZED VIEW CONCURRENTLY user_session_stats;
```

### Connection pooling
- Enable **PgBouncer** in Supabase project settings (transaction mode)
- Update connection string to use port `6543` (pooler) for API routes
- Direct connection (port `5432`) only for migrations

### Row limits
- Supabase Free: 500MB. Upgrade to Pro ($25/mo) for 8GB.
- At ~1KB per session row, 10k users × 1000 sessions = ~10GB peak. Plan accordingly.

---

## API Layer (Next.js on Vercel)

### Caching strategy
```typescript
// Server Component data fetching — cache per user, revalidate on mutation
export const revalidate = 0  // dashboard: always fresh
// OR use unstable_cache for expensive aggregations:
import { unstable_cache } from 'next/cache'

const getCachedStats = unstable_cache(
  async (userId: string) => { /* aggregate query */ },
  ['user-stats'],
  { revalidate: 60, tags: [`user-${userId}-stats`] }
)
// Invalidate with: revalidateTag(`user-${userId}-stats`) after writes
```

### Rate limiting
Add rate limiting to all mutation routes using Upstash Redis:
```typescript
// npm install @upstash/ratelimit @upstash/redis
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(20, '1 m'), // 20 req/min per user
})

// In API route:
const { success } = await ratelimit.limit(user.id)
if (!success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
```

### Edge runtime for auth-sensitive routes
```typescript
// middleware.ts already runs on Edge — keep it lean
// Move heavy validation out of middleware into route handlers
```

---

## Frontend

### Pagination
- API already returns `{ data, meta: { total, page, limit, totalPages } }`
- Implement cursor-based pagination for sessions list (better for large datasets than offset)

### Optimistic updates
```typescript
// After POST /api/sessions, optimistically add to local state
// before server response confirms — reduces perceived latency
```

### Bundle size
- `stripe` is server-only — never imported in client components
- Supabase browser client is a singleton (already implemented)
- Use `next/dynamic` for heavy client components (charts, editors)

---

## Observability

| Tool | Purpose |
|------|---------|
| Vercel Analytics | Web vitals, page performance |
| Sentry | Error tracking (add `@sentry/nextjs`) |
| Logflare / Axiom | Structured log aggregation from Vercel functions |
| Stripe Dashboard | Webhook delivery success rates, payment failures |
| Supabase Dashboard | Slow query logs, connection count, DB size |

### Structured logging pattern
```typescript
// src/lib/utils/logger.ts
export const log = {
  info: (msg: string, meta?: object) =>
    console.log(JSON.stringify({ level: 'info', msg, ...meta, ts: new Date().toISOString() })),
  error: (msg: string, meta?: object) =>
    console.error(JSON.stringify({ level: 'error', msg, ...meta, ts: new Date().toISOString() })),
}
```

---

## Multi-tenancy Scaling Path

At 10k+ active users:
1. **Supabase Pro** — connection pooler, larger DB, daily backups
2. **Vercel Pro** — increased function concurrency, larger payload limits
3. **Read replicas** — Supabase supports read replicas for analytics queries
4. **Queue webhook processing** — use Inngest or QStash to process Stripe webhooks async, avoiding timeout issues
5. **CDN for static assets** — already handled by Vercel Edge Network
