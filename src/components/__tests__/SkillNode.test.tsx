import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SkillNode from '../SkillNode'
import type { Level } from '../../types/skill-tree'

// Mock CelebrationEffect to avoid imperative DOM manipulation in jsdom
vi.mock('../CelebrationEffect', () => ({
  celebrate: vi.fn(),
}))

const mockLevel: Level = {
  level: 2,
  name: 'Review Every Edit',
  desc: 'AI generates code blocks or diffs.',
  levelIcon: 'rate_review',
  verification: 'Human reviews every diff.',
  obstacles: ['Review fatigue'],
  howToProgress: ['Set up YOLO mode'],
}

function getSkillNodeButton() {
  return screen.getByLabelText(/Level 2: Review Every Edit/)
}

describe('SkillNode', () => {
  const defaultProps = {
    level: mockLevel,
    axisId: 'autonomy' as const,
    color: '#4a7c59',
    nodeState: 'frontier' as const,
    isHighestClaimed: false,
    isExpanded: false,
    onToggle: vi.fn(),
    onClaim: vi.fn(),
    onUnclaim: vi.fn(),
  }

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders with correct aria-label', () => {
    render(<SkillNode {...defaultProps} />)
    expect(getSkillNodeButton()).toHaveAttribute(
      'aria-label',
      'Level 2: Review Every Edit — up next',
    )
  })

  it('shows "You are here" for highest claimed', () => {
    render(
      <SkillNode {...defaultProps} nodeState="claimed" isHighestClaimed={true} isExpanded={true} />,
    )
    expect(screen.getByText('You are here')).toBeInTheDocument()
  })

  it('calls onToggle when clicked', () => {
    render(<SkillNode {...defaultProps} />)
    fireEvent.click(getSkillNodeButton())
    expect(defaultProps.onToggle).toHaveBeenCalledTimes(1)
  })

  it('calls onToggle on Enter and Space on the card header', async () => {
    const user = userEvent.setup()
    render(<SkillNode {...defaultProps} />)
    getSkillNodeButton().focus()
    await user.keyboard('{Enter}')
    await user.keyboard(' ')
    expect(defaultProps.onToggle).toHaveBeenCalledTimes(2)
  })

  // Tests both presence and click behavior — splitting would reduce diagnostic value
  it('shows claim button when expanded and not claimed', () => {
    render(<SkillNode {...defaultProps} isExpanded={true} />)
    const claimBtn = screen.getByText('This is me')
    expect(claimBtn).toBeInTheDocument()
    fireEvent.click(claimBtn)
    expect(defaultProps.onClaim).toHaveBeenCalledWith('autonomy', 2)
  })

  // Tests both presence and click behavior — splitting would reduce diagnostic value
  it('shows unclaim button for highest claimed node', () => {
    render(
      <SkillNode {...defaultProps} nodeState="claimed" isHighestClaimed={true} isExpanded={true} />,
    )
    const unclaimBtn = screen.getByText('Step back one')
    expect(unclaimBtn).toBeInTheDocument()
    fireEvent.click(unclaimBtn)
    expect(defaultProps.onUnclaim).toHaveBeenCalledWith('autonomy', 2)
  })

  // Lower claimed nodes expose the claim button so users can drop directly to that level
  // (multi-level demote in one click).
  it('shows claim button on lower claimed nodes for direct demotion', () => {
    render(
      <SkillNode
        {...defaultProps}
        nodeState="claimed"
        isHighestClaimed={false}
        isExpanded={true}
      />,
    )
    const claimBtn = screen.getByText('This is me')
    expect(claimBtn).toBeInTheDocument()
    expect(screen.queryByText('Step back one')).not.toBeInTheDocument()
    fireEvent.click(claimBtn)
    expect(defaultProps.onClaim).toHaveBeenCalledWith('autonomy', 2)
  })

  it('hides claim button when readonly', () => {
    render(<SkillNode {...defaultProps} isExpanded={true} readonly />)
    expect(screen.queryByText('This is me')).not.toBeInTheDocument()
  })

  it('hides unclaim button when readonly', () => {
    render(
      <SkillNode
        {...defaultProps}
        nodeState="claimed"
        isHighestClaimed={true}
        isExpanded={true}
        readonly
      />,
    )
    expect(screen.queryByText('Step back one')).not.toBeInTheDocument()
  })

  it('still allows toggling in readonly mode', () => {
    render(<SkillNode {...defaultProps} readonly />)
    fireEvent.click(getSkillNodeButton())
    expect(defaultProps.onToggle).toHaveBeenCalledTimes(1)
  })

  it('has correct aria-expanded attribute', () => {
    const { rerender } = render(<SkillNode {...defaultProps} isExpanded={false} />)
    expect(getSkillNodeButton()).toHaveAttribute('aria-expanded', 'false')

    rerender(<SkillNode {...defaultProps} isExpanded={true} />)
    expect(getSkillNodeButton()).toHaveAttribute('aria-expanded', 'true')
  })
})

// Keyboard and mouse behaviour of the card versus its action button. These use
// user-event because the bug they pin lived in the browser's default action:
// a keydown handler on the card cancelled the button's Enter/Space click.
describe('SkillNode interaction', () => {
  const props = {
    level: mockLevel,
    axisId: 'autonomy' as const,
    color: '#4a7c59',
    nodeState: 'frontier' as const,
    isHighestClaimed: false,
    isExpanded: true,
    onToggle: vi.fn(),
    onClaim: vi.fn(),
    onUnclaim: vi.fn(),
  }

  afterEach(() => {
    vi.clearAllMocks()
  })

  it.each([
    ['Enter', '{Enter}'],
    ['Space', ' '],
  ])('claims with %s on "This is me" without toggling the card', async (_, key) => {
    const user = userEvent.setup()
    render(<SkillNode {...props} />)
    screen.getByRole('button', { name: /^This is me/ }).focus()
    await user.keyboard(key)
    expect(props.onClaim).toHaveBeenCalledWith('autonomy', 2)
    expect(props.onToggle).not.toHaveBeenCalled()
  })

  it('steps back with Enter on "Step back one"', async () => {
    const user = userEvent.setup()
    render(<SkillNode {...props} nodeState="claimed" isHighestClaimed />)
    screen.getByRole('button', { name: /^Step back one/ }).focus()
    await user.keyboard('{Enter}')
    expect(props.onUnclaim).toHaveBeenCalledWith('autonomy', 2)
    expect(props.onToggle).not.toHaveBeenCalled()
  })

  it('names the action button after its level', () => {
    render(<SkillNode {...props} />)
    expect(
      screen.getByRole('button', { name: 'This is me: Review Every Edit' }),
    ).toBeInTheDocument()
  })

  it('keeps focus on the action button when a claim turns it into "Step back one"', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<SkillNode {...props} />)
    screen.getByRole('button', { name: /^This is me/ }).focus()
    await user.keyboard('{Enter}')
    rerender(<SkillNode {...props} nodeState="claimed" isHighestClaimed />)
    expect(screen.getByRole('button', { name: /^Step back one/ })).toHaveFocus()
  })

  it('makes the details inert while the card is collapsed', () => {
    const { container, rerender } = render(<SkillNode {...props} isExpanded={false} />)
    const detail = container.querySelector('[data-detail]')
    expect(detail).toHaveAttribute('inert')
    rerender(<SkillNode {...props} isExpanded />)
    expect(detail).not.toHaveAttribute('inert')
  })

  it('opens a collapsed card from a click on its preview text', () => {
    render(<SkillNode {...props} isExpanded={false} />)
    // The description also sits in the (inert) details; click the preview.
    const previews = screen
      .getAllByText(mockLevel.desc)
      .filter((el) => !el.closest('[data-detail]'))
    expect(previews).toHaveLength(1)
    fireEvent.click(previews[0])
    expect(props.onToggle).toHaveBeenCalledTimes(1)
  })

  it('keeps the card itself out of the tab order', () => {
    const { container } = render(<SkillNode {...props} />)
    expect(container.querySelector('[data-skill-name]')).toHaveAttribute('tabindex', '-1')
  })

  it('toggles once from a click on the header of a collapsed card', () => {
    render(<SkillNode {...props} isExpanded={false} />)
    fireEvent.click(getSkillNodeButton())
    expect(props.onToggle).toHaveBeenCalledTimes(1)
  })

  it('does not collapse an open card when its details are clicked', () => {
    render(<SkillNode {...props} />)
    fireEvent.click(screen.getByText('Human reviews every diff.'))
    expect(props.onToggle).not.toHaveBeenCalled()
  })
})
