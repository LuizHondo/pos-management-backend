import { FastifyInstance } from "fastify";
import { createProductSchema, updateProductSchema } from "../schemas/product.js";
import { notFound } from "../utils/errors.js";

export default async function productRoutes(fastify: FastifyInstance) {
  fastify.get<{ Querystring: { categoryId?: string; search?: string } }>(
    "/",
    async (request, reply) => {
      await request.jwtVerify();
      const { categoryId, search } = request.query;
      const where: any = { companyId: request.user.companyId };
      if (categoryId) where.categoryId = categoryId;
      if (search)
        where.name = { contains: search, mode: "insensitive" };

      const products = await fastify.prisma.product.findMany({ where });
      reply.send(products);
    }
  );

  fastify.get<{ Params: { id: string } }>("/:id", async (request, reply) => {
    await request.jwtVerify();
    const product = await fastify.prisma.product.findUnique({
      where: { id: request.params.id },
    });
    if (!product || product.companyId !== request.user.companyId) {
      throw notFound("Product not found");
    }
    reply.send(product);
  });

  fastify.post<{ Body: any }>("/", async (request, reply) => {
    await request.jwtVerify();
    const data = createProductSchema.parse(request.body);
    const product = await fastify.prisma.product.create({
      data: { ...data, companyId: request.user.companyId },
    });
    reply.status(201).send(product);
  });

  fastify.put<{ Params: { id: string }; Body: any }>(
    "/:id",
    async (request, reply) => {
      await request.jwtVerify();
      const data = updateProductSchema.parse(request.body);
      const product = await fastify.prisma.product.findUnique({
        where: { id: request.params.id },
      });
      if (!product || product.companyId !== request.user.companyId) {
        throw notFound("Product not found");
      }
      const updated = await fastify.prisma.product.update({
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
      const product = await fastify.prisma.product.findUnique({
        where: { id: request.params.id },
      });
      if (!product || product.companyId !== request.user.companyId) {
        throw notFound("Product not found");
      }
      await fastify.prisma.product.delete({
        where: { id: request.params.id },
      });
      reply.send({ success: true });
    }
  );
}
