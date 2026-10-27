import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import Header from '../Header'
import type { SyncStatus } from '../../types/skill-tree'

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'u1' }, loading: false }),
}))

function renderOwner(syncStatus: SyncStatus) {
  return (
    <MemoryRouter>
      <Header mode="owner" syncStatus={syncStatus} />
    </MemoryRouter>
  )
}

describe('Header sync status', () => {
  it('keeps one live region mounted while the status changes', () => {
    const { rerender } = render(renderOwner('idle'))
    const region = screen.getByRole('status')
    expect(region).toBeEmptyDOMElement()

    rerender(renderOwner('syncing'))
    expect(screen.getByRole('status')).toBe(region)
    expect(region).toHaveTextContent('Saving...')

    rerender(renderOwner('saved'))
    expect(screen.getByRole('status')).toBe(region)
    expect(region).toHaveTextContent('Saved')
  })
})
