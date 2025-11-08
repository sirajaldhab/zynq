FROM node:20-alpine as deps
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
RUN pnpm install

FROM deps as builder
COPY . .
RUN pnpm prisma:generate && pnpm build

FROM node:20-alpine as runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 8443
CMD ["node", "dist/main.js"]
