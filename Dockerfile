# Produksjonsbilde for nettsiden (Next.js standalone). Bygg: docker build -t site .
# Byggargumenter speiler NEXT_PUBLIC_* som må være kjent ved bygg.
FROM node:22-alpine AS base
RUN corepack enable && apk add --no-cache libc6-compat
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS build
ARG CMS_PROVIDER=payload
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ENV CMS_PROVIDER=$CMS_PROVIDER NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL NEXT_TELEMETRY_DISABLED=1
# Payload trenger en secret og en database for å laste config under bygg; prod-verdier settes ved kjøring.
ENV PAYLOAD_SECRET=build-only-secret DATABASE_URL=file:./build.db
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM node:22-alpine AS run
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
COPY --from=build --chown=app:app /app/public ./public
USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://127.0.0.1:3000/robots.txt >/dev/null || exit 1
CMD ["node", "server.js"]
