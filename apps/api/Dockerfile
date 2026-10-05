# EatOS API. Build from the repository root:
#   docker build -f apps/api/Dockerfile -t eatos-api .
FROM node:22-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable
WORKDIR /repo

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY packages/core/package.json packages/core/
COPY apps/api/package.json apps/api/
COPY apps/app/package.json apps/app/
# Only what the API needs; the Expo app is not installed.
RUN pnpm install --frozen-lockfile --filter @eatos/api...

FROM base
ENV NODE_ENV=production PORT=8787 EATOS_DATA=/data HOST=0.0.0.0
COPY --from=deps /repo/node_modules ./node_modules
COPY tsconfig.base.json ./
COPY packages/core packages/core
COPY apps/api apps/api
COPY --from=deps /repo/apps/api/node_modules apps/api/node_modules
RUN mkdir -p /data && chown -R node:node /data
USER node
VOLUME /data
EXPOSE 8787
HEALTHCHECK --interval=30s --timeout=3s CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/v1/health-check').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
WORKDIR /repo/apps/api
CMD ["node", "--import", "tsx", "src/main.ts"]
