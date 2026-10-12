# ------------------------------------------------------------------
# HABANERA — ERP Bar & Cuisine (MVP) · réalisé par IZEMX
# Image unique : le serveur Express sert l'API (/api) et le front buildé.
#   docker build -t izemx/habanera-mvp .
#   docker run -d -p 8787:8787 --env-file .env izemx/habanera-mvp
# ------------------------------------------------------------------

# ---------- 1. build front + back ----------
FROM node:20-bookworm-slim AS build
WORKDIR /app
ENV NPM_CONFIG_FUND=false NPM_CONFIG_AUDIT=false
COPY package.json ./
COPY client/package.json client/
COPY server/package.json server/
RUN npm install --workspaces --include-workspace-root
COPY client client
COPY server server
RUN npm run build -w client && npm run build -w server

# ---------- 2. image finale (prod, légère) ----------
FROM node:20-bookworm-slim AS runtime
ENV NODE_ENV=production \
    API_PORT=8787 \
    NPM_CONFIG_FUND=false NPM_CONFIG_AUDIT=false
WORKDIR /app

COPY package.json ./
COPY server/package.json server/
RUN npm install --workspace server --omit=dev && npm cache clean --force

COPY --from=build /app/server/dist server/dist
COPY --from=build /app/client/dist client/dist

RUN useradd --system --create-home --uid 10001 app && chown -R app:app /app
USER app

EXPOSE 8787
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8787/api/status').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server/dist/index.js"]
