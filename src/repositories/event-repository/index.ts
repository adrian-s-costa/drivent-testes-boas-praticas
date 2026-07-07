import { prisma } from "@/config";
import { Event } from "@prisma/client";

async function findFirst() {
  return prisma.event.findFirst();
}

async function findById(id: number) {
  return prisma.event.findUnique({
    where: { id },
  });
}

async function update(id: number, data: Partial<Event>) {
  return prisma.event.update({
    where: { id },
    data,
  });
}

const eventRepository = {
  findFirst,
  findById,
  update,
};

export default eventRepository;
