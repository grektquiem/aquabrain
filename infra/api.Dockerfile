# Imagen de la API NestJS + Prisma.
# El contexto de construcción es la RAÍZ del monorepo (ver docker-compose.yml),
# porque la API consume el paquete del workspace `@aquabrain/shared`.
#
# ── Etapa 1: dependencias y compilación ──────────────────────────────────────
FROM node:20-bookworm-slim AS build
WORKDIR /app

# Se copian solo los manifiestos para aprovechar la caché de capas de Docker.
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY apps/simulator/package.json apps/simulator/
COPY packages/shared/package.json packages/shared/
RUN npm ci

COPY packages/shared packages/shared
COPY apps/api apps/api
RUN npm run build --workspace @aquabrain/shared \
 && npx prisma generate --schema apps/api/prisma/schema.prisma \
 && npm run build --workspace @aquabrain/api

# ── Etapa 2: tiempo de ejecución ─────────────────────────────────────────────
FROM node:20-bookworm-slim AS runtime
WORKDIR /app/apps/api
ENV NODE_ENV=production

COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/package.json /app/package.json
COPY --from=build /app/packages/shared/package.json /app/packages/shared/package.json
COPY --from=build /app/packages/shared/dist /app/packages/shared/dist
COPY --from=build /app/apps/api/package.json ./package.json
COPY --from=build /app/apps/api/prisma ./prisma
COPY --from=build /app/apps/api/dist ./dist

EXPOSE 3000
# `migrate deploy` aplica las migraciones versionadas antes de arrancar (idempotente).
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
