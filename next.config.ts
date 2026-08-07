import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: process.env.GITHUB_ACTIONS ? "/InspireWithMusic" : "",
  assetPrefix: process.env.GITHUB_ACTIONS ? "/InspireWithMusic/" : "",
};

export default nextConfig;
