import bookingRepository from "@/repositories/booking-repository.ts";
import enrollmentRepository from "@/repositories/enrollment-repository";
import ticketRepository from "@/repositories/ticket-repository";
import { notFoundError, forbiddenError } from "@/errors";
import ticketService from "../tickets-service";
import paymentService from "../payments-service";
import { Console } from "console";

async function getBookings(userId: number) {
  const booking = await bookingRepository.findBooking(userId);
  if (!booking) {
    throw notFoundError();
  }
  return {
    id: booking.id,
    Room: booking.Room
  };
}

async function postBooking(userId: number, roomId: number) { 
  let ticket; 
  try {
    ticket = await ticketService.getTicketByUserId(userId);
  }catch(error) {
    if (error.name === "NotFoundError") {
      throw forbiddenError();
    }
  }
  if(!ticket || ticket.TicketType.isRemote == true || ticket.TicketType.includesHotel == false || ticket.status !== "PAID") {
    throw forbiddenError();
  }
  const bookingExists = await bookingRepository.findBooking(userId);
  if(bookingExists) { 
    throw forbiddenError();
  }
  const room = await bookingRepository.findRoombyId(roomId);
  if(!room) {
    throw notFoundError();
  }
  if(room.capacity <= room.Booking.length) {
    throw forbiddenError();
  }
  const booking = await bookingRepository.createBooking(roomId, userId);
  return booking;
}

async function verifyBooking(userId: number, roomId: number, bookingId: number) {
  const bookingWId = await bookingRepository.findBookingWithId(bookingId);

  if (!bookingWId) {
    throw forbiddenError();
  }
  const booking = await bookingRepository.findBooking(userId);
  if (!booking) {
    throw forbiddenError();
  }
  if(bookingWId.id != booking.id) {
    throw forbiddenError();
  }
  const room = await bookingRepository.findRoombyId(roomId);
  if(!room) {
    throw notFoundError();
  }
  if(room.capacity <= room.Booking.length) {
    throw forbiddenError();
  }
  const newBookingId = await bookingRepository.updateBooking(roomId, userId, bookingId);

  return newBookingId;
}

const bookingService = {
  getBookings,
  postBooking,
  verifyBooking
};
  
export default bookingService;
