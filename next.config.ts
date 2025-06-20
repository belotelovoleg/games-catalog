import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for better performance on Amplify
  output: 'standalone',
  
  // Image optimization settings for Amplify
  images: {
    domains: ['images.igdb.com'],
    unoptimized: false,
  },
  
  // Environment variable configuration
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    IGDB_CLIENT_ID: process.env.IGDB_CLIENT_ID,
    IGDB_CLIENT_SECRET: process.env.IGDB_CLIENT_SECRET,
  },
  
  // External packages for server components
  serverExternalPackages: ['@prisma/client'],
};

export default nextConfig;
