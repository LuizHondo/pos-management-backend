import { z } from "zod";

export const createSaleSchema = z.object({
  clientId: z.string().min(1),
  items: z.array(
    z.object({
      productId: z.string().min(1),
      quantity: z.number().positive(),
    })
  ),
  payments: z.array(
    z.object({
      amount: z.number().positive(),
      method: z.enum(["PIX", "CASH", "CHECK", "CREDIT"]),
    })
  ).optional(),
});

export const addPaymentSchema = z.object({
  amount: z.number().positive(),
  method: z.enum(["PIX", "CASH", "CHECK", "CREDIT"]),
  isCreditResolution: z.boolean().optional(),
  resolvesPaymentId: z.string().optional(),
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type AddPaymentInput = z.infer<typeof addPaymentSchema>;
