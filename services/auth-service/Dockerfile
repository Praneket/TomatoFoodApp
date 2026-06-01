FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache dumb-init openssl

FROM base AS deps
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

FROM base AS production
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1
CMD ["dumb-init", "sh", "-c", "npx prisma migrate deploy 2>/dev/null || npx prisma db push --accept-data-loss && node src/server.js"]
