import { useEffect, useState } from 'react'
import { subscribeToLatestPosts, subscribeToGroupPosts } from '../services/posts'
import { useStore } from '../store'

export function usePosts(groupId?: string | null) {
  const { posts, setPosts } = useStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setPosts([]) // Clear current posts when switching group
    let unsub: () => void
    if (groupId) {
      unsub = subscribeToGroupPosts(groupId, (data) => {
        setPosts(data)
        setLoading(false)
      })
    } else {
      unsub = subscribeToLatestPosts((data) => {
        setPosts(data)
        setLoading(false)
      })
    }
    return unsub
  }, [groupId, setPosts])

  return { posts, loading }
}
