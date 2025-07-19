import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Test file patterns
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    
    // Environment
    environment: 'node',
    
    // Reporter
    reporters: ['verbose'],
    
    // Globals (allows using describe, it, expect without imports)
    globals: true,

    // Pool and threads for better performance
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
  },
}); 