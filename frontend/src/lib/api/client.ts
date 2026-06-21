// --- API CLIENT — TYPED FETCH WRAPPER ---

// → two flavors: server (cookie forwarding) and client (browser fetch)

// --- Types ---

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

type ApiError = {
  status: number;
  message: string;
  detail?: unknown;
};

// --- Base URL ---

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

// --- Error class ---

export class ApiRequestError extends Error {
  status: number;
  detail?: unknown;

  constructor({ status, message, detail }: ApiError) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.detail = detail;
  }
}

// --- Core fetch ---

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, headers: customHeaders, ...rest } = options;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...customHeaders,
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });

  if (!response.ok) {
    let detail: unknown;
    try {
      detail = await response.json();
    } catch {
      // → response body may not be JSON
    }

    throw new ApiRequestError({
      status: response.status,
      message: `API error: ${response.status} ${response.statusText}`,
      detail,
    });
  }

  // → handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

// --- Client-side API (browser, "use client" components) ---

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "GET" }),

  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "POST", body }),

  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PATCH", body }),

  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PUT", body }),

  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "DELETE" }),
};

// --- Server-side API (Server Components, cookie forwarding) ---

export async function serverApi<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  // → dynamic import to avoid pulling next/headers into client bundle
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  return request<T>(path, {
    ...options,
    headers: {
      ...options.headers,
      Cookie: cookieHeader,
    },
  });
}
