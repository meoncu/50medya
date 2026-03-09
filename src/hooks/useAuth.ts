import { useEffect } from 'react'
import { onAuthChange } from '../services/auth'
import { useStore } from '../store'

export function useAuth() {
  const { user, setUser, setAuthLoading } = useStore()

  useEffect(() => {
    const unsub = onAuthChange((u) => {
      setUser(u)
      setAuthLoading(false)
    })
    return unsub
  }, [setUser, setAuthLoading])

  return { user, isAdmin: user?.isAdmin ?? false }
}
