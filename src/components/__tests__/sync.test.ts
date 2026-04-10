// Mock firebase modules before importing sync
const MOCK_DB = vi.hoisted(() => ({ __mock: 'firestore' }))

vi.mock('firebase/firestore', () => ({
  doc: vi.fn((_db: unknown, collection: string, id: string) => ({
    path: `${collection}/${id}`,
  })),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
  getFirestore: vi.fn(() => MOCK_DB),
  connectFirestoreEmulator: vi.fn(),
}))

// Only exports used by firebase.ts at module load time — none are asserted in tests
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  connectAuthEmulator: vi.fn(),
}))

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
}))

import { doc, getDoc, setDoc } from 'firebase/firestore'
import { syncOnLogin, writeAssessment } from '../../data/sync'
import { DEFAULT_STATE } from '../../data/state'
import { mockUser } from './helpers'

const mockDoc = vi.mocked(doc)
const mockGetDoc = vi.mocked(getDoc)
const mockSetDoc = vi.mocked(setDoc)

function firestoreSnap(overrides: Record<string, unknown> = {}) {
  const defaults = {
    skills: { autonomy: 1, parallelExecution: 1, skillUsage: 1 },
    safetyZone: 'sandbox',
  }
  return {
    exists: () => true,
    data: () => ({ ...defaults, ...overrides }),
  } as never
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
})

describe('syncOnLogin', () => {
  it('returns Firestore data when document exists', async () => {
    mockGetDoc.mockResolvedValue(
      firestoreSnap({
        skills: { autonomy: 3, parallelExecution: 2, skillUsage: 4 },
        safetyZone: 'hardcore',
        displayName: 'Test User',
        avatarUrl: '',
      }),
    )
    mockSetDoc.mockResolvedValue(undefined)

    const result = await syncOnLogin(mockUser())

    expect(result).toEqual({
      autonomy: 3,
      parallelExecution: 2,
      skillUsage: 4,
      safetyZone: 'hardcore',
    })
  })

  it('updates profile info on existing document', async () => {
    mockGetDoc.mockResolvedValue(firestoreSnap())
    mockSetDoc.mockResolvedValue(undefined)

    await syncOnLogin(mockUser({ displayName: 'New Name' }))

    expect(mockSetDoc).toHaveBeenCalledWith(
      expect.anything(),
      { displayName: 'New Name', avatarUrl: 'https://example.com/photo.jpg' },
      { merge: true },
    )
  })

  it('pushes localStorage state when no Firestore data', async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false } as never)
    mockSetDoc.mockResolvedValue(undefined)

    const result = await syncOnLogin(mockUser())

    expect(result).toEqual(DEFAULT_STATE)
    expect(mockSetDoc).toHaveBeenCalled()
  })

  it("reads from the user's document path", async () => {
    mockGetDoc.mockResolvedValue(firestoreSnap())
    mockSetDoc.mockResolvedValue(undefined)

    await syncOnLogin(mockUser({ uid: 'uid-abc' }))

    // syncOnLogin calls doc() for both getDoc and setDoc
    expect(mockDoc).toHaveBeenCalledWith(MOCK_DB, 'users', 'uid-abc')
    // Verify the ref path contains the collection name
    const ref = mockDoc.mock.results[0].value as { path: string }
    expect(ref.path).toBe('users/uid-abc')
  })

  it('falls back to Anonymous when displayName is null', async () => {
    mockGetDoc.mockResolvedValue(firestoreSnap())
    mockSetDoc.mockResolvedValue(undefined)

    await syncOnLogin(mockUser({ displayName: null }))

    expect(mockSetDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ displayName: 'Anonymous' }),
      { merge: true },
    )
  })

  it('falls back to empty string when photoURL is null', async () => {
    mockGetDoc.mockResolvedValue(firestoreSnap())
    mockSetDoc.mockResolvedValue(undefined)

    await syncOnLogin(mockUser({ photoURL: null }))

    expect(mockSetDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ avatarUrl: '' }),
      { merge: true },
    )
  })

  it('propagates errors from getDoc', async () => {
    mockGetDoc.mockRejectedValue(new Error('Network error'))

    await expect(syncOnLogin(mockUser())).rejects.toThrow('Network error')
  })

  it('propagates setDoc errors when updating profile', async () => {
    mockGetDoc.mockResolvedValue(firestoreSnap())
    mockSetDoc.mockRejectedValue(new Error('Write failed'))

    await expect(syncOnLogin(mockUser())).rejects.toThrow('Write failed')
  })

  it('propagates setDoc errors when creating new document', async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false } as never)
    mockSetDoc.mockRejectedValue(new Error('Quota exceeded'))

    await expect(syncOnLogin(mockUser())).rejects.toThrow('Quota exceeded')
  })
})

describe('writeAssessment', () => {
  it('writes correct shape with user profile', async () => {
    mockSetDoc.mockResolvedValue(undefined)

    await writeAssessment(
      'uid-123',
      { autonomy: 2, parallelExecution: 3, skillUsage: 1, safetyZone: 'normal' },
      mockUser({ uid: 'uid-123' }),
    )

    expect(mockSetDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        updatedAt: 'SERVER_TIMESTAMP',
        safetyZone: 'normal',
        skills: { autonomy: 2, parallelExecution: 3, skillUsage: 1 },
        displayName: 'Test User',
        avatarUrl: 'https://example.com/photo.jpg',
      }),
      { merge: true },
    )
  })

  it('omits profile fields when no user provided', async () => {
    mockSetDoc.mockResolvedValue(undefined)

    await writeAssessment('uid-123', {
      autonomy: 1,
      parallelExecution: 1,
      skillUsage: 1,
      safetyZone: 'sandbox',
    })

    const written = mockSetDoc.mock.calls[0][1] as Record<string, unknown>
    expect(written).not.toHaveProperty('displayName')
    expect(written).not.toHaveProperty('avatarUrl')
  })

  it("writes to the user's document path", async () => {
    mockSetDoc.mockResolvedValue(undefined)

    await writeAssessment('uid-xyz', DEFAULT_STATE)

    expect(mockDoc).toHaveBeenCalledWith(MOCK_DB, 'users', 'uid-xyz')
  })

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

  it('falls back to Anonymous when user displayName is null', async () => {
    mockSetDoc.mockResolvedValue(undefined)

    await writeAssessment('uid-123', DEFAULT_STATE, mockUser({ displayName: null }))

    const written = mockSetDoc.mock.calls[0][1] as Record<string, unknown>
    expect(written.displayName).toBe('Anonymous')
  })

  it('falls back to empty string when user photoURL is null', async () => {
    mockSetDoc.mockResolvedValue(undefined)

    await writeAssessment('uid-123', DEFAULT_STATE, mockUser({ photoURL: null }))

    const written = mockSetDoc.mock.calls[0][1] as Record<string, unknown>
    expect(written.avatarUrl).toBe('')
  })
})
