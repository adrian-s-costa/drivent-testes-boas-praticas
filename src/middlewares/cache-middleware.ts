import { Request, Response, NextFunction } from "express";
import { getRedis } from "@/config";

const CACHE_TTL = 300;

export function cacheMiddleware(req: Request, res: Response, next: NextFunction) {
  const allowCache = req.headers["allow-cache"] === "true";

  if (!allowCache) {
    return next();
  }

  const eventId = req.params.id || "default";
  const cacheKey = `event:${eventId}`;

  const redis = getRedis();

  redis
    .get(cacheKey)
    .then((cachedData) => {
      if (cachedData) {
        return res.status(200).send(JSON.parse(cachedData));
      }
      next();
    })
    .catch(() => {
      next();
    });
}

export async function setCacheData(eventId: string | number, data: any): Promise<void> {
  invalidateCache(eventId)
  const cacheKey = `event:${eventId}`;
  const redis = getRedis();
  await redis.setEx(cacheKey, CACHE_TTL, JSON.stringify(data));
}

export async function getCacheData(eventId: string | number): Promise<any> {
  const cacheKey = `event:${eventId}`;
  const redis = getRedis();
  const cachedData = await redis.get(cacheKey);
  return cachedData ? JSON.parse(cachedData) : null;
}

export async function invalidateCache(eventId: string | number): Promise<void> {
  const cacheKey = `event:${eventId}`;
  const redis = getRedis();
  await redis.del(cacheKey);
}
