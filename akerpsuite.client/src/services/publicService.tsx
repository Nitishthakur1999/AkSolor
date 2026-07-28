const PUBLIC_API_BASE = "https://localhost:7272/api/public";

interface ApiResponse<T> {
    success?: boolean;
    message?: string;
    data?: T;
}

async function publicApiCall<T = any>(
    url: string,
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" = "GET",
    body?: unknown
): Promise<ApiResponse<T>> {
    const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    let data: ApiResponse<T> | null = null;
    try {
        data = await res.json();
    } catch {
        // no JSON body — fine for some responses
    }

    if (!res.ok) {
        throw new Error(data?.message || `Request failed (${res.status})`);
    }

    return data as ApiResponse<T>;
}

export interface ContactQueryPayload {
    name: string;
    phone: string;
    email: string;
    subject: string;
    message: string;
}

export const publicSiteService = {
    getBanners: () => publicApiCall(`${PUBLIC_API_BASE}/banner`),
    getGallery: () => publicApiCall(`${PUBLIC_API_BASE}/gallery`),
    getTeam: () => publicApiCall(`${PUBLIC_API_BASE}/team`),
    getProjects: () => publicApiCall(`${PUBLIC_API_BASE}/projects`),
    getHighlights: () => publicApiCall(`${PUBLIC_API_BASE}/highlights`),
    getCareers: () => publicApiCall(`${PUBLIC_API_BASE}/career`),

    // Public visitor submits an enquiry — no auth required.
    submitContactQuery: (payload: ContactQueryPayload) =>
        publicApiCall(`${PUBLIC_API_BASE}/contact-query`, "POST", payload),
};