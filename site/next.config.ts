import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["skullet", "@skullet/test-cases"],
};

export default nextConfig;
