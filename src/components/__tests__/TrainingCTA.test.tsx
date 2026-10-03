import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import SkillTreeLayout from '../SkillTreeLayout'
import TrainingCTA from '../TrainingCTA'
import { DEFAULT_STATE } from '../../data/state'
import { BOOKING_URL } from '../../data/links'
import type { SkillState } from '../../types/skill-tree'

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: null, loading: false }),
}))

const PROGRESSED: SkillState = {
  autonomy: 3,
  parallelExecution: 4,
  skillUsage: 4,
  safetyZone: 'hardcore',
}

function renderLayout(props: Partial<React.ComponentProps<typeof SkillTreeLayout>>) {
  return render(
    <MemoryRouter>
      <SkillTreeLayout headerMode="landing" state={DEFAULT_STATE} {...props} />
    </MemoryRouter>,
  )
}

function hrefOf(name: RegExp): string {
  return screen.getByRole('link', { name }).getAttribute('href') ?? ''
}

describe('TrainingCTA', () => {
  it('is titled as the bridge from a result to the next level', () => {
    render(<TrainingCTA variant="owner" state={PROGRESSED} />)
    expect(screen.getByRole('heading', { name: 'How to level up from here' })).toBeInTheDocument()
  })

  it('offers the booking page in a new tab, without booking anything', () => {
    render(<TrainingCTA variant="owner" state={PROGRESSED} />)
    const link = screen.getByRole('link', { name: /book a call/i })
    expect(link).toHaveAttribute('href', BOOKING_URL)
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  // The subject is the lead tag: a mail to Kaido with this subject came from
  // the app. It names the skill tree and the class, and the body carries a
  // levels-only link, so no name travels in the mail.
  it('emails the result with a subject the app sets', () => {
    render(<TrainingCTA variant="owner" state={PROGRESSED} />)
    const href = hrefOf(/email your result/i)
    const params = new URLSearchParams(href.slice(href.indexOf('?') + 1))
    expect(href.startsWith('mailto:kaido@plepic.com?')).toBe(true)
    expect(params.get('subject')).toBe('Skill Tree result: Hardened Operator, Lv 3')
    expect(params.get('body')).toContain('/shared/3-4-4-hardcore')
    expect(params.get('body')).not.toContain('Test User')
  })

  it('keeps the training page link with skill-tree attribution', () => {
    render(<TrainingCTA variant="owner" state={PROGRESSED} />)
    const url = new URL(hrefOf(/see the training/i))
    expect(url.origin + url.pathname).toBe('https://plepic.com/training')
    expect(url.searchParams.get('utm_source')).toBe('skilltree')
    expect(url.searchParams.get('utm_medium')).toBe('app')
    expect(url.searchParams.get('utm_campaign')).toBe('skilltree_completion')
    expect(url.searchParams.get('utm_content')).toBe('owner_crest')
  })

  // The placements must stay separable in analytics: a visitor who followed
  // someone else's shared profile is a different signal from an owner who just
  // finished their own assessment, or a landing visitor who never signed in.
  it.each([
    ['landing', 'landing_crest'],
    ['visitor', 'visitor_crest'],
    ['shared', 'shared_crest'],
  ] as const)('tags the %s placement as %s', (variant, content) => {
    render(<TrainingCTA variant={variant} state={PROGRESSED} />)
    const url = new URL(hrefOf(/see the training/i))
    expect(url.searchParams.get('utm_content')).toBe(content)
  })

  it('addresses a visitor rather than assuming they assessed themselves', () => {
    render(<TrainingCTA variant="visitor" state={PROGRESSED} />)
    expect(screen.getByText(/this is the map/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /email this result/i })).toBeInTheDocument()
    expect(screen.queryByText(/you know where you stand/i)).not.toBeInTheDocument()
  })

  it('speaks to the team lead on a shared result', () => {
    render(<TrainingCTA variant="shared" state={PROGRESSED} />)
    expect(screen.getByText(/for team leads/i)).toBeInTheDocument()
  })

  it('renders in owner mode, after the assessment payoff', () => {
    renderLayout({ headerMode: 'owner', onClaim: vi.fn(), onUnclaim: vi.fn() })
    expect(screen.getByRole('complementary', { name: /level up/i })).toBeInTheDocument()
  })

  it('waits for a first claim on the landing page', () => {
    renderLayout({ headerMode: 'landing' })
    expect(screen.queryByRole('complementary', { name: /level up/i })).not.toBeInTheDocument()
  })

  // The landing visitor is the reader Job B exists for: a developer who is not
  // a customer and never signs in. The bridge has to be where they are.
  it('renders on the landing page once any level is claimed', () => {
    renderLayout({ headerMode: 'landing', state: { ...DEFAULT_STATE, autonomy: 2 } })
    expect(screen.getByRole('complementary', { name: /level up/i })).toBeInTheDocument()
  })

  it('renders on a visitor profile', () => {
    renderLayout({ headerMode: 'visitor', readOnly: true, visitorName: 'Ada' })
    expect(screen.getByRole('complementary', { name: /level up/i })).toBeInTheDocument()
  })
})
