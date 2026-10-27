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

  it('shows a non-empty description for the selected zone', () => {
    render(<StakesSelector {...defaultProps} />)
    // The sandbox zone should display its description text
    const radios = screen.getAllByRole('radio')
    const selectedRadio = radios.find((r) => r.getAttribute('aria-checked') === 'true')
    expect(selectedRadio).toBeDefined()
    // Description text appears outside the radiogroup — verify some text is visible
    const radiogroup = screen.getByRole('radiogroup')
    const descriptionSibling = radiogroup.nextElementSibling
    expect(descriptionSibling).not.toBeNull()
    expect(descriptionSibling?.textContent?.length).toBeGreaterThan(0)
  })

  it('updates description when selection changes', () => {
    const { rerender } = render(<StakesSelector {...defaultProps} />)
    const radiogroup = screen.getByRole('radiogroup')
    const initialDesc = radiogroup.nextElementSibling?.textContent

    rerender(<StakesSelector {...defaultProps} selected="hardcore" />)

    const updatedDesc = radiogroup.nextElementSibling?.textContent
    expect(updatedDesc?.length).toBeGreaterThan(0)
    expect(updatedDesc).not.toBe(initialDesc)
  })

  it('puts only the selected zone in the tab order', () => {
    render(<StakesSelector {...defaultProps} selected="normal" />)
    const tabindexes = screen.getAllByRole('radio').map((r) => r.getAttribute('tabindex'))
    expect(tabindexes).toEqual(['-1', '0', '-1', '-1'])
  })

  it.each([
    ['ArrowRight', 'sandbox', 'normal'],
    ['ArrowDown', 'sandbox', 'normal'],
    ['ArrowLeft', 'normal', 'sandbox'],
    ['ArrowUp', 'normal', 'sandbox'],
    ['ArrowRight', 'impossible', 'sandbox'],
    ['ArrowLeft', 'sandbox', 'impossible'],
  ])('%s from %s selects %s and moves focus there', (key, from, to) => {
    render(<StakesSelector {...defaultProps} selected={from as 'sandbox'} />)
    const radio = (zone: string) => screen.getByRole('radio', { name: new RegExp(`^${zone}`, 'i') })
    fireEvent.keyDown(radio(from), { key })
    expect(defaultProps.onSelect).toHaveBeenCalledWith(to)
    expect(document.activeElement).toBe(radio(to))
  })
})
