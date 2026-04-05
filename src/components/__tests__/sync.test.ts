import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock firebase modules before importing sync
vi.mock('firebase/firestore', () => ({
  doc: vi.fn((_db, _collection, id) => ({ path: `users/${id}` })),
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
import { DEFAULT_STATE } from '../../data/state'

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

describe('syncOnLogin', () => {
  it('returns Firestore data when document exists', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        skills: { autonomy: 3, parallelExecution: 2, skillUsage: 4 },
        safetyZone: 'hardcore',
        displayName: 'Test User',
        avatarUrl: '',
      }),
    } as never)
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
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        skills: { autonomy: 1, parallelExecution: 1, skillUsage: 1 },
        safetyZone: 'sandbox',
      }),
    } as never)
    mockSetDoc.mockResolvedValue(undefined)

    await syncOnLogin(mockUser({ displayName: 'New Name' }))

    expect(mockSetDoc).toHaveBeenCalledWith(
      expect.anything(),
      { displayName: 'New Name', avatarUrl: 'https://example.com/photo.jpg' },
      { merge: true },
    )
  })

  it('pushes localStorage state when no Firestore data', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => false,
    } as never)
    mockSetDoc.mockResolvedValue(undefined)

    const result = await syncOnLogin(mockUser())

    expect(result).toEqual(DEFAULT_STATE)
    expect(mockSetDoc).toHaveBeenCalled()
  })

  it('propagates errors from getDoc', async () => {
    mockGetDoc.mockRejectedValue(new Error('Network error'))

    await expect(syncOnLogin(mockUser())).rejects.toThrow('Network error')
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
})

describe('readPublicProfile', () => {
  it('returns null when document does not exist', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => false,
    } as never)

    const result = await readPublicProfile('nonexistent-uid')
    expect(result).toBeNull()
  })

  it('returns profile with correct field mapping', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        skills: { autonomy: 4, parallelExecution: 3, skillUsage: 2 },
        safetyZone: 'hardcore',
        displayName: 'Alice',
        avatarUrl: 'https://example.com/alice.jpg',
      }),
    } as never)

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
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        skills: { autonomy: 1, parallelExecution: 1, skillUsage: 1 },
        safetyZone: 'sandbox',
      }),
    } as never)

    const result = await readPublicProfile('uid')
    expect(result?.displayName).toBe('Anonymous')
    expect(result?.avatarUrl).toBe('')
  })

  it('rejects non-HTTPS avatar URLs', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        skills: { autonomy: 1, parallelExecution: 1, skillUsage: 1 },
        safetyZone: 'sandbox',
        displayName: 'Eve',
        avatarUrl: 'javascript:alert(1)',
      }),
    } as never)

    const result = await readPublicProfile('uid')
    expect(result?.avatarUrl).toBe('')
  })

  it('accepts HTTP avatar URLs', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        skills: { autonomy: 1, parallelExecution: 1, skillUsage: 1 },
        safetyZone: 'sandbox',
        displayName: 'Bob',
        avatarUrl: 'http://example.com/bob.jpg',
      }),
    } as never)

    const result = await readPublicProfile('uid')
    expect(result?.avatarUrl).toBe('http://example.com/bob.jpg')
  })
})
