import type { Post } from '../../types'
import { PostCard } from './PostCard'

interface PostGridProps {
  posts: Post[]
  loading?: boolean
}

export function PostGrid({ posts, loading }: PostGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse">
            <div className="aspect-video bg-slate-200" />
            <div className="p-3 space-y-2">
              <div className="h-3 bg-slate-200 rounded w-1/3" />
              <div className="h-4 bg-slate-200 rounded w-full" />
              <div className="h-4 bg-slate-200 rounded w-4/5" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <span className="text-5xl mb-3">📭</span>
        <p className="text-base font-medium">Henüz içerik yok</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}
