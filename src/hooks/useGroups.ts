import { useEffect } from 'react'
import { subscribeToGroups } from '../services/groups'
import { useStore } from '../store'

export function useGroups() {
  const { groups, setGroups } = useStore()

  useEffect(() => {
    const unsub = subscribeToGroups(setGroups)
    return unsub
  }, [setGroups])

  return { groups: groups.filter((g) => g.visible) }
}
