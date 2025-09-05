import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const items = [
    { name: "Lietuviški", slug: "lt" },
    { name: "Angliški", slug: "en" },
    { name: "Lenkiški", slug: "pl" },
    { name: "Ukrainietiški", slug: "ukr" },
    { name: "Auto", slug: "auto" },
  ];
  for (const c of items) {
    await prisma.category.upsert({ where: { slug: c.slug }, create: c, update: {} });
  }
}

main().finally(() => prisma.$disconnect());

