import type { ApiErrorResponse, ApiResponse } from "./types";
import { getApiBaseUrl } from "../config/env";

const API_BASE_URL = getApiBaseUrl().replace(/\/$/, "");

type FetchOptions = RequestInit & {
  cache?: RequestCache;
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
};

export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { headers, cache, next, ...rest } = options;
  const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

  const response = await fetch(url, {
    ...rest,
    cache,
    next,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...headers,
    },
  });

  if (!response.ok) {
    let errorBody: ApiErrorResponse | null = null;
    try {
      errorBody = (await response.json()) as ApiErrorResponse;
    } catch {
      // ignore parse error
    }

    const message = errorBody?.error ?? `API request failed with status ${response.status}`;
    throw new Error(message);
  }

  const json = (await response.json()) as ApiResponse<T>;
  return json.data;
}
