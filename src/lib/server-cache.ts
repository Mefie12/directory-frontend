type CacheEntry = { data: unknown; expiresAt: number };
const store = new Map<string, CacheEntry>();

export function getCached(key: string): unknown | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.data;
}

export function setCached(key: string, data: unknown, ttlMs: number): void {
  store.set(key, { data, expiresAt: Date.now() + ttlMs });
}
