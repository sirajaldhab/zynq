# Start backend with local SQLite DB (portable)
$env:DATABASE_URL = 'file:./prisma/dev.db'
# Generate client
npx prisma generate --cwd ./backend
# Apply schema
npx prisma db push --cwd ./backend
# Seed data
node ./backend/prisma/seed.mjs
# Start dev server (watch)
npx pnpm@9 -C backend start:dev
