import { FastifyInstance } from "fastify";
import { loadStockSchema, transferStockSchema } from "../schemas/stock.js";
import { createActivity } from "../services/activity.js";
import { incrementStock, decrementStock } from "../services/stock.js";

export default async function stockRoutes(fastify: FastifyInstance) {
  fastify.get<{ Querystring: { ownerId?: string } }>(
    "/",
    async (request, reply) => {
      await request.jwtVerify();
      const { ownerId } = request.query;
      const where: any = {};
      if (ownerId) where.ownerId = ownerId;

      const stock = await fastify.prisma.stockEntry.findMany({
        where,
        include: {
          product: true,
        },
      });

      // Filter by company
      const filtered = stock.filter(
        (s: any) => s.product.companyId === request.user.companyId
      );
      reply.send(filtered);
    }
  );

  fastify.post<{ Body: any }>("/load", async (request, reply) => {
    await request.jwtVerify();
    const { productId, quantity } = loadStockSchema.parse(request.body);

    await fastify.prisma.$transaction(async (tx: any) => {
      await incrementStock(tx, productId, "DEPOSIT", quantity);
      await createActivity(tx, {
        companyId: request.user.companyId,
        type: "STOCK_LOAD",
        description: `Stock loaded for product ${productId}`,
        amount: quantity,
        relatedId: productId,
      });
    });

    reply.status(201).send({ success: true });
  });

  fastify.post<{ Body: any }>("/transfer", async (request, reply) => {
    await request.jwtVerify();
    const { productId, quantity, fromOwnerId, toOwnerId } =
      transferStockSchema.parse(request.body);

    await fastify.prisma.$transaction(async (tx: any) => {
      await decrementStock(tx, productId, fromOwnerId, quantity);
      await incrementStock(tx, productId, toOwnerId, quantity);
      await createActivity(tx, {
        companyId: request.user.companyId,
        type: "STOCK_TRANSFER",
        description: `Stock transferred for product ${productId}`,
        amount: quantity,
        relatedId: productId,
      });
    });

    reply.status(201).send({ success: true });
  });
}
