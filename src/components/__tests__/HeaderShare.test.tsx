import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import Header from '../Header'
import Toast from '../Toast'
import type { SkillState } from '../../types/skill-tree'

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: null, loading: false }),
}))

const STATE: SkillState = { autonomy: 2, parallelExecution: 1, skillUsage: 3, safetyZone: 'normal' }

describe('landing Share', () => {
  it('copies a levels-only result link instead of asking to sign in', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } })
    render(
      <MemoryRouter>
        <Header mode="landing" state={STATE} />
        <Toast />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Copy result link' }))

    await waitFor(() => expect(screen.getByText('Link copied!')).toBeInTheDocument())
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/shared/2-1-3-normal`)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    vi.unstubAllGlobals()
  })
})
