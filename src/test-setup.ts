import '@testing-library/jest-dom'

// Mock CelebrationEffect globally to avoid imperative DOM manipulation in jsdom
vi.mock('./components/CelebrationEffect', () => ({
  celebrate: vi.fn(),
}))
