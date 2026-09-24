const BASE = import.meta.env.VITE_API_BASE_URL || "";
const AUTH_API = `${BASE}/api/auth`;

export class SessionExpiredError extends Error {
    constructor() {
        super("Session expired, please login again.");
        this.name = "SessionExpiredError";
    }
}

export const tokenService = {
    getToken: () => localStorage.getItem("token"),
    getRefreshToken: () => localStorage.getItem("refreshToken"),

    save(data: { token: string; refreshToken: string; expiresAt: string }) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("refreshToken", data.refreshToken);
        localStorage.setItem("expiresAt", data.expiresAt);
        scheduleRefresh();
    },

    clear() {
        clearTimeout(timer);
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("expiresAt");
        localStorage.removeItem("user");
    },
};

let refreshPromise: Promise<void> | null = null;

export function refreshSession(): Promise<void> {
    if (!refreshPromise) {
        refreshPromise = (async () => {
            const rt = tokenService.getRefreshToken();
            if (!rt) throw new SessionExpiredError();

            const res = await fetch(`${AUTH_API}/refresh`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refreshToken: rt }),
            });

            if (res.status === 401 || res.status === 400) throw new SessionExpiredError();
            if (!res.ok) throw new Error(`Refresh failed (${res.status})`);

            const json = await res.json();
            tokenService.save(json.data);
        })().finally(() => {
            refreshPromise = null;
        });
    }
    return refreshPromise;
}

let timer: ReturnType<typeof setTimeout>;

export function scheduleRefresh() {
    clearTimeout(timer);
    const exp = localStorage.getItem("expiresAt");
    if (!exp || !tokenService.getRefreshToken()) return;

    const utc = exp.endsWith("Z") ? exp : exp + "Z";
    const lifetime = new Date(utc).getTime() - Date.now();

    const lead = Math.min(2 * 60 * 1000, lifetime * 0.2);
    const ms = lifetime - lead;

    timer = setTimeout(() => {
        refreshSession().catch(() => { });
    }, Math.max(ms, 0));
}

let started = false;

export function startAutoRefresh() {
    if (started) return;
    started = true;
    scheduleRefresh();

    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") scheduleRefresh();
    });
}

export async function logoutUser() {
    const rt = tokenService.getRefreshToken();
    try {
        if (rt) {
            await fetch(`${AUTH_API}/logout`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refreshToken: rt }),
            });
        }
    } catch {
        
    }
    tokenService.clear();
    window.location.href = "/login";
}