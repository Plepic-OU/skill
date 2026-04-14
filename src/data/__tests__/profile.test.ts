// Mock firebase modules before importing profile
const MOCK_DB = vi.hoisted(() => ({ __mock: 'firestore' }))

vi.mock('firebase/firestore', () => ({
  doc: vi.fn((_db: unknown, collection: string, id: string) => ({
    path: `${collection}/${id}`,
  })),
  getDoc: vi.fn(),
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

import { doc, getDoc } from 'firebase/firestore'
import { readPublicProfile } from '../profile'

const mockDoc = vi.mocked(doc)
const mockGetDoc = vi.mocked(getDoc)

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
})

describe('readPublicProfile', () => {
  it("reads from the user's document path", async () => {
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
