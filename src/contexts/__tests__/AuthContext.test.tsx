import { act, render } from '@testing-library/react'
import type { User } from 'firebase/auth'
import { AuthProvider } from '../AuthContext'
import { DEFAULT_STATE, loadState, saveState } from '../../data/state'

const authListener = vi.hoisted(() => ({
  emit: undefined as unknown as (user: unknown) => void,
}))

vi.mock('../../firebase', () => ({ auth: {} }))
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (_auth: unknown, cb: (user: unknown) => void) => {
    authListener.emit = cb
    return () => {}
  },
}))

const PROGRESS = { ...DEFAULT_STATE, autonomy: 4, safetyZone: 'hardcore' as const }

beforeEach(() => {
  localStorage.clear()
  saveState(PROGRESS)
  render(<AuthProvider>{null}</AuthProvider>)
})

describe('AuthProvider', () => {
  it('clears the previous user levels from localStorage on sign-out', () => {
    act(() => authListener.emit({ uid: 'u1' } as User))
    act(() => authListener.emit(null))

    expect(loadState()).toEqual(DEFAULT_STATE)
  })

  it('keeps progress made without an account', () => {
    act(() => authListener.emit(null))

    expect(loadState()).toEqual(PROGRESS)
  })
})
