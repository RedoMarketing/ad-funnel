import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export for GitHub Pages at /<repo>/.
  output: "export",
  basePath: process.env.PAGES_BASE_PATH ?? "",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
