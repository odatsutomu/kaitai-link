// 解体LINK フロントエンド → API 通信クライアント

const BASE = "/api/kaitai";

async function req<T>(
  path: string,
  method: string = "GET",
  body?: unknown
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body:    body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? res.statusText);
  return json as T;
}

// ── Auth ──────────────────────────────────────────────────────────

export const kaitaiApi = {
  auth: {
    signup: (data: {
      name: string; address: string; phone: string;
      adminName: string; adminEmail: string;
      password1: string; password2: string; plan: string;
    }) => req("/auth/signup", "POST", data),

    login: (email: string, password: string) =>
      req<{ ok: boolean; authLevel: string; company: Record<string, unknown> }>(
        "/auth/login", "POST", { email, password }
      ),

    logout: () => req("/auth/logout", "POST"),

    me: () =>
      req<{ companyId: string; authLevel: string; plan: string; adminName: string; companyName: string }>(
        "/auth/me"
      ),
  },

  // ── Sites ──────────────────────────────────────────────────────
  sites: {
    list: () => req<{ sites: unknown[] }>("/sites"),
    create: (data: Record<string, unknown>) => req("/sites", "POST", data),
  },

  // ── Equipment ──────────────────────────────────────────────────
  equipment: {
    list: () => req<{ equipment: unknown[] }>("/equipment"),
    create: (data: Record<string, unknown>) => req("/equipment", "POST", data),
    update: (id: string, patch: Record<string, unknown>) =>
      req("/equipment", "PATCH", { id, ...patch }),
  },

  // ── Expense ────────────────────────────────────────────────────
  expense: {
    list: (siteId?: string) =>
      req<{ logs: unknown[] }>(`/expense${siteId ? `?siteId=${siteId}` : ""}`),
    create: (data: Record<string, unknown>) => req("/expense", "POST", data),
  },

  // ── Clients ────────────────────────────────────────────────────
  clients: {
    list: () => req<{ clients: unknown[] }>("/clients"),
    create: (data: Record<string, unknown>) => req("/clients", "POST", data),
    update: (id: string, patch: Record<string, unknown>) =>
      req("/clients", "PATCH", { id, ...patch }),
  },

  // ── Image upload ───────────────────────────────────────────────
  upload: (
    dataUrl: string,
    opts: { siteId?: string; reportType?: string; uploadedBy?: string }
  ) => req<{ image: { id: string; url: string; expiresAt: string | null } }>(
    "/upload", "POST", { dataUrl, ...opts }
  ),
};
