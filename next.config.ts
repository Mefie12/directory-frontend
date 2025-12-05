import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "interactive-examples.mdn.mozilla.net",
        pathname: "/**", // Added pathname for better pattern matching
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
        pathname: "/**", // Added pathname for better pattern matching
      },
      {
        protocol: "https",
        hostname: "mefie-bucket.s3.eu-north-1.amazonaws.com",
        pathname: "/**", // This will allow all paths from this domain
      },
      // Optional: Add broader AWS S3 patterns if you have multiple buckets
      {
        protocol: "https",
        hostname: "**.s3.eu-north-1.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.s3.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "me-fie.co.uk",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.me-fie.co.uk",
        pathname: "/**",
      },
    ],
    // Optional: If you want to be more specific about the path
    // remotePatterns: [
    //   {
    //     protocol: "https",
    //     hostname: "mefie-bucket.s3.eu-north-1.amazonaws.com",
    //     pathname: "/listings/**", // Only allow listings folder
    //   },
    // ],
  },
  reactCompiler: true,
};

export default nextConfig;
