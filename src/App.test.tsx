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
    expect(screen.getByRole('heading')).toBeInTheDocument()
  })

  it('loads default state when localStorage is empty', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    )
    expect(screen.getByText('Map Your Agentic Skills')).toBeInTheDocument()

    // Default state: level 1 claimed on each axis. Progress chips show "1/{maxLevel}".
    const autonomyLevels = skillTreeData.axes.autonomy.levels.length
    const parallelLevels = skillTreeData.axes.parallelExecution.levels.length
    const skillUsageLevels = skillTreeData.axes.skillUsage.levels.length

    // Autonomy and Skill Usage both show "1/6"
    const sixLevelChips = screen.getAllByText(`1/${autonomyLevels}`)
    expect(autonomyLevels).toBe(skillUsageLevels)
    expect(sixLevelChips).toHaveLength(2)

    // Parallel Execution shows "1/5"
    expect(screen.getByText(`1/${parallelLevels}`)).toBeInTheDocument()
  })
})
