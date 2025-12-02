# Deployment & Verification Checklist

Last updated: 2025-12-02

## 1. Environment Configuration

| Variable | Required | Description |
| --- | --- | --- |
| `NODE_ENV` | ✅ | Set to `production` for both backend and frontend builds. |
| `DATABASE_URL` | ✅ | PostgreSQL connection string used by Prisma. |
| `JWT_SECRET` | ✅ | Strong 32+ char signing key. Backend boot fails if missing. |
| `REDIS_URL` (if applicable) | ➖ | Only needed if enabling cache/session adapters. |
| `PORT` | ➖ | Defaults to `8443`. Override if running behind reverse proxy. |
| `SOCKET_URL` | ✅ (frontend) | Points to backend websocket origin for forced logout events. |
| `VITE_API_BASE_URL` | ✅ (frontend) | Base REST API endpoint. |
| `VITE_SOCKET_PATH` | ➖ | Only needed when proxying websockets through non-default path. |

> **Tip:** keep `.env` files out of source control. Mirror the same values in CI/CD secrets.

## 2. Backend Readiness

1. `pnpm install` (or npm/yarn) inside `backend/` to ensure new deps (`@nestjs/throttler`, etc.) are installed.
2. Run Prisma migrations:
   ```bash
   pnpm prisma migrate deploy
   pnpm prisma generate
   ```
3. Seed roles/admin (automatic on boot) or run `pnpm prisma db seed` if available.
4. Start backend with production flags:
   ```bash
   NODE_ENV=production PORT=8443 pnpm start:prod
   ```
5. Confirm logs show:
   - Helmet + cookie-parser initialized
   - Global validation/rate limiting active
   - No missing env warnings

## 3. Frontend Build

1. In `frontend/` run:
   ```bash
   pnpm install
   VITE_API_BASE_URL=https://api.example.com VITE_SOCKET_URL=wss://api.example.com pnpm build
   ```
2. Output lives in `frontend/dist`. Serve via static host or reverse proxy (e.g., nginx) with HTTPS.
3. Ensure reverse proxy forwards websocket traffic to backend `/socket.io`.

## 4. Verification Steps

1. **Auth flows**
   - Login/logout + refresh token rotation
   - Forced logout when admin deactivates a user (watch console + websocket events)
2. **Admin > Users**
   - Create/update/approve/reject/delete users (System Logs should record each action)
   - Ensure throttling and form validation behave
3. **Dashboard & Finance**
   - Verify KPI cards render with production data
   - Trigger API failure (temporary network block) and confirm toasts appear
4. **Material Delivery imports**
   - Upload sample Excel, ensure vendor auto-resolution + error toasts
5. **Budgets/Expenses**
   - Confirm pagination + filters work and toasts show on failure
6. **Realtime logout**
   - Deactivate a user from admin: all active sessions receive forced logout event
7. **Logs**
   - `SystemLogs` endpoint returns recent entries (audit trail)
   - Ship logs to centralized store if hosting requires (e.g., CloudWatch)

## 5. Monitoring & Alerts

- Set up uptime monitoring for backend `/health` (add endpoint if missing)
- Watch database connections + CPU/memory
- Configure alerting for 4xx/5xx spikes via log stack

## 6. Rollback Plan

- Keep previous backend + frontend artifacts ready
- Database migrations should be reversible (have backup before deploying)
- Document steps to re-enable old version quickly if needed

---
This checklist should be updated as new modules are hardened. Add service-specific steps (Payroll, HR, Projects) once their audits complete.
