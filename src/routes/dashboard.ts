import { FastifyInstance } from "fastify";

export default async function dashboardRoutes(fastify: FastifyInstance) {
  fastify.get<{}>("/summary", async (request, reply) => {
    await request.jwtVerify();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Today's sales
    const todaySales = await fastify.prisma.sale.findMany({
      where: {
        companyId: request.user!.companyId,
        createdAt: { gte: today },
      },
    });

    const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);

    // Total receivables
    const allSales = await fastify.prisma.sale.findMany({
      where: { companyId: request.user!.companyId },
      include: { payments: true },
    });

    let totalReceivables = 0;
    for (const sale of allSales) {
      const paid = sale.payments.reduce((sum, p) => sum + p.amount, 0);
      totalReceivables += sale.total - paid;
    }

    // Client count
    const clientCount = await fastify.prisma.client.count({
      where: { companyId: request.user!.companyId },
    });

    reply.send({
      todayRevenue,
      totalReceivables,
      clientCount,
      todaySalesCount: todaySales.length,
    });
  });
}
