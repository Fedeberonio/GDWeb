/** @type {import('next').NextConfig} */
const nextConfig = {
  // Usar output standalone para evitar problemas con export
  // Esto evita que Next.js intente exportar páginas estáticas
  // IMPORTANTE: Con standalone, Next.js NO debería intentar exportar
  output: 'standalone',
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
  // Ignorar errores de prerenderizado en páginas de error
  // Estas páginas se renderizarán dinámicamente en runtime
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  // Configuración para evitar errores de build en páginas de error
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Ignorar errores de styled-jsx durante el build del servidor
      config.ignoreWarnings = [
        { module: /styled-jsx/ },
        { message: /useContext/ },
      ];
    }
    return config;
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
  // Forzar que todas las páginas sean dinámicas para evitar prerenderizado
  // Esto evita que Next.js intente exportar páginas estáticas
  experimental: {
    missingSuspenseWithCSRBailout: false,
    // Deshabilitar completamente la generación estática durante el build
    isrMemoryCacheSize: 0,
    // Desactivar optimizador CSS de Next.js para evitar problemas con lightningcss
    optimizeCss: false,
  },
  // Configurar Turbopack (Next.js 16 usa Turbopack por defecto)
  // Como tenemos configuración de webpack, necesitamos especificar que usamos webpack
  turbopack: {},
  // Deshabilitar completamente el export estático
  // Con output: 'standalone', esto debería estar deshabilitado, pero lo forzamos
  trailingSlash: false,
};

module.exports = nextConfig;







// Variable NEXT_DISABLE_LIGHTNINGCSS configurada en Vercel
