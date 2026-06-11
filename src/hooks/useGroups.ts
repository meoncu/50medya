import { useEffect } from 'react'
import { subscribeToGroups } from '../services/groups'
import { useStore } from '../store'

export function useGroups() {
  const { groups, setGroups } = useStore()

  useEffect(() => {
    const unsub = subscribeToGroups(setGroups)
    return unsub
  }, [setGroups])

  const sortedGroups = [...groups]
    .filter((g) => g.visible)
    .sort((a, b) => {
      // Favorites first
      if (a.favorite && !b.favorite) return -1
      if (!a.favorite && b.favorite) return 1
      // Then by order
      return a.order - b.order
    })

  return { groups: sortedGroups }
}
