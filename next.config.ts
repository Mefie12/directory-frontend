import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  /* config options here */
  images: {
    // Next.js 16 blocks the image optimizer from fetching private/loopback IPs
    // (SSRF guard) even when the hostname is in remotePatterns. Local dev serves
    // media from http://localhost:8000, so opt in for dev only.
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== "production",
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
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/**',
      },
      // {
      //   protocol: 'http',
      //   hostname: 'localhost',
      //   port: '8000',
      //   pathname: '/**',
      // },
      
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
