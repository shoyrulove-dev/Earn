export class AccessTradeRateLimit extends Error {
  readonly retryAfterMs: number;

  constructor(retryAfterMs: number) {
    super("AccessTrade is temporarily busy. Please try again in a moment.");
    this.name = "AccessTradeRateLimit";
    this.retryAfterMs = retryAfterMs;
  }
}

export function retryAfterMs(header: string | null, now = Date.now()) {
  if (!header?.trim()) return 60_000;
  const value = header.trim();
  const requested = /^\d+$/.test(value) ? Number(value) * 1_000 : Date.parse(value) - now;
  return Number.isFinite(requested) ? Math.max(30_000, requested) : 60_000;
}

export async function readAccessTradePages<T>(
  request: (page: number) => Promise<Response>,
  read: (payload: unknown) => T[],
  options = { pageSize: 20, maxPages: 10, delayMs: 350 },
): Promise<T[]> {
  const rows: T[] = [];
  for (let page = 1; page <= options.maxPages; page++) {
    if (page > 1 && options.delayMs) await new Promise((resolve) => setTimeout(resolve, options.delayMs));
    const response = await request(page);
    if (response.status === 429) throw new AccessTradeRateLimit(retryAfterMs(response.headers.get("Retry-After")));
    if (!response.ok) throw new Error(`AccessTrade API failed: ${response.status}`);
    const items = read(await response.json());
    rows.push(...items);
    if (items.length < options.pageSize) break;
  }
  return rows;
}
