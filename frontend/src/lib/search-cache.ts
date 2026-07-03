
/**
 * Client-side search cache for low-bandwidth environments.
 * Uses localStorage for persistent caching with configurable TTL.
 */

interface CachedSearch {
  query: string;
  timestamp: number;
  data: unknown;
}

const CACHE_KEY = "oau_cse_search_cache";
const DEFAULT_TTL_MS = 30 * 60 * 1000; // 30 minutes
const MAX_CACHE_ENTRIES = 50;

class SearchCache {
  private cache: Map<string, CachedSearch>;

  constructor() {
    this.cache = this.loadFromStorage();
  }

  private loadFromStorage(): Map<string, CachedSearch> {
    try {
      const stored = localStorage.getItem(CACHE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        return new Map(Object.entries(data));
      }
    } catch (e) {
      console.warn("Failed to load search cache from localStorage:", e);
    }
    return new Map();
  }

  private saveToStorage(): void {
    try {
      const data = Object.fromEntries(this.cache);
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn("Failed to save search cache to localStorage:", e);
    }
  }

  private cleanOldEntries(): void {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());

    entries.forEach(([key, value]) => {
      if (now - value.timestamp > DEFAULT_TTL_MS) {
        this.cache.delete(key);
      }
    });

    if (this.cache.size > MAX_CACHE_ENTRIES) {
      const sorted = Array.from(this.cache.entries()).sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toRemove = sorted.slice(0, this.cache.size - MAX_CACHE_ENTRIES);
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  get<T = unknown>(query: string): T | null {
    const normalized = query.toLowerCase().trim();
    const cached = this.cache.get(normalized);

    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > DEFAULT_TTL_MS) {
      this.cache.delete(normalized);
      this.saveToStorage();
      return null;
    }

    return cached.data as T;
  }

  set<T = unknown>(query: string, data: T): void {
    const normalized = query.toLowerCase().trim();
    this.cache.set(normalized, {
      query: normalized,
      timestamp: Date.now(),
      data: data
    });
    this.cleanOldEntries();
    this.saveToStorage();
  }

  clear(): void {
    this.cache.clear();
    try {
      localStorage.removeItem(CACHE_KEY);
    } catch (e) {
      console.warn("Failed to clear search cache from localStorage:", e);
    }
  }

  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export const searchCache = new SearchCache();
