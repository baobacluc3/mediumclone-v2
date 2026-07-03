import type { AuthTokens } from "./types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
const BASE = `${API_URL.replace(/\/$/, "")}/api`;

const TOKENS_KEY = "mediumclone.tokens";

export function getTokens(): AuthTokens | null {
  const raw = localStorage.getItem(TOKENS_KEY);
  return raw ? (JSON.parse(raw) as AuthTokens) : null;
}

export function setTokens(tokens: AuthTokens | null): void {
  if (tokens) {
    localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
  } else {
    localStorage.removeItem(TOKENS_KEY);
  }
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/** Pulls a human-readable message out of a NestJS error body, where
 * `message` can be a string or an array of validation errors. */
function errorMessage(body: unknown, fallback: string): string {
  if (body && typeof body === "object" && "message" in body) {
    const message = (body as { message: string | string[] }).message;
    return Array.isArray(message) ? message.join(". ") : message;
  }
  return fallback;
}

async function rawRequest(
  path: string,
  options: RequestInit,
  accessToken?: string,
): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  return fetch(`${BASE}${path}`, { ...options, headers });
}

/**
 * Makes an API request and unwraps the backend's standard response envelope.
 * On a 401 with a stored refresh token, refreshes the token pair once and
 * retries the original request.
 */
export async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  let tokens = getTokens();
  let response = await rawRequest(path, options, tokens?.accessToken);

  if (response.status === 401 && tokens?.refreshToken) {
    const refreshed = await tryRefresh(tokens.refreshToken);
    if (refreshed) {
      tokens = refreshed;
      response = await rawRequest(path, options, tokens.accessToken);
    }
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      errorMessage(body, `Request failed (${response.status})`),
      response.status,
    );
  }

  return (body as { data: T }).data;
}

async function tryRefresh(refreshToken: string): Promise<AuthTokens | null> {
  const response = await rawRequest("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    setTokens(null);
    return null;
  }

  const body = (await response.json()) as { data: AuthTokens };
  setTokens(body.data);
  return body.data;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: data === undefined ? undefined : JSON.stringify(data),
    }),
  put: <T>(path: string, data: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(data) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
