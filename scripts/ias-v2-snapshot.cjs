require("dotenv").config({ path: ".env.local" });
const fs = require("fs");

async function main() {
  // --- Print key file paths (no contents) ---
  const keyPaths = [
    "prisma/schema.prisma",
    "lib/prisma.js",
    "lib/auth.js",
    "pages/api/leads/index.js",
    "pages/leads/index.js",
  ];

  console.log("=== KEY FILES (existence) ===");
  for (const p of keyPaths) {
    console.log(p, fs.existsSync(p) ? "OK" : "MISSING");
  }

  console.log("\n=== PRISMA SCHEMA ===");
  if (fs.existsSync("prisma/schema.prisma")) {
    console.log(fs.readFileSync("prisma/schema.prisma", "utf8"));
  } else {
    console.log("MISSING prisma/schema.prisma");
  }

  console.log("\n=== DB TABLES + COLUMNS (public) ===");
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();

  const tables = await prisma.$queryRaw`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `;

  for (const t of tables) {
    const table = t.table_name;
    const cols = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = ${table}
      ORDER BY ordinal_position;
    `;
    console.log("\n--", table);
    for (const c of cols) {
      console.log(`  ${c.column_name} | ${c.data_type} | nullable=${c.is_nullable}`);
    }
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("SNAPSHOT ERROR:", e?.message || e);
  process.exit(1);
});
