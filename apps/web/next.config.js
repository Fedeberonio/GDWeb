/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "greendolio.shop",
      },
    ],
  },
  experimental: {
    missingSuspenseWithCSRBailout: false,
    optimizeCss: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.ignoreWarnings = [
        { module: /styled-jsx/ },
        { message: /useContext/ },
      ];
    }
    return config;
  },
};

module.exports = nextConfig;
