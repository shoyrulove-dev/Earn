import assert from "node:assert/strict";
import test from "node:test";
import { AccessTradeRateLimit, readAccessTradePages, retryAfterMs } from "../lib/accesstrade-pagination.ts";

const options = { pageSize: 2, maxPages: 10, delayMs: 0 };

test("loads pages in order and stops after the first short page", async () => {
  const calls = [];
  let fetching = false;
  const rows = await readAccessTradePages(async (page) => {
    assert.equal(fetching, false);
    fetching = true;
    calls.push(page);
    await Promise.resolve();
    fetching = false;
    return Response.json(page === 1 ? [1, 2] : [3]);
  }, payload => payload, options);
  assert.deepEqual(calls, [1, 2]);
  assert.deepEqual(rows, [1, 2, 3]);
});

test("stops immediately on 429 and retains Retry-After", async () => {
  const calls = [];
  await assert.rejects(readAccessTradePages(async (page) => {
    calls.push(page);
    return page === 1 ? Response.json([1, 2]) : new Response(null, { status: 429, headers: { "Retry-After": "120" } });
  }, payload => payload, options), error => error instanceof AccessTradeRateLimit && error.retryAfterMs === 120_000);
  assert.deepEqual(calls, [1, 2]);
});

test("handles missing, numeric, and date cooldown headers", () => {
  const now = Date.UTC(2026, 0, 1);
  assert.equal(retryAfterMs(null, now), 60_000);
  assert.equal(retryAfterMs("2", now), 30_000);
  assert.equal(retryAfterMs(new Date(now + 90_000).toUTCString(), now), 90_000);
});
