import { PrismaClient } from "@prisma/client";

export async function createActivity(
  prismaClient: PrismaClient | any,
  data: {
    companyId: string;
    type: string;
    description: string;
    amount?: number;
    relatedId?: string;
  }
) {
  return prismaClient.activity.create({
    data,
  });
}
