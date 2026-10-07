import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server bundle for the Docker image (node server.js)
  output: "standalone",
  // Hide the floating "N" development badge (it never appears on the live site anyway)
  devIndicators: false,
};

export default nextConfig;
