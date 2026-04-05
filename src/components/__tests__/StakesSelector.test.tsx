import { render, screen, fireEvent } from '@testing-library/react'
import StakesSelector from '../StakesSelector'

describe('StakesSelector', () => {
  const defaultProps = {
    selected: 'sandbox' as const,
    onSelect: vi.fn(),
  }

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders all four zone buttons', () => {
    render(<StakesSelector {...defaultProps} />)
    expect(screen.getByText('Sandbox')).toBeInTheDocument()
    expect(screen.getByText('Normal')).toBeInTheDocument()
    expect(screen.getByText('Hardcore')).toBeInTheDocument()
    expect(screen.getByText('Impossible')).toBeInTheDocument()
  })

  it('marks the selected zone as aria-checked', () => {
    render(<StakesSelector {...defaultProps} />)
    expect(screen.getByText('Sandbox').closest('[role="radio"]')).toHaveAttribute(
      'aria-checked',
      'true',
    )
    expect(screen.getByText('Normal').closest('[role="radio"]')).toHaveAttribute(
      'aria-checked',
      'false',
    )
  })

  it('calls onSelect when a zone is clicked', () => {
    render(<StakesSelector {...defaultProps} />)
    fireEvent.click(screen.getByText('Hardcore'))
    expect(defaultProps.onSelect).toHaveBeenCalledWith('hardcore')
  })

  it('shows the description for the selected zone', () => {
    render(<StakesSelector {...defaultProps} />)
    expect(screen.getByText(/Mistake shows incorrect information/)).toBeInTheDocument()
  })

  it('updates description when selection changes', () => {
    const { rerender } = render(<StakesSelector {...defaultProps} />)
    rerender(<StakesSelector {...defaultProps} selected="hardcore" />)
    expect(screen.getByText(/Mistake stops client services too/)).toBeInTheDocument()
  })
})
