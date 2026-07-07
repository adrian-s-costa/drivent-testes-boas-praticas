import { prisma } from "@/config";

async function findBooking(userId: number) {
  return await prisma.booking.findFirst({
    where: {
      userId: userId
    },
    include: {
      Room: true
    }
  });
}

async function findBookingWithId(bookindId: number) {
  return await prisma.booking.findFirst({
    where: {
      id: bookindId
    },
    include: {
      Room: true
    }
  });
}

async function updateBooking(roomId: number, userId: number, bookingId: number) {
  const booking = await prisma.booking.update({
    where: {
      id: bookingId
    },
    data: {
      userId: userId,
      roomId: roomId,
    }
  });

  return { bookingId: booking.id };
}

async function findRoomsByHotelId(hotelId: number) {
  return await prisma.hotel.findFirst({
    where: {
      id: hotelId,
    },
    include: {
      Rooms: true,
    }
  });
}

async function findRoombyId(roomId: number) {
  return await prisma.room.findFirst({
    where: {
      id: roomId,
    },
    include: {
      Booking: true,
    }
  });
}

async function createBooking(roomId: number, userId: number) {
  const booking = await prisma.booking.create({
    data: {
      userId: userId,
      roomId: roomId,
    }
  });
  return { bookingId: booking.id };
}

const bookingRepository = {
  findBooking,
  findRoomsByHotelId,
  findRoombyId,
  createBooking,
  updateBooking,
  findBookingWithId,
};

export default bookingRepository;
