# Dockerfile para Next.js con output standalone
# Este Dockerfile debe ejecutarse desde la raíz del proyecto (GreenDolio-Pro)
# Render ejecuta el build desde el Root Directory (apps/web), así que necesitamos ajustar las rutas
FROM node:18-alpine AS base

# Instalar dependencias solo cuando sea necesario
FROM base AS deps
# Verificar que libc6-compat esté instalado para compatibilidad con binarios nativos
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copiar archivos de dependencias
# Si Render ejecuta desde apps/web, necesitamos copiar desde el contexto padre
COPY ../../package.json ../../package-lock.json* ./
COPY package.json package-lock.json* ./web/

# Instalar dependencias
RUN cd web && npm ci || npm install

# Rebuild del código fuente solo cuando sea necesario
FROM base AS builder
WORKDIR /app

# Copiar node_modules desde deps
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/web/node_modules ./web/node_modules

# Copiar código fuente
# Render copia el contenido del Root Directory a /opt/render/project/src
# Necesitamos copiar desde el contexto correcto
COPY ../../ ./
COPY . ./web/

# Establecer variables de entorno para el build
ENV NEXT_DISABLE_LIGHTNINGCSS=1
ENV NODE_ENV=production

# Build de la aplicación
WORKDIR /app/web
RUN npm run build

# Imagen de producción, copiar todos los archivos y ejecutar next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_DISABLE_LIGHTNINGCSS=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar archivos necesarios desde builder
# Con output: 'standalone', Next.js crea una carpeta standalone con todo lo necesario
COPY --from=builder --chown=nextjs:nodejs /app/web/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/web/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Ejecutar la aplicación
# Con output standalone, el servidor está en ./server.js
CMD ["node", "server.js"]

