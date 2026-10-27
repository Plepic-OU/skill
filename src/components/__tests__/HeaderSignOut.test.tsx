import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import Header from '../Header'
import type { SyncStatus } from '../../types/skill-tree'

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'u1', displayName: 'Test' }, loading: false }),
}))

// jsdom has no showModal; the closed dialog's message is still in the DOM.
function renderHeader(syncStatus: SyncStatus) {
  render(
    <MemoryRouter>
      <Header mode="owner" syncStatus={syncStatus} />
    </MemoryRouter>,
  )
}

describe('sign-out dialog', () => {
  it('says the progress is saved when nothing failed', () => {
    renderHeader('idle')

    expect(screen.getByText(/Your progress is saved/)).toBeInTheDocument()
  })

  it('says the latest change was not saved after a failed save', () => {
    renderHeader('error')

    expect(screen.getByText(/latest change was not saved/i)).toBeInTheDocument()
    expect(screen.queryByText(/Your progress is saved/)).not.toBeInTheDocument()
  })
})
