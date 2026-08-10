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

  // The two placements must stay separable in analytics: a visitor who followed
  // someone else's shared profile is a different signal from an owner who just
  // finished their own assessment.
  it('tags the visitor variant separately from the owner variant', () => {
    render(<TrainingCTA variant="visitor" />)
    const url = new URL(
      screen.getByRole('link', { name: /see the training/i }).getAttribute('href') ?? '',
    )
    expect(url.searchParams.get('utm_content')).toBe('visitor_crest')
  })

  it('addresses a visitor rather than assuming they assessed themselves', () => {
    render(<TrainingCTA variant="visitor" />)
    expect(screen.getByText(/this is the map/i)).toBeInTheDocument()
    expect(screen.queryByText(/you've mapped where you stand/i)).not.toBeInTheDocument()
  })

  it('renders in owner mode, after the assessment payoff', () => {
    renderLayout({ headerMode: 'owner', onClaim: vi.fn(), onUnclaim: vi.fn() })
    expect(screen.getByRole('complementary', { name: /training offer/i })).toBeInTheDocument()
  })

  it('does not render on the landing page', () => {
    renderLayout({ headerMode: 'landing' })
    expect(screen.queryByRole('complementary', { name: /training offer/i })).not.toBeInTheDocument()
  })

  // Changed deliberately: a shared profile is the one path a prospect sent a
  // colleague's link actually walks, and it used to dead-end with no route to
  // the training at all.
  it('renders on a visitor profile', () => {
    renderLayout({ headerMode: 'visitor', readOnly: true, visitorName: 'Ada' })
    expect(screen.getByRole('complementary', { name: /training offer/i })).toBeInTheDocument()
  })
})
