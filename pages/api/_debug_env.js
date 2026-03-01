// pages/api/_debug_env.js
export default function handler(req, res) {
  const raw = process.env.DATABASE_URL || "";
  let parsed = null;

  try {
    if (raw) {
      const u = new URL(raw);
      parsed = {
        host: u.hostname,
        port: u.port,
        db: u.pathname,
        hasSslAccept: u.searchParams.get("sslaccept") === "accept_invalid_certs",
        sslmode: u.searchParams.get("sslmode"),
        schema: u.searchParams.get("schema"),
      };
    }
  } catch (e) {
    parsed = { parseError: e?.message };
  }

  res.status(200).json({
    hasDatabaseUrl: Boolean(raw),
    length: raw.length,
    parsed,
  });
}
