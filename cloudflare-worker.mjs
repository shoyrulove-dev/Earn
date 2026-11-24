import next from "./.open-next/worker.js";
import { mongoRequestScope } from "./lib/mongo-request-scope.mjs";

export * from "./.open-next/worker.js";

async function closeMongo(scope) {
  try {
    await scope.connection?.destroy();
  } catch (error) {
    console.warn("PureEarn MongoDB cleanup failed", error?.name);
  }
}

function fetchWithMongoScope(request, env, ctx) {
  const scope = {};
  return mongoRequestScope.run(scope, async () => {
    try {
      const response = await next.fetch(request, env, ctx);
      if (!scope.connection && !response.body) return response;
      if (!response.body || response.status === 101) {
        ctx.waitUntil(closeMongo(scope));
        return response;
      }
      // Next may still be rendering after fetch resolves. Close after streaming.
      const stream = new TransformStream();
      ctx.waitUntil(
        response.body.pipeTo(stream.writable).catch(() => {}).finally(() => closeMongo(scope)),
      );
      return new Response(stream.readable, response);
    } catch (error) {
      ctx.waitUntil(closeMongo(scope));
      throw error;
    }
  });
}

export default {
  fetch: fetchWithMongoScope,
  async scheduled(_controller, env, ctx) {
    if (!env.CRON_SECRET) throw new Error("Settlement cron secret is not set");
    const response = await fetchWithMongoScope(
      new Request("https://earn.blissbiovn.com/api/cron/settle-pht", {
        headers: { Authorization: `Bearer ${env.CRON_SECRET}` },
      }),
      env,
      ctx,
    );
    const result = await response.json();
    if (!response.ok || result.ok !== true || result.accessTrade?.error) {
      throw new Error(`PureEarn settlement did not fully complete (HTTP ${response.status})`);
    }
    console.info("PureEarn settlement finished", { settled: result.settled });
  },
};
