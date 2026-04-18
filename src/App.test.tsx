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

    // Default state: level 1 claimed on each axis. All three axes now have 6 levels.
    const autonomyLevels = skillTreeData.axes.autonomy.levels.length
    const parallelLevels = skillTreeData.axes.parallelExecution.levels.length
    const skillUsageLevels = skillTreeData.axes.skillUsage.levels.length

    expect(autonomyLevels).toBe(6)
    expect(parallelLevels).toBe(6)
    expect(skillUsageLevels).toBe(6)

    // All three chips render "Lv 1 of 6"
    const chips = screen.getAllByText(`Lv 1 of ${autonomyLevels}`)
    expect(chips).toHaveLength(3)
  })
})
