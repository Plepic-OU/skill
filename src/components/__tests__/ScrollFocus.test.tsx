import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import Header from '../Header'
import LevelCrest from '../LevelCrest'
import PathNav from '../PathNav'
import SkillTree from '../SkillTree'
import { skillTreeData } from '../../data/skill-trees'
import type { SkillState } from '../../types/skill-tree'

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: null, loading: false }),
}))

const STATE: SkillState = { autonomy: 2, parallelExecution: 1, skillUsage: 3, safetyZone: 'normal' }

beforeEach(() => {
  // Not desktop, so PathNav renders its tiles.
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
  Element.prototype.scrollIntoView = vi.fn()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('scroll jumps move focus to their target', () => {
  it('focuses the path section when a path tile is activated', () => {
    const { container } = render(
      <>
        <PathNav state={STATE} />
        <SkillTree state={STATE} />
      </>,
    )
    fireEvent.click(
      screen.getByRole('button', { name: new RegExp(skillTreeData.axes.skillUsage.name) }),
    )
    expect(document.activeElement).toBe(container.querySelector('[data-quest-path="skillUsage"]'))
  })

  it('focuses the class crest when the level badge is activated', () => {
    render(
      <MemoryRouter>
        <Header mode="landing" state={STATE} />
        <LevelCrest state={STATE} />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByRole('button', { name: /jump to class details/i }))
    expect(document.activeElement).toBe(screen.getByRole('region', { name: /your class/i }))
  })

  it('jumps instead of smooth-scrolling for users who prefer reduced motion', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      addEventListener: () => {},
      removeEventListener: () => {},
    }))
    render(
      <MemoryRouter>
        <Header mode="landing" state={STATE} />
        <LevelCrest state={STATE} />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByRole('button', { name: /jump to class details/i }))
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: 'auto' }),
    )
  })
})
