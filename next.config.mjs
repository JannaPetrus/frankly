/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "pg"],
  },
  webpack: (config) => {
    config.resolve.alias["pg-native"] = false;
    return config;
  },
};

export default nextConfig;
