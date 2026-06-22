import mongoose from "mongoose";
import { env } from "./env";
import { log } from "./logger";

const logger = log("mongo");

// Cache the connection across hot reloads / serverless invocations.
let cached = (global as any)._mongoose as Promise<typeof mongoose> | undefined;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return mongoose;
  if (!cached) {
    cached = mongoose.connect(env.MONGODB_URI).then((m) => {
      logger.info("connected to MongoDB");
      return m;
    });
    (global as any)._mongoose = cached;
  }
  try {
    return await cached;
  } catch (error) {
    cached = undefined;
    (global as any)._mongoose = undefined;
    logger.error({ err: error }, "MongoDB connection error");
    throw new Error("Failed to connect to MongoDB");
  }
};

export { connectDB };
