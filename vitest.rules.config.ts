import { defineConfig } from 'vitest/config'

// Runs only inside `firebase emulators:exec` (pnpm test:rules), never with the unit tests.
export default defineConfig({
  test: {
    globals: true,
    include: ['firestore-tests/**/*.test.ts'],
  },
})
