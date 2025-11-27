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
  // Deshabilitar prerenderizado de páginas de error para evitar problemas con styled-jsx
  // Estas páginas se renderizarán dinámicamente en runtime
  generateBuildId: async () => {
    // Forzar rebuild para evitar cache de prerenderizado
    return 'build-' + Date.now();
  },
};

module.exports = nextConfig;







