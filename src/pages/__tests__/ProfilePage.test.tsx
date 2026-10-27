import { act, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import type { User } from 'firebase/auth'
import ProfilePage from '../ProfilePage'
import { syncOnLogin } from '../../data/sync'
import { DEFAULT_STATE } from '../../data/state'

const USER = { uid: 'u1', displayName: 'Test' } as User

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: USER, loading: false }),
}))
vi.mock('../../data/sync', () => ({
  syncOnLogin: vi.fn(),
  writeAssessment: vi.fn(),
}))

describe('owner profile during the sign-in sync', () => {
  it('disables claiming until the saved profile has loaded', async () => {
    let finishSync: (state: typeof DEFAULT_STATE) => void = () => {}
    vi.mocked(syncOnLogin).mockReturnValue(new Promise((resolve) => (finishSync = resolve)))
    render(
      <MemoryRouter initialEntries={['/profile/u1']}>
        <Routes>
          <Route path="/profile/:userId" element={<ProfilePage />} />
        </Routes>
      </MemoryRouter>,
    )

    const claimButtons = screen.getAllByRole('button', { name: /^This is me/ })
    expect(claimButtons.length).toBeGreaterThan(0)
    for (const button of claimButtons) expect(button).toBeDisabled()
    for (const radio of screen.getAllByRole('radio')) expect(radio).toBeDisabled()

    await act(async () => finishSync(DEFAULT_STATE))

    for (const button of screen.getAllByRole('button', { name: /^This is me/ })) {
      expect(button).toBeEnabled()
    }
  })
})
