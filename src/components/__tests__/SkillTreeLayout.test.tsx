import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import SkillTreeLayout from '../SkillTreeLayout'
import { DEFAULT_STATE } from '../../data/state'

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: null, loading: false }),
}))

// Renders the layout and reports whether the crest precedes the quest map in
// document order. The crest is a payoff: it leads only for visitors, who came
// to look rather than to claim.
function crestPrecedesTree(ui: React.ReactElement): boolean {
  const { container } = render(<MemoryRouter>{ui}</MemoryRouter>)
  const crest = container.querySelector('#level-crest')
  const tree = container.querySelector('#questMap')
  if (!crest || !tree) {
    throw new Error('Expected both the level crest and the quest map to render')
  }
  const position = crest.compareDocumentPosition(tree)
  return Boolean(position & Node.DOCUMENT_POSITION_FOLLOWING)
}

describe('SkillTreeLayout crest placement', () => {
  it('puts the crest after the tree on the landing page', () => {
    expect(
      crestPrecedesTree(
        <SkillTreeLayout headerMode="landing" state={DEFAULT_STATE} onSafetyZone={vi.fn()} />,
      ),
    ).toBe(false)
  })

  it('puts the crest after the tree on an owner profile, which is also claimable', () => {
    expect(
      crestPrecedesTree(
        <SkillTreeLayout
          headerMode="owner"
          state={DEFAULT_STATE}
          onClaim={vi.fn()}
          onUnclaim={vi.fn()}
          onSafetyZone={vi.fn()}
        />,
      ),
    ).toBe(false)
  })

  it('puts the crest before the tree for a visitor, for whom it is the identity', () => {
    expect(
      crestPrecedesTree(
        <SkillTreeLayout headerMode="visitor" state={DEFAULT_STATE} readOnly visitorName="Ada" />,
      ),
    ).toBe(true)
  })
})
