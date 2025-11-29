import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron/simple'
import path from 'path'

// Check if running in browser-only mode (no Electron)
const isBrowserMode =
  process.env.npm_lifecycle_event === 'dev:browser' ||
  (process.argv.includes('--mode') && process.argv.includes('browser'))

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Only include electron plugin when not in browser mode
    ...(!isBrowserMode
      ? [
          electron({
            main: {
              // Shortcut of `build.lib.entry`
              entry: 'electron/main.ts',
            },
            preload: {
              // Shortcut of `build.rollupOptions.input`
              input: 'electron/preload.ts',
            },
          }),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@services': path.resolve(__dirname, './src/services'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
    },
  },
  server: {
    port: 3000,
  },
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: true,
  },
})
