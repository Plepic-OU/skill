import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import App from './App'
import { skillTreeData } from './data/skill-trees'

// Mock CelebrationEffect to avoid imperative DOM manipulation in jsdom
vi.mock('./components/CelebrationEffect', () => ({
  celebrate: vi.fn(),
}))

// Mock auth as resolved unauthenticated — LandingPage renders null while loading
vi.mock('./contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({ user: null, loading: false }),
}))

beforeEach(() => {
  localStorage.clear()
})

describe('App', () => {
  it('renders the app heading', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('loads default state when localStorage is empty', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    )
    expect(screen.getByText('Map Your Agentic Skills')).toBeInTheDocument()

    // All three axes now have 6 levels.
    const autonomyLevels = skillTreeData.axes.autonomy.levels.length
    const parallelLevels = skillTreeData.axes.parallelExecution.levels.length
    const skillUsageLevels = skillTreeData.axes.skillUsage.levels.length

    expect(autonomyLevels).toBe(6)
    expect(parallelLevels).toBe(6)
    expect(skillUsageLevels).toBe(6)

    // The axis breakdown inside the LevelCrest shows "1 / 6" for each axis at default state.
    const breakdownLevels = screen.getAllByText(`1 / ${autonomyLevels}`)
    expect(breakdownLevels).toHaveLength(3)
  })
})
