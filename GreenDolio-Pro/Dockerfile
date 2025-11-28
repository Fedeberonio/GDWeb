# Dockerfile en la raíz del proyecto para Render
# Render ejecuta desde la raíz cuando Root Directory está vacío
FROM node:18-alpine AS base

# Instalar dependencias solo cuando sea necesario
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copiar archivos de dependencias
COPY package.json package-lock.json* ./
COPY apps/web/package.json apps/web/package-lock.json* ./apps/web/

# Instalar dependencias del workspace
RUN npm ci --workspace=apps/web || npm install --workspace=apps/web

# Rebuild del código fuente solo cuando sea necesario
FROM base AS builder
WORKDIR /app

# Copiar node_modules desde deps
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules

# Copiar código fuente
COPY . .

# Establecer variables de entorno para el build
ENV NEXT_DISABLE_LIGHTNINGCSS=1
ENV NODE_ENV=production

# Build de la aplicación
WORKDIR /app/apps/web
RUN npm run build

# Imagen de producción
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_DISABLE_LIGHTNINGCSS=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar archivos necesarios desde builder
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]

