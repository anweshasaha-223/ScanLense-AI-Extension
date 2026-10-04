interface RateLimitEntry {
  timestamps: number[];
}

export class InMemoryRateLimiter {
  private windowMs: number;
  private maxRequests: number;
  private store: Map<string, RateLimitEntry>;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(maxRequests: number = 10, windowMs: number = 60 * 1000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.store = new Map();

    // Periodic sweep every 2 minutes
    if (typeof setInterval !== 'undefined') {
      this.cleanupInterval = setInterval(() => this.cleanup(), 2 * 60 * 1000);
      if (this.cleanupInterval.unref) {
        this.cleanupInterval.unref();
      }
    }
  }

  public check(ip: string): { allowed: boolean; retryAfter: number; remaining: number } {
    const now = Date.now();
    const cleanIp = ip || 'unknown-client';
    const entry = this.store.get(cleanIp) || { timestamps: [] };

    // Filter out timestamps outside current sliding window
    const windowStart = now - this.windowMs;
    const validTimestamps = entry.timestamps.filter((ts) => ts > windowStart);

    if (validTimestamps.length >= this.maxRequests) {
      // Oldest timestamp in window determines when slot frees up
      const oldest = validTimestamps[0];
      const retryAfterMs = Math.max(1000, oldest + this.windowMs - now);
      const retryAfterSec = Math.ceil(retryAfterMs / 1000);

      this.store.set(cleanIp, { timestamps: validTimestamps });
      return {
        allowed: false,
        retryAfter: retryAfterSec,
        remaining: 0,
      };
    }

    // Allow request and record timestamp
    validTimestamps.push(now);
    this.store.set(cleanIp, { timestamps: validTimestamps });

    return {
      allowed: true,
      retryAfter: 0,
      remaining: Math.max(0, this.maxRequests - validTimestamps.length),
    };
  }

  public reset(ip?: string) {
    if (ip) {
      this.store.delete(ip);
    } else {
      this.store.clear();
    }
  }

  private cleanup() {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    for (const [ip, entry] of this.store.entries()) {
      const valid = entry.timestamps.filter((ts) => ts > windowStart);
      if (valid.length === 0) {
        this.store.delete(ip);
      } else {
        this.store.set(ip, { timestamps: valid });
      }
    }
  }

  public destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
  }
}

export const rateLimiter = new InMemoryRateLimiter(10, 60 * 1000);
