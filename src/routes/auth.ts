import { FastifyInstance } from "fastify";
import { hash, compare } from "bcrypt";
import { registerSchema, loginSchema, inviteUserSchema } from "../schemas/auth.js";
import { notFound, badRequest } from "../utils/errors.js";

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: any }>("/auth/register", async (request, reply) => {
    const { companyName, ownerName, email, password } = registerSchema.parse(request.body);

    const existingUser = await fastify.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw badRequest("Email already in use");
    }

    const passwordHash = await hash(password, 10);

    const company = await fastify.prisma.company.create({
      data: {
        name: companyName,
        phone: "",
        address: "",
        users: {
          create: {
            name: ownerName,
            email,
            passwordHash,
            role: "OWNER",
          },
        },
      },
      include: { users: true },
    });

    const owner = company.users[0];
    const token = fastify.jwt.sign({
      userId: owner.id,
      companyId: company.id,
      role: owner.role,
    });

    reply.send({ token, user: owner, company });
  });

  fastify.post<{ Body: any }>("/auth/login", async (request, reply) => {
    const { email, password } = loginSchema.parse(request.body);

    const user = await fastify.prisma.user.findUnique({
      where: { email },
      include: { company: true },
    });

    if (!user) {
      throw notFound("User not found");
    }

    const passwordMatch = await compare(password, user.passwordHash);
    if (!passwordMatch) {
      throw badRequest("Invalid password");
    }

    const token = fastify.jwt.sign({
      userId: user.id,
      companyId: user.companyId,
      role: user.role,
    });

    reply.send({ token, user, company: user.company });
  });

  fastify.get<{}>("/auth/me", async (request, reply) => {
    await request.jwtVerify();
    const user = await fastify.prisma.user.findUnique({
      where: { id: request.user.userId },
      include: { company: true },
    });
    reply.send({ user });
  });

  fastify.post<{ Body: any }>(
    "/auth/invite",
    async (request, reply) => {
      await request.jwtVerify();

      if (request.user.role !== "OWNER") {
        throw new Error("Only owners can invite users");
      }

      const { email, name, role } = inviteUserSchema.parse(request.body);

      const existingUser = await fastify.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw badRequest("Email already in use");
      }

      const tempPassword = Math.random().toString(36).slice(-8);
      const passwordHash = await hash(tempPassword, 10);

      const user = await fastify.prisma.user.create({
        data: {
          companyId: request.user.companyId,
          name,
          email,
          passwordHash,
          role,
        },
      });

      reply.send({
        user,
        tempPassword,
        message: "User created. Share the temporary password with them.",
      });
    }
  );
}
