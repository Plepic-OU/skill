import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('firebase/firestore', () => ({
  doc: vi.fn((_db, collection, id) => ({ path: `${collection}/${id}` })),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
  getFirestore: vi.fn(),
  connectFirestoreEmulator: vi.fn(),
}))

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  connectAuthEmulator: vi.fn(),
  onAuthStateChanged: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
}))

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
}))

import { getDoc, setDoc } from 'firebase/firestore'
import type { User } from 'firebase/auth'
import { readPublicProfile, syncOnLogin, writeAssessment } from '../../data/sync'

const mockGetDoc = vi.mocked(getDoc)
const mockSetDoc = vi.mocked(setDoc)

function mockUser(overrides: Partial<User> = {}): User {
  return {
    uid: 'test-uid',
    displayName: 'Test User',
    photoURL: 'https://example.com/photo.jpg',
    ...overrides,
  } as User
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
})

describe('writeAssessment error propagation', () => {
  it('propagates setDoc errors', async () => {
    mockSetDoc.mockRejectedValue(new Error('Permission denied'))

    await expect(
      writeAssessment('uid-123', {
        autonomy: 1,
        parallelExecution: 1,
        skillUsage: 1,
        safetyZone: 'sandbox',
      }),
    ).rejects.toThrow('Permission denied')
  })
})

describe('readPublicProfile error propagation', () => {
  it('propagates getDoc errors', async () => {
    mockGetDoc.mockRejectedValue(new Error('Firestore unavailable'))

    await expect(readPublicProfile('uid-123')).rejects.toThrow('Firestore unavailable')
  })
})

describe('syncOnLogin error propagation', () => {
  it('propagates setDoc errors when updating profile', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        skills: { autonomy: 1, parallelExecution: 1, skillUsage: 1 },
        safetyZone: 'sandbox',
      }),
    } as never)
    mockSetDoc.mockRejectedValue(new Error('Write failed'))

    await expect(syncOnLogin(mockUser())).rejects.toThrow('Write failed')
  })

  it('propagates setDoc errors when creating new document', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => false,
    } as never)
    mockSetDoc.mockRejectedValue(new Error('Quota exceeded'))

    await expect(syncOnLogin(mockUser())).rejects.toThrow('Quota exceeded')
  })
})
