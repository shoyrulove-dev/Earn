import { getDatabaseConnection } from "./mongodb";
import { AccessTradeRateLimit } from "./accesstrade-pagination";

const TTL = 10 * 60_000;
const STALE_LIMIT = 24 * 60 * 60_000;
const LEASE_DURATION = 180_000;

type Entry<T> = {
  _id: string;
  value?: T;
  fetchedAt: number;
  nextAttempt: number;
  leaseUntil: number;
  owner?: string;
};

export async function cachedAccessTradeCatalog<T>(cacheId: string, fetchCatalog: () => Promise<T>): Promise<T> {
  const connection = await getDatabaseConnection();
  const cache = connection.db!.collection<Entry<T>>("accesstrade_catalog_cache");
  let existing = await cache.findOne({ _id: cacheId });
  const now = Date.now();
  if (existing?.value !== undefined && existing.fetchedAt > now - TTL) return existing.value;
  if (!existing) {
    try {
      await cache.updateOne({ _id: cacheId }, { $setOnInsert: { fetchedAt: 0, nextAttempt: 0, leaseUntil: 0 } }, { upsert: true });
    } catch (error) {
      if (!(error && typeof error === "object" && "code" in error && error.code === 11000)) throw error;
    }
  }
  const owner = crypto.randomUUID();
  const lease = await cache.findOneAndUpdate(
    { _id: cacheId, nextAttempt: { $lte: now }, leaseUntil: { $lte: now }, fetchedAt: { $lte: now - TTL } },
    { $set: { owner, leaseUntil: now + LEASE_DURATION } },
  );
  const stale = (entry: Entry<T> | null) => entry && entry.value !== undefined && entry.fetchedAt > Date.now() - STALE_LIMIT ? entry.value : undefined;
  if (!lease) {
    existing = await cache.findOne({ _id: cacheId });
    const value = stale(existing);
    if (value !== undefined) return value;
    throw new AccessTradeRateLimit(Math.max(3_000, (existing?.nextAttempt ?? 0) - Date.now()));
  }
  try {
    const value = await fetchCatalog();
    await cache.updateOne({ _id: cacheId, owner }, { $set: { value, fetchedAt: Date.now(), nextAttempt: 0, leaseUntil: 0 }, $unset: { owner: "" } });
    return value;
  } catch (error) {
    const wait = error instanceof AccessTradeRateLimit ? error.retryAfterMs : 60_000;
    await cache.updateOne({ _id: cacheId, owner }, { $set: { nextAttempt: Date.now() + wait, leaseUntil: 0 }, $unset: { owner: "" } });
    const value = stale(lease);
    if (value !== undefined) return value;
    throw error;
  }
}
