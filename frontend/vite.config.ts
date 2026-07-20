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
  },
}

export default defineConfig(config as any)