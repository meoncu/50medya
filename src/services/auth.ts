import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from './firebase'
import type { User } from '../types'

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'meoncu@gmail.com'

export async function signInWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider()
  const result = await signInWithPopup(auth, provider)
  const { user } = result

  const isAdmin = user.email === ADMIN_EMAIL

  const userData: User = {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || '',
    photoURL: user.photoURL || '',
    isAdmin,
  }

  await setDoc(doc(db, 'users', user.uid), userData, { merge: true })
  return userData
}

export async function signOutUser(): Promise<void> {
  await signOut(auth)
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    try {
      if (!firebaseUser) {
        callback(null)
        return
      }
      const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
      if (snap.exists()) {
        callback(snap.data() as User)
      } else {
        const isAdmin = firebaseUser.email === ADMIN_EMAIL
        callback({
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || '',
          photoURL: firebaseUser.photoURL || '',
          isAdmin,
        })
      }
    } catch (error) {
      console.error('Error in onAuthChange:', error)
      callback(null)
    }
  })
}
