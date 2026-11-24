import type { AsyncLocalStorage } from "node:async_hooks";
import type { Connection } from "mongoose";

export const mongoRequestScope: AsyncLocalStorage<{
  connection?: Connection;
  ready?: Promise<Connection>;
}>;
