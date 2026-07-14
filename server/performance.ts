/**
 * Performance optimization utilities for Nile Leaders CRM
 * - Query result caching
 * - Rate limiting
 * - Response compression
 */

import { LRUCache } from "lru-cache";

// Simple in-memory cache for frequently accessed data
const cache = new LRUCache<string, any>({
  max: 500, // Max 500 items
  maxSize: 50 * 1024 * 1024, // 50MB max size
  ttl: 1000 * 60 * 5, // 5 minute TTL
  sizeCalculation: (item: any) => JSON.stringify(item).length,
  allowStale: true,
});

/**
 * Cache decorator for query results
 * @param key Cache key
 * @param ttl Time to live in milliseconds
 */
export function withCache<T>(key: string, fn: () => Promise<T>, ttl = 1000 * 60 * 5): Promise<T> {
  const cached = cache.get(key);
  if (cached) {
    return Promise.resolve(cached as T);
  }

  return fn().then((result) => {
    cache.set(key, result, { ttl });
    return result;
  });
}

/**
 * Invalidate cache by key pattern
 */
export function invalidateCache(pattern: string | RegExp) {
  const regex = typeof pattern === "string" ? new RegExp(pattern) : pattern;
  const keysToDelete: string[] = [];
  cache.forEach((_, key) => {
    if (regex.test(key)) {
      keysToDelete.push(key);
    }
  });
  keysToDelete.forEach(key => cache.delete(key));
}

/**
 * Rate limiter for API endpoints
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(key: string, maxRequests = 100, windowMs = 60000): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count < maxRequests) {
    record.count++;
    return true;
  }

  return false;
}

/**
 * Cleanup old rate limit records
 */
export function cleanupRateLimit() {
  const now = Date.now();
  const keysToDelete: string[] = [];
  rateLimitStore.forEach((record, key) => {
    if (now > record.resetTime) {
      keysToDelete.push(key);
    }
  });
  keysToDelete.forEach(key => rateLimitStore.delete(key));
}

// Cleanup every 5 minutes
setInterval(cleanupRateLimit, 1000 * 60 * 5);
