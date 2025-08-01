import crypto from 'crypto';
import { logger } from '../utils/logger';

interface CacheEntry {
  result: any;
  timestamp: number;
  hitCount: number;
}

export class CacheService {
  private cache = new Map<string, CacheEntry>();
  private readonly TTL = 2 * 60 * 60 * 1000; // 2 hours
  private readonly MAX_SIZE = 1000; // Limit memory usage

  generateCacheKey(content: string, domain: string): string {
    // Create hash from content + domain for similar analysis
    const normalizedContent = content
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 500); // First 500 chars for similarity
    
    return crypto
      .createHash('md5')
      .update(`${normalizedContent}:${domain}`)
      .digest('hex');
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() - entry.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }
    
    // Increment hit count and return
    entry.hitCount++;
    logger.info('Cache hit', { key, hitCount: entry.hitCount });
    return entry.result;
  }

  set(key: string, result: any): void {
    // Clean old entries if cache is full
    if (this.cache.size >= this.MAX_SIZE) {
      this.cleanOldEntries();
    }

    this.cache.set(key, {
      result,
      timestamp: Date.now(),
      hitCount: 0
    });
  }

  private cleanOldEntries(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.TTL) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    // If still full, remove least used entries
    if (this.cache.size >= this.MAX_SIZE) {
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].hitCount - b[1].hitCount)
        .slice(0, 100); // Remove 100 least used
      
      entries.forEach(([key]) => this.cache.delete(key));
      cleaned += entries.length;
    }
    
    logger.info('Cache cleaned', { entriesRemoved: cleaned });
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.MAX_SIZE,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key: key.substring(0, 8),
        age: Date.now() - entry.timestamp,
        hits: entry.hitCount
      }))
    };
  }
}
