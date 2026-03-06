import { useEffect } from 'react'
import { onAuthChange } from '../services/auth'
import { useStore } from '../store'

export function useAuth() {
  const { user, setUser } = useStore()

  useEffect(() => {
    const unsub = onAuthChange(setUser)
    return unsub
  }, [setUser])

  return { user, isAdmin: user?.isAdmin ?? false }
}
