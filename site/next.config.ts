import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["skele", "@skele/test-cases"],
};

export default nextConfig;
