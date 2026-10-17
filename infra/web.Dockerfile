# Imagen del dashboard React (build con Vite + servido por nginx).
# nginx también actúa de proxy inverso hacia la API, de modo que el navegador
# ve un único origen (sin CORS y con la cookie del refresh como same-origin).
#
# ── Etapa 1: compilación del bundle ──────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/
RUN npm ci --workspace @aquabrain/web --include-workspace-root
COPY apps/web apps/web
RUN npm run build --workspace @aquabrain/web

# ── Etapa 2: servidor estático ───────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY infra/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
