import { PrismaClient } from "@prisma/client";
import { badRequest } from "../utils/errors.js";

export async function incrementStock(
  prismaClient: PrismaClient | any,
  productId: string,
  ownerId: string,
  quantity: number
) {
  return prismaClient.stockEntry.upsert({
    where: { productId_ownerId: { productId, ownerId } },
    create: { productId, ownerId, quantity },
    update: { quantity: { increment: quantity } },
  });
}

export async function decrementStock(
  prismaClient: PrismaClient | any,
  productId: string,
  ownerId: string,
  quantity: number
) {
  const entry = await prismaClient.stockEntry.findUnique({
    where: { productId_ownerId: { productId, ownerId } },
  });

  if (!entry || entry.quantity < quantity) {
    throw badRequest("Insufficient stock");
  }

  return prismaClient.stockEntry.update({
    where: { productId_ownerId: { productId, ownerId } },
    data: { quantity: { decrement: quantity } },
  });
}
