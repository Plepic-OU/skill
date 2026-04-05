import {
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import { auth } from '../firebase'

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider()
  return signInWithPopup(auth, provider)
}

export async function signInWithGitHub() {
  const provider = new GithubAuthProvider()
  return signInWithPopup(auth, provider)
}

export async function signOut() {
  return firebaseSignOut(auth)
}
