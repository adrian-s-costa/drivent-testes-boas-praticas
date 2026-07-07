import app, { init } from "@/app";
import httpStatus from "http-status";
import supertest from "supertest";
import { createEvent } from "../factories";
import { cleanDb, cleanRedis } from "../helpers";
import { getRedis } from "@/config";
import eventRepository from "@/repositories/event-repository";

beforeAll(async () => {
  await init();
});

beforeEach(async () => {
  await cleanDb();
  await cleanRedis();
});

const server = supertest(app);

describe("GET /event", () => {
  it("should respond with status 404 if there is no event", async () => {
    const response = await server.get("/event");

    expect(response.status).toBe(httpStatus.NOT_FOUND);
  });

  it("should respond with status 200 and event data if there is an event", async () => {
    const event = await createEvent();

    const response = await server.get("/event");

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body).toEqual({
      id: event.id,
      title: event.title,
      backgroundImageUrl: event.backgroundImageUrl,
      logoImageUrl: event.logoImageUrl,
      startsAt: event.startsAt.toISOString(),
      endsAt: event.endsAt.toISOString(),
    });
  });

  it("should not use cache when allow-cache header is false", async () => {
    const event = await createEvent();

    const response = await server.get("/event").set("allow-cache", "false");

    expect(response.status).toBe(httpStatus.OK);
    
    const redis = getRedis();
    const cachedData = await redis.get(`event:${event.id}`);
    expect(cachedData).toBeNull();
  });

  it("should not use cache when allow-cache header is not provided", async () => {
    const event = await createEvent();

    const response = await server.get("/event");

    expect(response.status).toBe(httpStatus.OK);
    
    const redis = getRedis();
    const cachedData = await redis.get(`event:${event.id}`);
    expect(cachedData).toBeNull();
  });

  it("should cache data when allow-cache header is true", async () => {
    const event = await createEvent();

    const response = await server.get("/event").set("allow-cache", "true");

    expect(response.status).toBe(httpStatus.OK);
    
    const redis = getRedis();
    const cachedData = await redis.get(`event:${event.id}`);
    expect(cachedData).not.toBeNull();
    
    const parsedCache = JSON.parse(cachedData);
    expect(parsedCache).toEqual({
      id: event.id,
      title: event.title,
      backgroundImageUrl: event.backgroundImageUrl,
      logoImageUrl: event.logoImageUrl,
      startsAt: event.startsAt.toISOString(),
      endsAt: event.endsAt.toISOString(),
    });
  });

  it("should return cached data when allow-cache is true and data exists in cache", async () => {
    const event = await createEvent();

    await server.get("/event").set("allow-cache", "true");

    const findFirstSpy = jest.spyOn(eventRepository, "findFirst");
    
    const response = await server.get("/event").set("allow-cache", "true");
    
    expect(response.status).toBe(httpStatus.OK);
    expect(findFirstSpy).not.toHaveBeenCalled();
    
    findFirstSpy.mockRestore();
  });

  it("should verify cache has 5 minute TTL", async () => {
    const event = await createEvent();

    await server.get("/event").set("allow-cache", "true");

    const redis = getRedis();
    const ttl = await redis.ttl(`event:${event.id}`);
    
    expect(ttl).toBeGreaterThan(290);
    expect(ttl).toBeLessThanOrEqual(300);
  });
});

describe("POST /event/:id", () => {
  it("should update event and cache with write-through", async () => {
    const event = await createEvent();

    const updateData = {
      title: "Updated Event Title",
      backgroundImageUrl: "http://new-background.com",
      logoImageUrl: "http://new-logo.com",
    };

    const response = await server.post(`/event/${event.id}`).send(updateData);

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.title).toBe(updateData.title);

    const redis = getRedis();
    const cachedData = await redis.get(`event:${event.id}`);
    expect(cachedData).not.toBeNull();
    
    const parsedCache = JSON.parse(cachedData);
    expect(parsedCache.title).toBe(updateData.title);
  });

  it("should respond with status 404 if event does not exist", async () => {
    const updateData = {
      title: "Non-existent Event",
    };

    const response = await server.post("/event/999999").send(updateData);

    expect(response.status).toBe(httpStatus.NOT_FOUND);
  });
});
