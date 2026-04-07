import { z } from "zod";

export const loadStockSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().positive(),
});

export const transferStockSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().positive(),
  fromOwnerId: z.string().min(1),
  toOwnerId: z.string().min(1),
});

export type LoadStockInput = z.infer<typeof loadStockSchema>;
export type TransferStockInput = z.infer<typeof transferStockSchema>;
