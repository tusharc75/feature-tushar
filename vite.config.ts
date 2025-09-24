import { defineConfig, Plugin, splitVendorChunkPlugin } from 'vite';
import react from '@vitejs/plugin-react';
import viteTsconfigPaths from 'vite-tsconfig-paths';
import svgrPlugin from 'vite-plugin-svgr';
import { VitePWA } from 'vite-plugin-pwa';

function stripVendorMaps(): Plugin {
  return {
    name: 'strip-vendor-maps',
    generateBundle(_, bundle) {
      for (const file in bundle) {
        if (file.endsWith('.map') && file.includes('vendor')) {
          delete bundle[file];
        }
      }
    }
  };
}

export default defineConfig({
  plugins: [
    stripVendorMaps(),
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
        globIgnores: ['**/*.map', '**/*pdfme*.js'],
        maximumFileSizeToCacheInBytes: 26 * 1024 * 1024, // 26 MB
        importScripts: ['/firebase-messaging-sw.js']
      },
      includeAssets: ['**/*']
    }),

    viteTsconfigPaths(),
    splitVendorChunkPlugin()
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
    minify: 'esbuild',
    sourcemap: true,
    rollupOptions: {
      output: {
        sourcemapExcludeSources: true,
        sourcemapIgnoreList: (p) => p.includes('node_modules')
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
