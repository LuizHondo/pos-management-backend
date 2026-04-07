import Fastify, { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import prismaPlugin from "./plugins/prisma.js";
import authPlugin from "./plugins/auth.js";
import { AppError } from "./utils/errors.js";
import authRoutes from "./routes/auth.js";
import clientRoutes from "./routes/clients.js";
import categoryRoutes from "./routes/categories.js";
import productRoutes from "./routes/products.js";
import saleRoutes from "./routes/sales.js";
import stockRoutes from "./routes/stock.js";
import activityRoutes from "./routes/activities.js";
import dashboardRoutes from "./routes/dashboard.js";

export async function buildApp(): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: true,
  });

  // Register plugins
  await fastify.register(cors, { origin: true });
  await fastify.register(prismaPlugin);
  await fastify.register(authPlugin);

  // Register routes
  await fastify.register(authRoutes);
  await fastify.register(clientRoutes, { prefix: "/clients" });
  await fastify.register(categoryRoutes, { prefix: "/categories" });
  await fastify.register(productRoutes, { prefix: "/products" });
  await fastify.register(saleRoutes, { prefix: "/sales" });
  await fastify.register(stockRoutes, { prefix: "/stock" });
  await fastify.register(activityRoutes, { prefix: "/activities" });
  await fastify.register(dashboardRoutes, { prefix: "/dashboard" });

  // Error handler
  fastify.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      reply.code(error.statusCode).send({ error: error.message });
    } else {
      fastify.log.error(error);
      reply.code(500).send({ error: "Internal server error" });
    }
  });

  return fastify;
}
