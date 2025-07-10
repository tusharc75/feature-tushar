import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteTsconfigPaths from 'vite-tsconfig-paths';
import svgrPlugin from 'vite-plugin-svgr';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react({
      jsxImportSource: '@emotion/react',
      babel: {
        plugins: ['@emotion/babel-plugin']
      }
    }),
    svgrPlugin({
      svgrOptions: {}
    }),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*'],
        globIgnores: ['**/*pdfme*.js'],
        maximumFileSizeToCacheInBytes: 25 * 1024 * 1024, // 25 MB
        importScripts: ['/firebase-messaging-sw.js']
      },
      includeAssets: ['**/*']
    }),

    viteTsconfigPaths()
    // splitVendorChunkPlugin()
  ],
  css: {
    preprocessorOptions: {
      scss: {
        // silenceDeprecations: ['legacy-js-api'],
        api: 'modern-compiler',
        quietDeps: true
      },
      sass: {
        api: 'modern-compiler'
      }
    }
  },
  define: {
    global: 'window', // This replaces 'global' with 'window' during bundling
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  },
  build: {
    outDir: 'build',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('/node_modules/@pdfme/')) {
              return 'pdfme';
            }
            return 'vendor';
          }
        }
      }
    }
  },
  server: {
    open: true,
    port: 3000
  },
  optimizeDeps: {
    include: ['buffer']
  }
});
