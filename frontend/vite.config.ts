import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag === 'model-viewer'
        }
      }
    }),
    tailwindcss(),
  ],
  server: {
    host: true,
    port: 5173,
    watch: {
      usePolling: true
    },
    hmr: {
        clientPort: 4000 
    }
  }
})

