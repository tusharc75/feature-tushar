import { defineConfig, splitVendorChunkPlugin } from 'vite';
import react from '@vitejs/plugin-react'
import viteTsconfigPaths from 'vite-tsconfig-paths';
import svgrPlugin from 'vite-plugin-svgr';
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
    plugins: [
        react(),
        svgrPlugin({
            svgrOptions: {
            },
        }),
        VitePWA({
            registerType: 'autoUpdate',
            workbox: {
                globPatterns: ["**/*"],
                maximumFileSizeToCacheInBytes: 10000000
            },
            includeAssets: [
                "**/*",
            ],
        }),
        viteTsconfigPaths(),
        splitVendorChunkPlugin()
    ],

    build: {
        outDir: 'build',
    },
    server: {
        open: true,
    },
});