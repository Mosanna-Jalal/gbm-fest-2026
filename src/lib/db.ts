import mongoose from "mongoose";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var __mongoose_cache__: MongooseCache | undefined;
}

const globalCache = global.__mongoose_cache__ ?? { conn: null, promise: null };

if (!global.__mongoose_cache__) {
  global.__mongoose_cache__ = globalCache;
}

export async function connectToDatabase() {
  if (globalCache.conn) {
    return globalCache.conn;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set. Add it to your .env.local file.");
  }

  if (!globalCache.promise) {
    globalCache.promise = mongoose.connect(uri, {
      bufferCommands: false,
      dbName: process.env.MONGODB_DB || "gbm_fest",
    });
  }

  globalCache.conn = await globalCache.promise;
  return globalCache.conn;
}
