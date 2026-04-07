import { z } from "zod";

export const createProductSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(1),
  unit: z.string().min(1),
  sellPrice: z.number().positive(),
  costPrice: z.number().positive(),
  imageUrl: z.string().optional(),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
