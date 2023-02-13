import app, { init } from "@/app";
import { prisma } from "@/config";
import faker from "@faker-js/faker";
import { TicketStatus } from "@prisma/client";
import e from "express";
import httpStatus from "http-status";
import { any, date } from "joi";
import * as jwt from "jsonwebtoken";
import supertest from "supertest";
import {
  createEnrollmentWithAddress,
  createUser,
  createTicketType,
  createTicket,
  createPayment,
  generateCreditCardData,
  createTicketTypeWithHotel,
  createTicketTypeRemote,
  createHotel,
  createRoomWithHotelId,
  createTicketTypeFunc,
  createRoomWithHotelIdCapacity,
} from "../factories";
import { createBooking } from "../factories/booking-factory";
import { cleanDb, generateValidToken } from "../helpers";

beforeAll(async () => {
  await init();
});

beforeEach(async () => {
  await cleanDb();
});

const server = supertest(app);

describe("GET /booking", () => {
  it("should respond with status 200 and the bookindId with the room", async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createTicketTypeWithHotel();
    const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
    const payment = await createPayment(ticket.id, ticketType.price);
    const createdHotel = await createHotel();
    const createdRoom = await createRoomWithHotelId(createdHotel.id);
    const createdBooking = await createBooking(user.id, createdRoom.id);
  
    const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.OK);
    expect(response.body).toEqual({
      id: expect.any(Number),
      Room: {
        id: createdRoom.id,
        name: expect.any(String),
        capacity: expect.any(Number),
        hotelId: expect.any(Number),
        createdAt: createdRoom.createdAt.toISOString(),
        updatedAt: createdRoom.updatedAt.toISOString(),
      }
    });
  });
});

describe("GET /booking", () => {
  it("should respond with status 404 if there is no booking made by the user", async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createTicketTypeWithHotel();
    const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
    const payment = await createPayment(ticket.id, ticketType.price);
    const createdHotel = await createHotel();

    const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.NOT_FOUND);
  });
});

describe("POST /booking", () => {
  it("should respond with status 403 if user already have one booking", async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createTicketTypeWithHotel();
    const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
    const payment = await createPayment(ticket.id, ticketType.price);
    const createdHotel = await createHotel();
    const createdRoom1 = await createRoomWithHotelId(createdHotel.id);
    const createdRoom2 = await createRoomWithHotelId(createdHotel.id);
    const createdBooking = await createBooking(user.id, createdRoom1.id);
  
    const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: createdRoom2.id });
    expect(response.status).toBe(httpStatus.FORBIDDEN);
  });
});

describe("POST /booking", () => {
  it("should respond with status 403 if the user dont have ticket", async () => {
    const user = await createUser();
    const user2 = await createUser();
    const token = await generateValidToken(user);
    const token2 = await generateValidToken(user2);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createTicketTypeWithHotel();
    const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
    const payment = await createPayment(ticket.id, ticketType.price);
    const createdHotel = await createHotel();
    const createdRoom = await createRoomWithHotelId(createdHotel.id);
    const createdBooking = await createBooking(user.id, createdRoom.id);
      
    const response = await server.post("/booking").set("Authorization", `Bearer ${token2}`).send({ roomId: createdRoom.id });
    expect(response.statusCode).toBe(httpStatus.FORBIDDEN);
  });
});

describe("POST /booking", () => {
  it("should respond with status 403 if the user have remote ticket", async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createTicketTypeFunc(true, false);
    const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
    const payment = await createPayment(ticket.id, ticketType.price);
    const createdHotel = await createHotel();
    const createdRoom = await createRoomWithHotelId(createdHotel.id);
  
    const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: createdRoom.id });
    expect(response.status).toBe(httpStatus.FORBIDDEN);
  });
});

describe("POST /booking", () => {
  it("should respond with status 403 if the user dont have hotel included", async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createTicketTypeFunc(false, false);
    const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
    const payment = await createPayment(ticket.id, ticketType.price);
    const createdHotel = await createHotel();
    const createdRoom = await createRoomWithHotelId(createdHotel.id);
  
    const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: createdRoom.id });
    expect(response.status).toBe(httpStatus.FORBIDDEN);
  });
});

describe("POST /booking", () => {
  it("should respond with status 403 if the user dont have payment", async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createTicketTypeFunc(false, false);
    const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);
    const createdHotel = await createHotel();
    const createdRoom = await createRoomWithHotelId(createdHotel.id);
  
    const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: createdRoom.id });
    expect(response.status).toBe(httpStatus.FORBIDDEN);
  });
});

describe("POST /booking", () => {
  it("should respond with status 403 if there is no capacity in the room", async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createTicketTypeWithHotel();
    const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
    const payment = await createPayment(ticket.id, ticketType.price);
    const createdHotel = await createHotel();
    const createdRoom = await createRoomWithHotelIdCapacity(createdHotel.id, 0);
    const createdBooking = await createBooking(user.id, createdRoom.id);

    const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: createdRoom.id });
    expect(response.status).toBe(httpStatus.FORBIDDEN);
  });
});

describe("PUT /booking/:bookingId", () => {
  it("should respond with status 403 if the user dont have any booking", async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createTicketTypeWithHotel();
    const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
    const payment = await createPayment(ticket.id, ticketType.price);
    const createdHotel = await createHotel();
    const createdRoom = await createRoomWithHotelId(createdHotel.id);
  
    const response = await server.put("/booking/1").set("Authorization", `Bearer ${token}`).send({ roomId: createdRoom.id });
    expect(response.status).toBe(httpStatus.FORBIDDEN);
  });
});

describe("PUT /booking/:bookingId", () => {
  it("should respond with status 403 if there is no capacity in the room", async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createTicketTypeWithHotel();
    const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
    const payment = await createPayment(ticket.id, ticketType.price);
    const createdHotel = await createHotel();
    const createdRoom1 = await createRoomWithHotelIdCapacity(createdHotel.id, 0);
    const createdRoom2 = await createRoomWithHotelId(createdHotel.id);
    const createdBooking = await createBooking(user.id, createdRoom2.id);

    const response = await server.put(`/booking/${createdBooking.id}`).set("Authorization", `Bearer ${token}`).send({ roomId: createdRoom1.id });
    expect(response.status).toBe(httpStatus.FORBIDDEN);
  });
});

describe("PUT /booking/:bookingId", () => {
  it("should respond with status 404 if there is no room with the id given", async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createTicketTypeWithHotel();
    const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
    const payment = await createPayment(ticket.id, ticketType.price);
    const createdHotel = await createHotel();
    const createdRoom = await createRoomWithHotelId(createdHotel.id);
    const createdBooking = await createBooking(user.id, createdRoom.id);

    const response = await server.put(`/booking/${createdBooking.id}`).set("Authorization", `Bearer ${token}`).send({ roomId: 0 });
    expect(response.status).toBe(httpStatus.NOT_FOUND);
  });
});

describe("POST /booking", () => {
  it("should respond with status 200 and the user's booking", async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createTicketTypeWithHotel();
    const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
    const payment = await createPayment(ticket.id, ticketType.price);
    const createdHotel = await createHotel();
    const createdRoom = await createRoomWithHotelId(createdHotel.id);
  
    const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: createdRoom.id });
    expect(response.status).toBe(httpStatus.OK);
    expect(response.body).toEqual({
      bookingId: response.body.bookingId
    });
  });
});
  
describe("POST /booking", () => {
  it("should respond with status 404 if there is no room with the id given", async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createTicketTypeWithHotel();
    const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
    const payment = await createPayment(ticket.id, ticketType.price);
    const createdHotel = await createHotel();
    const createdRoom = await createRoomWithHotelId(createdHotel.id);

    const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({ roomId: 1 });
    expect(response.status).toBe(httpStatus.NOT_FOUND);
  });
});

describe("PUT /booking/:bookingId", () => {
  it("should respond with status 200 and the new bookingId", async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createTicketTypeWithHotel();
    const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
    const payment = await createPayment(ticket.id, ticketType.price);
    const createdHotel = await createHotel();
    const createdRoom1 = await createRoomWithHotelIdCapacity(createdHotel.id, 1);
    const createdRoom2 = await createRoomWithHotelId(createdHotel.id);
    const createdBooking = await createBooking(user.id, createdRoom2.id);

    const response = await server.put(`/booking/${createdBooking.id}`).set("Authorization", `Bearer ${token}`).send({ roomId: createdRoom1.id });
    expect(response.status).toBe(httpStatus.OK);
    expect(response.body).toEqual({
      bookingId: response.body.bookingId
    });
  });
});

