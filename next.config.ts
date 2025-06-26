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
    IGDB_CLIENT_ID: process.env.IGDB_CLIENT_ID,
    IGDB_CLIENT_SECRET: process.env.IGDB_CLIENT_SECRET,
    JWT_SECRET: process.env.JWT_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID,
    S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY,
    S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
    S3_REGION: process.env.S3_REGION,
  },
  
  // External packages for server components
  serverExternalPackages: ['@prisma/client'],
};

export default nextConfig;
