import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'polyfill-process',
      transformIndexHtml() {
        return [{
          tag: 'script',
          children: 'window.process = { env: {} }',
        }]
      },
    },
  ],
  define: { 'process.env': '({})' },
})
