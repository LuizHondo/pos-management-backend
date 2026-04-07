import { FastifyInstance } from "fastify";
import { createClientSchema, updateClientSchema } from "../schemas/client.js";
import { notFound } from "../utils/errors.js";

export default async function clientRoutes(fastify: FastifyInstance) {
  fastify.get<{}>("/", async (request, reply) => {
    await request.jwtVerify();
    const clients = await fastify.prisma.client.findMany({
      where: { companyId: request.user.companyId },
    });
    reply.send(clients);
  });

  fastify.get<{ Params: { id: string } }>("/:id", async (request, reply) => {
    await request.jwtVerify();
    const client = await fastify.prisma.client.findUnique({
      where: { id: request.params.id },
    });
    if (!client || client.companyId !== request.user.companyId) {
      throw notFound("Client not found");
    }
    reply.send(client);
  });

  fastify.get<{ Params: { id: string } }>(
    "/:id/credit",
    async (request, reply) => {
      await request.jwtVerify();
      const client = await fastify.prisma.client.findUnique({
        where: { id: request.params.id },
        include: {
          sales: {
            include: { payments: true },
          },
        },
      });
      if (!client || client.companyId !== request.user.companyId) {
        throw notFound("Client not found");
      }

      let totalOwed = 0;
      let daysSinceOldest = 0;
      for (const sale of client.sales) {
        const paid = sale.payments.reduce((sum: number, p: any) => sum + p.amount, 0);
        totalOwed += sale.total - paid;
        if (sale.createdAt) {
          const days = Math.floor(
            (Date.now() - sale.createdAt.getTime()) / (1000 * 60 * 60 * 24)
          );
          daysSinceOldest = Math.max(daysSinceOldest, days);
        }
      }

      const status =
        totalOwed === 0 ? "ok" : daysSinceOldest > 30 ? "danger" : "warning";

      reply.send({ client, totalOwed, daysSinceOldest, status });
    }
  );

  fastify.post<{ Body: any }>("/", async (request, reply) => {
    await request.jwtVerify();
    const data = createClientSchema.parse(request.body);
    const client = await fastify.prisma.client.create({
      data: {
        ...data,
        companyId: request.user.companyId,
      },
    });
    reply.status(201).send(client);
  });

  fastify.put<{ Params: { id: string }; Body: any }>(
    "/:id",
    async (request, reply) => {
      await request.jwtVerify();
      const data = updateClientSchema.parse(request.body);
      const client = await fastify.prisma.client.findUnique({
        where: { id: request.params.id },
      });
      if (!client || client.companyId !== request.user.companyId) {
        throw notFound("Client not found");
      }
      const updated = await fastify.prisma.client.update({
        where: { id: request.params.id },
        data,
      });
      reply.send(updated);
    }
  );

  fastify.delete<{ Params: { id: string } }>(
    "/:id",
    async (request, reply) => {
      await request.jwtVerify();
      const client = await fastify.prisma.client.findUnique({
        where: { id: request.params.id },
      });
      if (!client || client.companyId !== request.user.companyId) {
        throw notFound("Client not found");
      }
      await fastify.prisma.client.delete({
        where: { id: request.params.id },
      });
      reply.send({ success: true });
    }
  );
}
