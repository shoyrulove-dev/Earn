import { AsyncLocalStorage } from "node:async_hooks";

export const mongoRequestScope =
  (globalThis[Symbol.for("pureearn.mongoRequestScope")] ??=
    new AsyncLocalStorage());
