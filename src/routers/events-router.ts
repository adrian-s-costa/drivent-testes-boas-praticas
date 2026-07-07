import { Router } from "express";
import { getDefaultEvent, updateEvent } from "@/controllers";
import { cacheMiddleware } from "@/middlewares";

const eventsRouter = Router();

eventsRouter.get("/", cacheMiddleware, getDefaultEvent);
eventsRouter.post("/:id", updateEvent);

export { eventsRouter };
