import { FastifyInstance } from "fastify";

export default async function activityRoutes(fastify: FastifyInstance) {
  fastify.get<{ Querystring: { type?: string; limit?: string } }>(
    "/",
    async (request, reply) => {
      await request.jwtVerify();
      const { type, limit } = request.query;
      const where: any = { companyId: request.user.companyId };
      if (type) where.type = type;

      const activities = await fastify.prisma.activity.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: parseInt(limit || "50"),
      });
      reply.send(activities);
    }
  );
}
