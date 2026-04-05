import { render, screen } from '@testing-library/react'
import App from './App'

// Mock CelebrationEffect to avoid imperative DOM in jsdom
vi.mock('./components/CelebrationEffect', () => ({
  celebrate: vi.fn(),
}))

beforeEach(() => {
  localStorage.clear()
})

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />)
    expect(screen.getByRole('heading')).toBeInTheDocument()
  })

  it('loads default state when localStorage is empty', () => {
    render(<App />)
    expect(screen.getByText('Map Your Agentic Skills')).toBeInTheDocument()
    // Both Autonomy (6 levels) and Skill Usage (6 levels) show 1/6
    const chips = screen.getAllByText('1/6')
    expect(chips.length).toBe(2)
    expect(screen.getByText('1/5')).toBeInTheDocument()
  })
})
