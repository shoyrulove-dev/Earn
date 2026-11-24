import mongoose from "mongoose";
import { mongoRequestScope } from "./mongo-request-scope.mjs";

type Cached = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
const globalForMongoose = globalThis as typeof globalThis & { mongoose: Cached | undefined };
const cached = globalForMongoose.mongoose ?? { conn: null, promise: null };
globalForMongoose.mongoose = cached;

type RequestDB = {
  connection?: mongoose.Connection;
  ready?: Promise<mongoose.Connection>;
};

const getRequestDB = () => mongoRequestScope.getStore() as RequestDB | undefined;

export function scopedModel(name: string, schema: mongoose.Schema) {
  const normal = mongoose.models[name] ?? mongoose.model(name, schema);
  const current = () => {
    const scoped = getRequestDB();
    if (!scoped) return normal;
    if (!scoped.connection) throw new Error("Call connectDB before using a model");
    const connection = scoped.connection;
    // Register related schemas on this connection so populate() resolves its refs.
    for (const [modelName, model] of Object.entries(mongoose.models)) {
      if (!connection.models[modelName]) connection.model(modelName, model.schema);
    }
    return connection.models[name];
  };
  return new Proxy(normal, {
    get(_target, key) {
      const model = current();
      const value = Reflect.get(model, key);
      return typeof value === "function" && key !== "prototype" ? value.bind(model) : value;
    },
    construct(_target, args) {
      return Reflect.construct(current(), args);
    },
    apply(_target, receiver, args) {
      return Reflect.apply(current(), receiver, args);
    },
  });
}

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing MONGODB_URI environment variable");
  const scoped = getRequestDB();
  if (scoped) {
    if (!scoped.ready) {
      scoped.connection = mongoose.createConnection(uri, {
        serverSelectionTimeoutMS: 5_000,
        connectTimeoutMS: 5_000,
        autoCreate: false,
        autoIndex: false,
      });
      scoped.ready = scoped.connection.asPromise();
    }
    return scoped.ready;
  }
  if (cached.conn) return cached.conn;
  cached.promise ??= mongoose.connect(uri).catch((error) => {
    cached.promise = null;
    throw error;
  });
  cached.conn = await cached.promise;
  return cached.conn;
}
