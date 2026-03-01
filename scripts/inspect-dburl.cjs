require("dotenv").config({ path: ".env.local" });

let s = (process.env.DATABASE_URL || "").trim();

// Strip accidental wrapping quotes
s = s.replace(/^"|"$/g, "");

if (!s) {
  console.error("DATABASE_URL is empty (from .env.local).");
  process.exit(1);
}

let u;
try {
  u = new URL(s);
} catch (e) {
  console.error("DATABASE_URL is not a valid URL string.");
  console.error("RAW:", s);
  console.error(e);
  process.exit(1);
}

console.log("HOST=", u.hostname);
console.log("PORT=", u.port || "(default)");
console.log("DB  =", u.pathname);
console.log("sslmode=", u.searchParams.get("sslmode"));
