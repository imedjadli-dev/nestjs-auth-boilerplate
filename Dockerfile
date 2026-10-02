FROM node:24-alpine AS builder

RUN corepack enable
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts

COPY . .
RUN pnpm prisma generate
RUN pnpm run build

ENV NODE_ENV=production
USER node
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
CMD wget -qO- http://localhost:4000/health || exit 1

CMD ["node", "dist/src/main"]
