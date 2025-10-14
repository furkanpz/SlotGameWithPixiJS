import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    target: 'esnext',
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('pixi.js') || id.includes('/@pixi/') || id.includes('\\@pixi\\')) return 'vendor-pixi';
            if (id.includes('gsap')) return 'vendor-gsap';
            if (id.includes('howler')) return 'vendor-howler';
            return 'vendor';
          }
        },
      },
    },

  },
  publicDir: './public',
  esbuild: {
    target: 'esnext'
  },
  // plugins: [],
  optimizeDeps: {
    exclude: ['pixi.js'],
    include: [
      'eventemitter3',
      'parse-svg-path',
      '@xmldom/xmldom'
    ],
    force: true,
    esbuildOptions: {
      target: 'esnext'
    }
  },
  define: {
    global: 'globalThis'
  },
  server: {
    fs: {
      strict: false
    }
  },
  base: '/lairofriches/',
})
