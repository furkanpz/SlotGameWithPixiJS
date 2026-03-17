const parsePort = (value: string | undefined): number => {
  const parsed = Number.parseInt(value ?? "3001", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 3001;
};

const normalizeUrl = (value: string | undefined, fallback: string): string => {
  const raw = value?.trim() || fallback;
  return raw.replace(/\/+$/, "");
};

const parseOrigins = (value: string | undefined, fallback: string): string[] => {
  const raw = value?.trim() || fallback;
  if (raw === "*") {
    return ["*"];
  }
  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map((origin) => origin.replace(/\/+$/, ""));
};

const publicBaseUrl = normalizeUrl(process.env.PUBLIC_BASE_URL, "http://127.0.0.1:5173");
const allowedOrigins = parseOrigins(
  process.env.CORS_ORIGIN,
  "http://127.0.0.1:5173,http://localhost:5173",
);

export const serverConfig = {
  port: parsePort(process.env.PORT),
  publicBaseUrl,
  allowedOrigins,
  apiMountPath: "/demo",
} as const;
