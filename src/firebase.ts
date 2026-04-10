import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'

const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
] as const

const missing = requiredEnvVars.filter((key) => !import.meta.env[key])
if (missing.length > 0) {
  throw new Error(
    `Missing required Firebase environment variables: ${missing.join(', ')}. ` +
      'Add them to your .env file (see .env.example).',
  )
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)

const __emulatorsConnected = '__firebase_emulators_connected'

if (import.meta.env.DEV && !(globalThis as Record<string, unknown>)[__emulatorsConnected]) {
  ;(globalThis as Record<string, unknown>)[__emulatorsConnected] = true
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)

  // Expose for E2E tests
  import('firebase/auth')
    .then(({ signInWithEmailAndPassword }) => {
      Object.assign(window, {
        __e2e_auth: auth,
        __e2e_signInWithEmailAndPassword: signInWithEmailAndPassword,
      })
    })
    .catch(console.error)
}
