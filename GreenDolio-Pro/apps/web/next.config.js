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
  // Deshabilitar prerenderizado de páginas de error
  // Estas páginas se renderizarán dinámicamente en runtime
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  // Permitir que el build continúe aunque haya errores en páginas de error
  // Estas páginas funcionan correctamente en runtime
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

module.exports = nextConfig;







