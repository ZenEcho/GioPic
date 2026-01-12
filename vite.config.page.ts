import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import { isDev } from './manifest/utils'

export default defineConfig({
  plugins: [
    vue(),
    UnoCSS(),
  ],
  build: {
    watch: isDev ? {} : undefined,
    emptyOutDir: false,
    outDir: 'dist',
    minify: false,
    cssCodeSplit: false,
    rollupOptions: {
      input: {
        page: fileURLToPath(new URL('./src/content/page/index.ts', import.meta.url))
      },
      output: {
        format: 'iife',
        entryFileNames: 'content/page.js',
        name: 'GioPicPage',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'content/page.css'
          }
          return 'assets/[name]-[hash][extname]'
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})

