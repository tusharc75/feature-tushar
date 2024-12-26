import { defineConfig, splitVendorChunkPlugin } from 'vite';
import react from '@vitejs/plugin-react';
import viteTsconfigPaths from 'vite-tsconfig-paths';
import svgrPlugin from 'vite-plugin-svgr';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react({
      jsxImportSource: '@emotion/react',
      babel: {
        plugins: ['@emotion/babel-plugin'],
      },
    }),
    svgrPlugin({
      svgrOptions: {}
    }),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*'],
        maximumFileSizeToCacheInBytes: 20000000
      },
      includeAssets: ['**/*']
    }),
    viteTsconfigPaths(),
    splitVendorChunkPlugin()
  ],

  build: {
    outDir: 'build'
  },
  server: {
    open: true,
    port: 3000
  }
});
