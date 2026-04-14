import type { User } from 'firebase/auth'

export function mockUser(overrides: Partial<User> = {}): User {
  return {
    uid: 'test-uid',
    displayName: 'Test User',
    photoURL: 'https://example.com/photo.jpg',
    ...overrides,
  } as User
}
