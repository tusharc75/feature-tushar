import { defineConfig } from 'vite';
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
            //registerType: 'autoUpdate',
            workbox: {
                globPatterns: ["**/*"],
            },
            // add this to cache all the
            // static assets in the public folder
            includeAssets: [
                "**/*",
            ],
        }),
        viteTsconfigPaths()],
    build: {
        outDir: 'build',
    },
    server: {
        open: true,
    },
});