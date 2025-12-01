export type ApiResult<T> = { data: T; total?: number; page?: number; pageSize?: number };

function getBase() {
  try {
    const ls = typeof window !== 'undefined' ? window.localStorage : undefined;
    const override = ls?.getItem('API_BASE_URL') || '';
    if (override) return override;
  } catch (_) {}
  const envBase = (import.meta as any).env?.VITE_API_BASE_URL || (import.meta as any).env?.VITE_BACKEND_URL;
  if (envBase) return envBase;
  return 'http://localhost:8443';
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string; retries?: number } = {}
): Promise<T> {
  const { token, retries = 2, ...rest } = options;
  const headers = new Headers(rest.headers as any);
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  else {
    try {
      const lt = typeof window !== 'undefined' ? window.localStorage.getItem('accessToken') : null;
      if (lt) headers.set('Authorization', `Bearer ${lt}`);
    } catch {}
  }

  const base = getBase() || 'http://localhost:3000';
  const url = path.startsWith('http') ? path : `${base}${path}`;

  let lastErr: any;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { ...rest, headers });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        // Attempt refresh on 401 once
        if (res.status === 401) {
          try {
            const base = getBase();
            const rt = typeof window !== 'undefined' ? window.localStorage.getItem('refreshToken') : null;
            if (rt) {
              const r = await fetch(`${base}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: rt }),
              });
              if (r.ok) {
                const data = await r.json();
                try {
                  window.localStorage.setItem('accessToken', data.accessToken);
                  window.localStorage.setItem('token', data.accessToken);
                  window.localStorage.setItem('refreshToken', data.refreshToken);
                } catch {}
                headers.set('Authorization', `Bearer ${data.accessToken}`);
                // retry immediately once after refresh
                const res2 = await fetch(url, { ...rest, headers });
                if (!res2.ok) {
                  const t2 = await res2.text().catch(() => '');
                  throw new Error(`HTTP ${res2.status}: ${t2 || res2.statusText}`);
                }
                const json2 = (await res2.json()) as T;
                return json2;
              }
            }
          } catch (e) {
            // fall through to standard error
          }
        }
        throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
      }
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        const json = (await res.json()) as T;
        return json;
      } else {
        const text = (await res.text()) as any as T;
        return text;
      }
    } catch (err) {
      lastErr = err;
      if (attempt < retries) await sleep(300 * (attempt + 1));
    }
  }
  throw lastErr;
}
