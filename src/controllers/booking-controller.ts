import { Response } from "express";
import { AuthenticatedRequest } from "@/middlewares";
import bookingService from "@/services/booking-service";
import httpStatus from "http-status";

export async function getBookings(req: AuthenticatedRequest, res: Response) {
  //const { userId } = req;
  const userId = 2;
  try {
    const bookings = await bookingService.getBookings(Number(userId));
    return res.status(httpStatus.OK).send(bookings);
  } catch (error) {
    return res.sendStatus(httpStatus.NOT_FOUND);
  }
}

export async function postBooking(req: AuthenticatedRequest, res: Response) {
  try {
    //const { userId } = req;
    const userId = 2;
    const { roomId } = req.body;
    const booking = await bookingService.postBooking(userId, roomId);
    return res.status(httpStatus.OK).send(booking);
  } catch (error) {
    if (error.name === "NotFoundError") {
      return res.sendStatus(httpStatus.NOT_FOUND);
    }else if(error.name === "ForbiddenError") {
      return res.sendStatus(httpStatus.FORBIDDEN);
    }
    console.log(error);
    return res.sendStatus(400);
  }
}

export async function updateBooking(req: AuthenticatedRequest, res: Response) {
  try {
    //const { userId } = req;
    const userId = 2;
    const { roomId } = req.body;
    const bookingId = parseInt(req.params.bookingId);
    console.log(bookingId);
    const booking = await bookingService.verifyBooking(userId, Number(roomId), bookingId);
    return res.status(httpStatus.OK).send(booking);
  } catch (error) {
    if (error.name === "NotFoundError") {
      return res.sendStatus(httpStatus.NOT_FOUND);
    }else if(error.name === "ForbiddenError") {
      return res.sendStatus(httpStatus.FORBIDDEN);
    }
    console.log(error);
    return res.sendStatus(400);
  }
}
