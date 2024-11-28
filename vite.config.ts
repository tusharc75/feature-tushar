import { defineConfig, splitVendorChunkPlugin } from 'vite';
import react from '@vitejs/plugin-react';
import viteTsconfigPaths from 'vite-tsconfig-paths';
import svgrPlugin from 'vite-plugin-svgr';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import fs from 'fs';

const WRONG_CODE = `import { bpfrpt_proptype_WindowScroller } from "../WindowScroller.js";`;

function reactVirtualized() {
  return {
    name: 'my:react-virtualized',
    configResolved() {
      const file = require
        .resolve('react-virtualized')
        .replace(path.join('dist', 'commonjs', 'index.js'), path.join('dist', 'es', 'WindowScroller', 'utils', 'onScroll.js'));
      const code = fs.readFileSync(file, 'utf-8');
      const modified = code.replace(WRONG_CODE, '');
      fs.writeFileSync(file, modified);
    }
  };
}

export default defineConfig({
  plugins: [
    reactVirtualized(),
    react(),
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
