/// <reference types="@testing-library/jest-dom" />
import react from '@vitejs/plugin-react'
import type { UserConfig as ViteConfig } from 'vite'
import type { InlineConfig as VitestConfig } from 'vitest/node'

type ViteWithVitestConfig = ViteConfig & {
  test?: VitestConfig
}

const config: ViteWithVitestConfig = {
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://localhost:8443',
        changeOrigin: true,
        // Local backend uses a self-signed certificate; this applies only to Vite's dev proxy.
        secure: false,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**/*.{js,jsx,ts,tsx}'],
      exclude: ['src/**/*.test.{js,jsx,ts,tsx}', 'src/setupTests.js'],
    },
  },
}

export default config