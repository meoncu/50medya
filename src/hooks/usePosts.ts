import { useEffect } from 'react'
import { subscribeToLatestPosts, subscribeToGroupPosts } from '../services/posts'
import { useStore } from '../store'

export function usePosts(groupId?: string | null) {
  const { posts, setPosts } = useStore()

  useEffect(() => {
    let unsub: () => void
    if (groupId) {
      unsub = subscribeToGroupPosts(groupId, setPosts)
    } else {
      unsub = subscribeToLatestPosts(setPosts)
    }
    return unsub
  }, [groupId, setPosts])

  return { posts }
}
