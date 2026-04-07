import { PrismaClient } from "@prisma/client";
import { hash } from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  // Create company
  const company = await prisma.company.upsert({
    where: { id: "company-1" },
    update: {},
    create: {
      id: "company-1",
      name: "Premium Beverages",
      phone: "(11) 98765-4321",
      address: "Rua das Flores, 123",
    },
  });

  // Create owner user
  const ownerPassword = await hash("owner123", 10);
  const owner = await prisma.user.upsert({
    where: { email: "owner@premium.com" },
    update: {},
    create: {
      companyId: company.id,
      name: "João Silva",
      email: "owner@premium.com",
      passwordHash: ownerPassword,
      role: "OWNER",
    },
  });

  // Create salesman user
  const salesmanPassword = await hash("salesman123", 10);
  const salesman = await prisma.user.upsert({
    where: { email: "salesman@premium.com" },
    update: {},
    create: {
      companyId: company.id,
      name: "Carlos Santos",
      email: "salesman@premium.com",
      passwordHash: salesmanPassword,
      role: "SALESMAN",
    },
  });

  // Create categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        companyId: company.id,
        name: "Bebidas Alcoólicas",
        color: "#FF6B6B",
        emoji: "🍺",
      },
    }),
    prisma.category.create({
      data: {
        companyId: company.id,
        name: "Bebidas Não Alcoólicas",
        color: "#4ECDC4",
        emoji: "🥤",
      },
    }),
    prisma.category.create({
      data: {
        companyId: company.id,
        name: "Destilados",
        color: "#FFE66D",
        emoji: "🥃",
      },
    }),
    prisma.category.create({
      data: {
        companyId: company.id,
        name: "Vinho",
        color: "#A8E6CF",
        emoji: "🍷",
      },
    }),
  ]);

  // Create products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        companyId: company.id,
        categoryId: categories[0].id,
        name: "Cerveja Premium",
        unit: "caixa",
        sellPrice: 150,
        costPrice: 80,
      },
    }),
    prisma.product.create({
      data: {
        companyId: company.id,
        categoryId: categories[0].id,
        name: "Chopp",
        unit: "litro",
        sellPrice: 25,
        costPrice: 12,
      },
    }),
    prisma.product.create({
      data: {
        companyId: company.id,
        categoryId: categories[1].id,
        name: "Refrigerante",
        unit: "caixa",
        sellPrice: 80,
        costPrice: 40,
      },
    }),
    prisma.product.create({
      data: {
        companyId: company.id,
        categoryId: categories[1].id,
        name: "Água Mineral",
        unit: "caixa",
        sellPrice: 50,
        costPrice: 20,
      },
    }),
    prisma.product.create({
      data: {
        companyId: company.id,
        categoryId: categories[2].id,
        name: "Vodka",
        unit: "garrafa",
        sellPrice: 120,
        costPrice: 60,
      },
    }),
    prisma.product.create({
      data: {
        companyId: company.id,
        categoryId: categories[3].id,
        name: "Vinho Tinto",
        unit: "garrafa",
        sellPrice: 80,
        costPrice: 40,
      },
    }),
  ]);

  // Create clients
  const clients = await Promise.all([
    prisma.client.create({
      data: {
        companyId: company.id,
        name: "Bar do João",
        phone: "(11) 98765-0000",
        address: "Rua A, 100",
        notes: "Cliente VIP",
      },
    }),
    prisma.client.create({
      data: {
        companyId: company.id,
        name: "Restaurante Central",
        phone: "(11) 99999-1111",
        address: "Rua B, 200",
      },
    }),
    prisma.client.create({
      data: {
        companyId: company.id,
        name: "Casa de Bebidas",
        phone: "(11) 97777-2222",
        address: "Rua C, 300",
      },
    }),
  ]);

  // Create stock entries for deposit
  for (const product of products) {
    await prisma.stockEntry.create({
      data: {
        productId: product.id,
        ownerId: "DEPOSIT",
        quantity: Math.floor(Math.random() * 100) + 50,
      },
    });
  }

  // Create stock entries for salesman
  for (const product of products.slice(0, 3)) {
    await prisma.stockEntry.create({
      data: {
        productId: product.id,
        ownerId: salesman.id,
        quantity: Math.floor(Math.random() * 30) + 10,
      },
    });
  }

  console.log("Seed completed successfully!");
  console.log(`Company: ${company.name}`);
  console.log(`Owner: ${owner.name} (${owner.email})`);
  console.log(`Salesman: ${salesman.name} (${salesman.email})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
