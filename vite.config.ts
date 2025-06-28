import { fileURLToPath, URL } from 'node:url'
import UnoCSS from 'unocss/vite'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import packageJson from './package.json'
import { isDev, port, r } from './scripts/utils'
// https://vite.dev/config/

export const sharedConfig = {
  server: {
    open: '/index.html',
  },
  base: './',
  define: {
    __DEV__: isDev,
    __NAME__: JSON.stringify(packageJson.name),
  },
  plugins: [
    vue(),
    vueDevTools(),
    UnoCSS(),
    Components({
      dirs: ['src/components'
        , "src/content"
        , "src/fullDOM"
      ],
      extensions: ['vue'],
      dts: 'src/typings/components.d.ts',
      resolvers: [NaiveUiResolver()],
    }),
    AutoImport({
      dts: 'src/typings/auto-imports.d.ts',
      include: [/\.[tj]s?$/, /\.vue$/, /\.vue\?vue/],
      imports: [
        'vue',
        '@vueuse/core',
        'pinia',
      ],
    }),
  ],
  resolve: {
    alias: {
      '@': r('./src')
    },
  }
}
export default defineConfig({
  ...sharedConfig,
  worker: {
    format: 'es'
  },
  server: {
    port,
    hmr: {
      host: 'localhost',
    },
    origin: `http://localhost:${port}`,
  },
  build: {
    watch: isDev ? {} : undefined,
    outDir: r('dist/'),
    cssCodeSplit: false,
    emptyOutDir: isDev ? true : false, //清空文件夹
    sourcemap: isDev ? 'inline' : false,
    terserOptions: {
      mangle: false,
    },
    rollupOptions: {
      input: {
        index: r(__dirname, 'index.html'),
      },
    },
  }
})
