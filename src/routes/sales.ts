import { FastifyInstance } from "fastify";
import { createSaleSchema, addPaymentSchema } from "../schemas/sale.js";
import { notFound } from "../utils/errors.js";
import { createSale, addPayment } from "../services/sale.js";

export default async function saleRoutes(fastify: FastifyInstance) {
  fastify.get<{ Querystring: { status?: string; clientId?: string; search?: string } }>(
    "/",
    async (request, reply) => {
      await request.jwtVerify();
      const { status, clientId, search } = request.query;
      const where: any = { companyId: request.user.companyId };
      if (status) where.status = status;
      if (clientId) where.clientId = clientId;
      if (search) where.client = { name: { contains: search, mode: "insensitive" } };

      const sales = await fastify.prisma.sale.findMany({
        where,
        include: { client: true, items: true, payments: true },
      });
      reply.send(sales);
    }
  );

  fastify.get<{ Params: { id: string } }>("/:id", async (request, reply) => {
    await request.jwtVerify();
    const sale = await fastify.prisma.sale.findUnique({
      where: { id: request.params.id },
      include: { client: true, items: true, payments: true },
    });
    if (!sale || sale.companyId !== request.user.companyId) {
      throw notFound("Sale not found");
    }
    reply.send(sale);
  });

  fastify.post<{ Body: any }>("/", async (request, reply) => {
    await request.jwtVerify();
    const data = createSaleSchema.parse(request.body);
    const sale = await createSale(fastify.prisma, {
      ...data,
      companyId: request.user.companyId,
      salesmanId: request.user.userId,
    });
    reply.status(201).send(sale);
  });

  fastify.post<{ Params: { id: string }; Body: any }>(
    "/:id/payments",
    async (request, reply) => {
      await request.jwtVerify();
      const data = addPaymentSchema.parse(request.body);
      const sale = await fastify.prisma.sale.findUnique({
        where: { id: request.params.id },
      });
      if (!sale || sale.companyId !== request.user.companyId) {
        throw notFound("Sale not found");
      }
      const payment = await addPayment(fastify.prisma, request.params.id, {
        ...data,
        companyId: request.user.companyId,
      });
      reply.status(201).send(payment);
    }
  );
}
