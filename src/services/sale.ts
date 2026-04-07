import { PrismaClient } from "@prisma/client";
import { decrementStock, incrementStock } from "./stock.js";
import { createActivity } from "./activity.js";

export async function createSale(
  prismaClient: PrismaClient,
  data: {
    companyId: string;
    clientId: string;
    salesmanId: string;
    items: Array<{ productId: string; quantity: number }>;
    payments?: Array<{ amount: number; method: string }>;
  }
) {
  return prismaClient.$transaction(async (tx: any) => {
    let total = 0;
    const saleItems = [];

    // Resolve prices for each item
    for (const item of data.items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
      });
      if (!product) throw new Error("Product not found");

      const unitPrice = product.sellPrice;
      const costPriceSnapshot = product.costPrice;
      const itemTotal = unitPrice * item.quantity;
      total += itemTotal;

      saleItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        costPriceSnapshot,
      });

      // Decrement salesman stock
      await decrementStock(tx, item.productId, data.salesmanId, item.quantity);
    }

    // Determine status based on payments
    let status = "UNPAID";
    let paidAmount = 0;
    if (data.payments && data.payments.length > 0) {
      paidAmount = data.payments.reduce((sum: number, p: any) => sum + p.amount, 0);
      if (paidAmount >= total) {
        status = "PAID";
      } else if (paidAmount > 0) {
        status = "PARTIAL";
      }
    }

    // Create sale
    const sale = await tx.sale.create({
      data: {
        companyId: data.companyId,
        clientId: data.clientId,
        salesmanId: data.salesmanId,
        total,
        status,
        items: {
          create: saleItems,
        },
      },
    });

    // Add payments if provided
    if (data.payments && data.payments.length > 0) {
      for (const payment of data.payments) {
        await tx.payment.create({
          data: {
            saleId: sale.id,
            amount: payment.amount,
            method: payment.method,
          },
        });
      }
    }

    // Create activity
    await createActivity(tx, {
      companyId: data.companyId,
      type: "SALE",
      description: `Sale to ${data.clientId}`,
      amount: total,
      relatedId: sale.id,
    });

    return sale;
  });
}

export async function addPayment(
  prismaClient: PrismaClient,
  saleId: string,
  data: {
    companyId: string;
    amount: number;
    method: string;
    isCreditResolution?: boolean;
    resolvesPaymentId?: string;
  }
) {
  return prismaClient.$transaction(async (tx: any) => {
    const sale = await tx.sale.findUnique({
      where: { id: saleId },
      include: { payments: true },
    });

    if (!sale) throw new Error("Sale not found");

    // Create payment
    const payment = await tx.payment.create({
      data: {
        saleId,
        amount: data.amount,
        method: data.method,
        isCreditResolution: data.isCreditResolution || false,
        resolvesPaymentId: data.resolvesPaymentId,
      },
    });

    // Recalculate status
    const totalPaid = sale.payments.reduce((sum: number, p: any) => sum + p.amount, 0) + data.amount;
    const newStatus = totalPaid >= sale.total ? "PAID" : totalPaid > 0 ? "PARTIAL" : "UNPAID";

    await tx.sale.update({
      where: { id: saleId },
      data: { status: newStatus },
    });

    // Create activity
    await createActivity(tx, {
      companyId: data.companyId,
      type: "PAYMENT",
      description: `Payment for sale ${saleId}`,
      amount: data.amount,
      relatedId: saleId,
    });

    return payment;
  });
}
