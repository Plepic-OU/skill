import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, initializeFirestore, connectFirestoreEmulator } from 'firebase/firestore'

// --- Env-var validation ---

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

// --- Firebase init ---

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

// --- Preview / emulator wiring ---

const emulatorHost = import.meta.env.VITE_EMULATOR_HOST as string | undefined

// Firestore: preview mode uses initializeFirestore with ssl:true (Cloud Run terminates TLS,
// nginx proxies to emulator over HTTP — avoids mixed-content block from connectFirestoreEmulator)
export const db = emulatorHost
  ? initializeFirestore(app, { host: emulatorHost, ssl: true })
  : getFirestore(app)

// Preview: connect Auth emulator via HTTPS (same-origin proxy on Cloud Run)
if (emulatorHost) {
  connectAuthEmulator(auth, `https://${emulatorHost}`, { disableWarnings: true })
}

// --- Local dev emulator wiring + E2E test bridge ---

const EMULATORS_CONNECTED_KEY = '__firebase_emulators_connected'

function shouldConnectEmulators(): boolean {
  return (
    import.meta.env.DEV &&
    !emulatorHost &&
    !(globalThis as Record<string, unknown>)[EMULATORS_CONNECTED_KEY]
  )
}

if (shouldConnectEmulators()) {
  ;(globalThis as Record<string, unknown>)[EMULATORS_CONNECTED_KEY] = true
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)

  // Expose auth helpers for E2E tests (dynamic import avoids test mock conflicts)
  if (typeof window !== 'undefined') {
    import('firebase/auth')
      .then(({ signInWithEmailAndPassword }) => {
        Object.assign(window, {
          __e2e_auth: auth,
          __e2e_signInWithEmailAndPassword: signInWithEmailAndPassword,
        })
      })
      .catch(() => {})
  }
}
