import { render, screen, fireEvent } from '@testing-library/react'
import SkillNode from '../SkillNode'
import type { Level } from '../../types/skill-tree'

// Mock CelebrationEffect to avoid imperative DOM in jsdom
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

function getNode() {
  return screen.getByLabelText(/Level 2: Review Every Edit/)
}

describe('SkillNode', () => {
  const defaultProps = {
    level: mockLevel,
    axisId: 'autonomy' as const,
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
    expect(getNode()).toHaveAttribute('aria-label', 'Level 2: Review Every Edit — up next')
  })

  it('shows "You are here" for highest claimed', () => {
    render(
      <SkillNode {...defaultProps} nodeState="claimed" isHighestClaimed={true} isExpanded={true} />,
    )
    expect(screen.getByText('You are here')).toBeInTheDocument()
  })

  it('calls onToggle when clicked', () => {
    render(<SkillNode {...defaultProps} />)
    fireEvent.click(getNode())
    expect(defaultProps.onToggle).toHaveBeenCalledTimes(1)
  })

  it('calls onToggle on Enter key', () => {
    render(<SkillNode {...defaultProps} />)
    fireEvent.keyDown(getNode(), { key: 'Enter' })
    expect(defaultProps.onToggle).toHaveBeenCalledTimes(1)
  })

  it('calls onToggle on Space key', () => {
    render(<SkillNode {...defaultProps} />)
    fireEvent.keyDown(getNode(), { key: ' ' })
    expect(defaultProps.onToggle).toHaveBeenCalledTimes(1)
  })

  it('shows claim button when expanded and not claimed', () => {
    render(<SkillNode {...defaultProps} isExpanded={true} />)
    const claimBtn = screen.getByText('This is me')
    expect(claimBtn).toBeInTheDocument()
    fireEvent.click(claimBtn)
    expect(defaultProps.onClaim).toHaveBeenCalledWith('autonomy', 2)
  })

  it('shows unclaim button for highest claimed node', () => {
    render(
      <SkillNode {...defaultProps} nodeState="claimed" isHighestClaimed={true} isExpanded={true} />,
    )
    const unclaimBtn = screen.getByText('Not here yet')
    expect(unclaimBtn).toBeInTheDocument()
    fireEvent.click(unclaimBtn)
    expect(defaultProps.onUnclaim).toHaveBeenCalledWith('autonomy', 2)
  })

  it('does not show action button for lower claimed nodes', () => {
    render(
      <SkillNode
        {...defaultProps}
        nodeState="claimed"
        isHighestClaimed={false}
        isExpanded={true}
      />,
    )
    expect(screen.queryByText('This is me')).not.toBeInTheDocument()
    expect(screen.queryByText('Not here yet')).not.toBeInTheDocument()
  })

  it('has correct aria-expanded attribute', () => {
    const { rerender } = render(<SkillNode {...defaultProps} isExpanded={false} />)
    expect(getNode()).toHaveAttribute('aria-expanded', 'false')

    rerender(<SkillNode {...defaultProps} isExpanded={true} />)
    expect(getNode()).toHaveAttribute('aria-expanded', 'true')
  })
})
