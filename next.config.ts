import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "interactive-examples.mdn.mozilla.net",
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
    ],
  },
  reactCompiler: true,
};

export default nextConfig;
