import eventsService from "@/services/events-service";
import { Request, Response } from "express";
import httpStatus from "http-status";
import { setCacheData } from "@/middlewares";

export async function getDefaultEvent(req: Request, res: Response) {
  try {
    const event = await eventsService.getFirstEvent();
    return res.status(httpStatus.OK).send(event);
  } catch (error) {
    return res.status(httpStatus.NOT_FOUND).send({});
  }
}

export async function updateEvent(req: Request, res: Response) {
  try {
    const eventId = Number(req.params.id);
    const eventData = req.body;
    
    const updatedEvent = await eventsService.updateEvent(eventId, eventData);
    
    await setCacheData(eventId, updatedEvent);
    
    return res.status(httpStatus.OK).send(updatedEvent);
  } catch (error) {
    return res.status(httpStatus.NOT_FOUND).send({});
  }
}
