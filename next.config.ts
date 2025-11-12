import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "interactive-examples.mdn.mozilla.net",
      },
    ],
  },
  reactCompiler: true,
};

export default nextConfig;
