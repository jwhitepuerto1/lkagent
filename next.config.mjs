/** @type {import('next').NextConfig} */
const nextConfig = {
  // Produces a self-contained .next/standalone build (server + only the
  // node_modules it actually needs) - keeps the Docker image lean and
  // avoids shipping the full node_modules tree.
  output: "standalone",
};

export default nextConfig;
