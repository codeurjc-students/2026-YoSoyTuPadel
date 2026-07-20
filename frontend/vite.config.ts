/// <reference types="@testing-library/jest-dom" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import type { UserConfig as ViteConfig } from 'vite'
import type { InlineConfig as VitestConfig } from 'vitest/node'

type ViteWithVitestConfig = ViteConfig & {
  test?: VitestConfig
}

const config: ViteWithVitestConfig = {
  plugins: [react()],
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

export default defineConfig(config as any)