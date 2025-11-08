# Frontend dev image (vite dev server)
FROM node:20-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
RUN pnpm install
COPY . .
EXPOSE 5173
CMD ["pnpm", "dev", "--host"]
