import { FastifyInstance } from "fastify";
import { createCategorySchema, updateCategorySchema } from "../schemas/category.js";
import { notFound } from "../utils/errors.js";

export default async function categoryRoutes(fastify: FastifyInstance) {
  fastify.get<{}>("/", async (request, reply) => {
    await request.jwtVerify();
    const categories = await fastify.prisma.category.findMany({
      where: { companyId: request.user!.companyId },
    });
    reply.send(categories);
  });

  fastify.post<{ Body: any }>("/", async (request, reply) => {
    await request.jwtVerify();
    const data = createCategorySchema.parse(request.body);
    const category = await fastify.prisma.category.create({
      data: { ...data, companyId: request.user!.companyId },
    });
    reply.status(201).send(category);
  });

  fastify.put<{ Params: { id: string }; Body: any }>(
    "/:id",
    async (request, reply) => {
      await request.jwtVerify();
      const data = updateCategorySchema.parse(request.body);
      const category = await fastify.prisma.category.findUnique({
        where: { id: request.params.id },
      });
      if (!category || category.companyId !== request.user!.companyId) {
        throw notFound("Category not found");
      }
      const updated = await fastify.prisma.category.update({
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
      const category = await fastify.prisma.category.findUnique({
        where: { id: request.params.id },
      });
      if (!category || category.companyId !== request.user!.companyId) {
        throw notFound("Category not found");
      }
      await fastify.prisma.category.delete({
        where: { id: request.params.id },
      });
      reply.send({ success: true });
    }
  );
}
