import { render, screen, fireEvent } from '@testing-library/react'
import SafetyZoneSelector from '../SafetyZoneSelector'

describe('SafetyZoneSelector', () => {
  const defaultProps = {
    selected: 'safe-zone' as const,
    onSelect: vi.fn(),
  }

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders all four zone buttons', () => {
    render(<SafetyZoneSelector {...defaultProps} />)
    expect(screen.getByText('Safe-zone')).toBeInTheDocument()
    expect(screen.getByText('Normal')).toBeInTheDocument()
    expect(screen.getByText('Hardcore')).toBeInTheDocument()
    expect(screen.getByText('Impossible')).toBeInTheDocument()
  })

  it('marks the selected zone as aria-checked', () => {
    render(<SafetyZoneSelector {...defaultProps} />)
    expect(screen.getByText('Safe-zone').closest('[role="radio"]')).toHaveAttribute(
      'aria-checked',
      'true',
    )
    expect(screen.getByText('Normal').closest('[role="radio"]')).toHaveAttribute(
      'aria-checked',
      'false',
    )
  })

  it('calls onSelect when a zone is clicked', () => {
    render(<SafetyZoneSelector {...defaultProps} />)
    fireEvent.click(screen.getByText('Hardcore'))
    expect(defaultProps.onSelect).toHaveBeenCalledWith('hardcore')
  })

  it('shows the description for the selected zone', () => {
    render(<SafetyZoneSelector {...defaultProps} />)
    expect(screen.getByText(/Mistake shows incorrect information/)).toBeInTheDocument()
  })

  it('updates description when selection changes', () => {
    const { rerender } = render(<SafetyZoneSelector {...defaultProps} />)
    rerender(<SafetyZoneSelector {...defaultProps} selected="hardcore" />)
    expect(screen.getByText(/Mistake stops client services too/)).toBeInTheDocument()
  })
})
