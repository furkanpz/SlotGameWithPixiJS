import { defineConfig, loadEnv } from "vite";

const normalizeBasePath = (value: string | undefined): string => {
  const raw = value?.trim() || "/";
  if (raw === "/") {
    return "/";
  }
  return `/${raw.replace(/^\/+|\/+$/g, "")}/`;
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");

  return {
    base: normalizeBasePath(env.VITE_PUBLIC_BASE_PATH),
    build: {
      target: "esnext",
      sourcemap: false,
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) {
              return;
            }
            if (id.includes("pixi.js") || id.includes("/@pixi/") || id.includes("\\@pixi\\")) {
              return "vendor-pixi";
            }
            if (id.includes("howler")) {
              return "vendor-howler";
            }
            return;
          },
        },
      },
    },
    publicDir: "./public",
    esbuild: {
      target: "esnext",
    },
    optimizeDeps: {
      force: true,
      esbuildOptions: {
        target: "esnext",
      },
    },
    define: {
      global: "globalThis",
    },
    server: {
      fs: {
        strict: false,
      },
    },
  };
});
