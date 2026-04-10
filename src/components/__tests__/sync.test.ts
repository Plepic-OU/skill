import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock firebase modules before importing sync
const MOCK_DB = { __mock: 'firestore' }

vi.mock('firebase/firestore', () => {
  const db = { __mock: 'firestore' }
  return {
    doc: vi.fn((_db, collection, id) => ({ path: `${collection}/${id}` })),
    getDoc: vi.fn(),
    setDoc: vi.fn(),
    serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
    getFirestore: vi.fn(() => db),
    connectFirestoreEmulator: vi.fn(),
  }
})

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  connectAuthEmulator: vi.fn(),
  onAuthStateChanged: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
}))

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
}))

import { doc, getDoc, setDoc } from 'firebase/firestore'
import { readPublicProfile, syncOnLogin, writeAssessment } from '../../data/sync'
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

  it('uses the users collection', async () => {
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

  it('uses the users collection', async () => {
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

describe('readPublicProfile', () => {
  it('uses the users collection', async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false } as never)

    await readPublicProfile('uid-read')

    expect(mockDoc).toHaveBeenCalledWith(MOCK_DB, 'users', 'uid-read')
  })

  it('returns null when document does not exist', async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false } as never)

    const result = await readPublicProfile('nonexistent-uid')
    expect(result).toBeNull()
  })

  it('returns profile with correct field mapping', async () => {
    mockGetDoc.mockResolvedValue(
      firestoreSnap({
        skills: { autonomy: 4, parallelExecution: 3, skillUsage: 2 },
        safetyZone: 'hardcore',
        displayName: 'Alice',
        avatarUrl: 'https://example.com/alice.jpg',
      }),
    )

    const result = await readPublicProfile('alice-uid')
    expect(result).toEqual({
      autonomy: 4,
      parallelExecution: 3,
      skillUsage: 2,
      safetyZone: 'hardcore',
      displayName: 'Alice',
      avatarUrl: 'https://example.com/alice.jpg',
    })
  })

  it('falls back to Anonymous when displayName is missing', async () => {
    mockGetDoc.mockResolvedValue(firestoreSnap())

    const result = await readPublicProfile('uid')
    expect(result?.displayName).toBe('Anonymous')
    expect(result?.avatarUrl).toBe('')
  })

  it('rejects non-HTTPS avatar URLs', async () => {
    mockGetDoc.mockResolvedValue(
      firestoreSnap({ displayName: 'Eve', avatarUrl: 'javascript:alert(1)' }),
    )

    const result = await readPublicProfile('uid')
    expect(result?.avatarUrl).toBe('')
  })

  it('rejects malformed avatar URLs', async () => {
    mockGetDoc.mockResolvedValue(
      firestoreSnap({ displayName: 'Mallory', avatarUrl: 'not-a-url-at-all' }),
    )

    const result = await readPublicProfile('uid')
    expect(result?.avatarUrl).toBe('')
  })

  it('propagates getDoc errors', async () => {
    mockGetDoc.mockRejectedValue(new Error('Firestore unavailable'))

    await expect(readPublicProfile('uid-123')).rejects.toThrow('Firestore unavailable')
  })

  it('accepts HTTP avatar URLs', async () => {
    mockGetDoc.mockResolvedValue(
      firestoreSnap({ displayName: 'Bob', avatarUrl: 'http://example.com/bob.jpg' }),
    )

    const result = await readPublicProfile('uid')
    expect(result?.avatarUrl).toBe('http://example.com/bob.jpg')
  })
})
