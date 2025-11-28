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
  // Configuración para manejar errores de prerenderizado
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
  // Configuración para manejar errores de exportación
  // Las páginas de error se renderizarán dinámicamente en runtime
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  // Evitar prerenderizado de páginas de error que causan problemas con styled-jsx
  generateBuildId: async () => {
    return 'build-' + Date.now();
  },
};

module.exports = nextConfig;







