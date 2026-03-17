const normalizeApiBaseUrl = (value: string | undefined): string => {
  const fallback = "http://localhost:3001/demo/api";
  const raw = value?.trim() || fallback;
  return raw.replace(/\/+$/, "");
};

const normalizeBasePath = (value: string | undefined): string => {
  const raw = value?.trim() || "/";
  if (raw === "/") {
    return "/";
  }
  return `/${raw.replace(/^\/+|\/+$/g, "")}/`;
};

const normalizeApiRoot = (value: string): string => value.replace(/\/api\/?$/, "");

export const runtimeConfig = {
  apiBaseUrl: normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL),
  apiRoot: normalizeApiRoot(normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL)),
  publicBasePath: normalizeBasePath(import.meta.env.VITE_PUBLIC_BASE_PATH),
} as const;
