import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import SkillTreeLayout from '../SkillTreeLayout'
import TrainingCTA from '../TrainingCTA'
import { DEFAULT_STATE } from '../../data/state'

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: null, loading: false }),
}))

function renderLayout(props: Partial<React.ComponentProps<typeof SkillTreeLayout>>) {
  return render(
    <MemoryRouter>
      <SkillTreeLayout headerMode="landing" state={DEFAULT_STATE} {...props} />
    </MemoryRouter>,
  )
}

describe('TrainingCTA', () => {
  it('links to the training page with skill-tree attribution', () => {
    render(<TrainingCTA />)
    const link = screen.getByRole('link', { name: /see the training/i })
    const url = new URL(link.getAttribute('href') ?? '')
    expect(url.origin + url.pathname).toBe('https://plepic.com/training')
    expect(url.searchParams.get('utm_source')).toBe('skilltree')
    expect(url.searchParams.get('utm_medium')).toBe('app')
    expect(url.searchParams.get('utm_campaign')).toBe('skilltree_completion')
    expect(url.searchParams.get('utm_content')).toBe('owner_crest')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('renders in owner mode, after the assessment payoff', () => {
    renderLayout({ headerMode: 'owner', onClaim: vi.fn(), onUnclaim: vi.fn() })
    expect(screen.getByRole('complementary', { name: /training offer/i })).toBeInTheDocument()
  })

  it('does not render on the landing page', () => {
    renderLayout({ headerMode: 'landing' })
    expect(screen.queryByRole('complementary', { name: /training offer/i })).not.toBeInTheDocument()
  })

  it('does not render on a visitor profile', () => {
    renderLayout({ headerMode: 'visitor', readOnly: true, visitorName: 'Ada' })
    expect(screen.queryByRole('complementary', { name: /training offer/i })).not.toBeInTheDocument()
  })
})
