import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { config } from '../config';

/**
 * CURSOR AGENT INSTRUCTION:
 * Apply `authenticate` (or `checkRateLimit` directly if auth is handled elsewhere)
 * to every route that calls an AI provider (OpenAI, Grok, Anthropic).
 *
 * Three limiters run in order on every request:
 *   1. Burst guard   — 10 req / 10 min per user  (sliding window)
 *   2. Per-user      — 30 req / 24 h per user     (fixed window)
 *   3. Per-app global — 1000 req / 24 h            (fixed window)
 *
 * Order: global → burst → per-user.
 * Global is checked first so a saturated app fails fast before hitting Redis
 * for user-level keys.
 *
 * Redis key structure (Upstash appends the identifier after the prefix):
 *   rate:global:{PROJECT_SLUG}          — single key, all users share it
 *   rate:burst:{PROJECT_SLUG}:{uid}     — one key per user
 *   rate:user:{PROJECT_SLUG}:{uid}      — one key per user
 *
 * Set PROJECT_SLUG to a short unique kebab-case name for this app,
 * e.g. 'recipe-gen', 'portfolio-chat'. It must be unique across your
 * portfolio so per-app counters don't collide in the shared Redis instance.
 */

// ─── Config ──────────────────────────────────────────────────────────────────

const PROJECT_SLUG = 'REPLACE_ME'; // e.g. 'recipe-gen'

const RATE_LIMIT_BURST_REQUESTS = 10;
const RATE_LIMIT_BURST_WINDOW = '10 m';

const RATE_LIMIT_USER_PER_DAY = 30;
const RATE_LIMIT_GLOBAL_PER_DAY = 1000;

// ─── Redis client ─────────────────────────────────────────────────────────────

const redis = new Redis({
  url: config.upstashRedisUrl,
  token: config.upstashRedisToken,
});

// ─── Limiters ─────────────────────────────────────────────────────────────────

/** Per-app ceiling — checked first so a saturated app fails fast. */
const globalLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(RATE_LIMIT_GLOBAL_PER_DAY, '24 h'),
  prefix: `rate:global:${PROJECT_SLUG}`,
});

/**
 * Burst guard — sliding window so rapid-fire requests are caught even when
 * the fixed-window counter hasn't yet incremented significantly.
 */
const burstLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(RATE_LIMIT_BURST_REQUESTS, RATE_LIMIT_BURST_WINDOW),
  prefix: `rate:burst:${PROJECT_SLUG}`,
});

/** Daily per-user cap. */
const userLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(RATE_LIMIT_USER_PER_DAY, '24 h'),
  prefix: `rate:user:${PROJECT_SLUG}`,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function retryAfterSeconds(resetMs: number): number {
  return Math.max(0, Math.ceil((resetMs - Date.now()) / 1000));
}

function rateLimitResponse(detail: string, retryAfter: number): Response {
  return new Response(
    JSON.stringify({
      error: 'RateLimitExceeded',
      detail,
      retryAfter,
    }),
    { status: 429, headers: { 'Content-Type': 'application/json' } }
  );
}

// ─── Core check ───────────────────────────────────────────────────────────────

/**
 * Runs all three rate limit checks for a given uid.
 * Throws a 429 Response if any limit is exceeded.
 * Call order: global → burst → per-user.
 */
export async function checkRateLimit(uid: string): Promise<void> {
  const globalRes = await globalLimiter.limit('app');
  if (!globalRes.success) {
    throw rateLimitResponse(
      `This app has reached its daily request limit (${RATE_LIMIT_GLOBAL_PER_DAY}/day). Try again tomorrow.`,
      retryAfterSeconds(globalRes.reset)
    );
  }

  const burstRes = await burstLimiter.limit(uid);
  if (!burstRes.success) {
    throw rateLimitResponse(
      `Too many requests in a short period. Please wait a moment before trying again.`,
      retryAfterSeconds(burstRes.reset)
    );
  }

  const userRes = await userLimiter.limit(uid);
  if (!userRes.success) {
    throw rateLimitResponse(
      `You have reached your daily request limit (${RATE_LIMIT_USER_PER_DAY}/day). Try again tomorrow.`,
      retryAfterSeconds(userRes.reset)
    );
  }
}

// ─── Express middleware ───────────────────────────────────────────────────────

/**
 * Express middleware version of checkRateLimit.
 * Requires that a previous middleware has attached `res.locals.uid` (e.g. after
 * Firebase token verification). Returns 429 JSON if any limit is exceeded.
 *
 * Usage:
 *   router.post('/generate', verifyFirebaseToken, aiRateLimiter, generateHandler);
 */
export async function aiRateLimiter(
  req: import('express').Request,
  res: import('express').Response,
  next: import('express').NextFunction
): Promise<void> {
  const uid: string | undefined = res.locals.uid;

  if (!uid) {
    res.status(401).json({ error: 'Unauthorized', detail: 'No uid found on request.' });
    return;
  }

  try {
    await checkRateLimit(uid);
    next();
  } catch (err) {
    if (err instanceof Response) {
      const body = await err.json();
      res.status(429).set('Content-Type', 'application/json').json(body);
      return;
    }
    next(err);
  }
}

// ─── Firebase auth + rate limit combined ─────────────────────────────────────

/**
 * Convenience function for non-Express handlers (e.g. serverless functions,
 * Remix loaders, Next.js route handlers) that use the Web Request API.
 *
 * Verifies the Firebase Bearer token, then runs all rate limit checks.
 * Returns the decoded token on success; throws a Response on failure.
 *
 * Usage:
 *   const user = await authenticate(req);
 *   // user.uid, user.email, etc. are available here
 */
export async function authenticate(req: Request): Promise<import('firebase-admin').auth.DecodedIdToken> {
  const { verifyToken } = await import('./firebase-admin');
  const user = await verifyToken(req);
  await checkRateLimit(user.uid);
  return user;
}
