import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@ssc/db", "@ssc/shared"],
};

export default nextConfig;
