import { renderHook, waitFor } from '@testing-library/react'
import type { User } from 'firebase/auth'
import { useSyncState } from '../useSyncState'
import { syncOnLogin, writeAssessment } from '../../data/sync'
import { DEFAULT_STATE } from '../../data/state'

const USER = { uid: 'u1', displayName: 'Test' } as User

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: USER, loading: false }),
}))
vi.mock('../../data/sync', () => ({
  syncOnLogin: vi.fn(),
  writeAssessment: vi.fn(),
}))

// Stable, like the setState the real page passes.
const setFullState = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('useSyncState', () => {
  it('keeps writes blocked after the sign-in sync fails', async () => {
    vi.mocked(syncOnLogin).mockRejectedValue(new Error('offline'))
    const { result, rerender } = renderHook(({ state }) => useSyncState(state, setFullState), {
      initialProps: { state: DEFAULT_STATE },
    })
    await waitFor(() => expect(result.current.syncStatus).toBe('error'))

    rerender({ state: { ...DEFAULT_STATE, autonomy: 3 } })

    expect(writeAssessment).not.toHaveBeenCalled()
    expect(result.current.syncStatus).toBe('error')
  })

  it('writes changes once the sign-in sync succeeds', async () => {
    vi.mocked(syncOnLogin).mockResolvedValue(DEFAULT_STATE)
    vi.mocked(writeAssessment).mockResolvedValue(undefined)
    const { result, rerender } = renderHook(({ state }) => useSyncState(state, setFullState), {
      initialProps: { state: DEFAULT_STATE },
    })
    await waitFor(() => expect(result.current.syncStatus).toBe('idle'))

    // The first state change after a sync is the synced state itself, not a write.
    rerender({ state: { ...DEFAULT_STATE, autonomy: 2 } })
    rerender({ state: { ...DEFAULT_STATE, autonomy: 3 } })

    await waitFor(() => expect(writeAssessment).toHaveBeenCalledTimes(1))
  })
})
