import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss()
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      chunkSizeWarningLimit: 700,
      sourcemap: false, // disable source maps in production for smaller bundle
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // React core
            if (
              id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react-router-dom/')
            ) return 'vendor-react';

            // TanStack (React Query, Table, etc.)
            if (id.includes('node_modules/@tanstack/')) return 'vendor-tanstack';

            // Chart libraries
            if (
              id.includes('node_modules/recharts') ||
              id.includes('node_modules/d3-') ||
              id.includes('node_modules/victory-')
            ) return 'vendor-charts';

            // Spreadsheet — large
            if (
              id.includes('node_modules/xlsx') ||
              id.includes('node_modules/exceljs')
            ) return 'vendor-xlsx';

            // Lucide icons
            if (id.includes('node_modules/lucide-react')) return 'vendor-lucide';

            // Radix UI + shadcn dependencies
            if (
              id.includes('node_modules/@radix-ui/') ||
              id.includes('node_modules/cmdk') ||
              id.includes('node_modules/vaul')
            ) return 'vendor-radix';

            // All other vendors
            if (id.includes('node_modules/')) return 'vendor-misc';
          },
        },
      },
    },
    server: {
      proxy: {
        // Proxy untuk wilayah.id agar tidak kena CORS di browser
        '/api/wilayah': {
          target: 'https://wilayah.id',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/wilayah/, '/api'),
          secure: true,
        },
      },
    },
  }
})


