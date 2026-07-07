import * as redis from "redis";

export type RedisClient = ReturnType<typeof redis.createClient>;

let redisClient: RedisClient;

export async function connectRedis(): Promise<void> {
  try {
    redisClient = redis.createClient({
      socket: {
        host: process.env.REDIS_HOST || "localhost",
        port: Number(process.env.REDIS_PORT) || 6379,
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            return new Error("Redis connection failed after 10 retries");
          }
          return retries * 100;
        },
      },
    });

    redisClient.on("error", (err) => {
      if (process.env.NODE_ENV !== "test") {
        console.error("Redis Client Error", err);
      }
    });

    await redisClient.connect();
  } catch (error) {
    if (process.env.NODE_ENV !== "test") {
      console.error("Failed to connect to Redis:", error);
    }
    throw error;
  }
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
  }
}

export function getRedis(): RedisClient {
  return redisClient;
}
