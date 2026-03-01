// scripts/seed-lead.js
require("dotenv/config");

const prisma = require("../lib/prisma").default || require("../lib/prisma");

async function main() {
  await prisma.lead.upsert({
    where: { id: "L-001" },
    update: {},
    create: {
      id: "L-001",
      name: "Sample Lead",
      segment: "Developer",
      stage: "Prospect",
      status: "Active",
      owner: "John",
      priority: "Medium",
      nextActionAt: null,
      lastTouch: null,
    },
  });

  console.log("Seeded L-001");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
