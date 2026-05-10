const rawApiUrl = import.meta.env.VITE_API_URL as string | undefined;

export const API_BASE_URL = rawApiUrl?.replace(/\/+$/, "") ?? "";

export function apiUrl(path: string) {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
