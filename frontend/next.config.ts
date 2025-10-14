import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

      allowedDevOrigins: [
    // 'http://10.20.11.33:3000'
    'http://localhost:3000'
  ],
    images: {
        remotePatterns: [
          {
            protocol: "https",
            hostname: "images.unsplash.com",
          },
        ],
      },
};

export default nextConfig;
