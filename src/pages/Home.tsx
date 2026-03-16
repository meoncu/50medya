import { usePosts } from '../hooks/usePosts'
import { PostGrid } from '../components/post/PostGrid'
import { QuickAddPost } from '../components/post/QuickAddPost'

export function Home() {
  const { posts } = usePosts()

  return (
    <div className="space-y-4">
      <QuickAddPost />
      <section>
        <div className="px-4 pt-4 pb-2">
          <h2 className="text-lg font-bold text-slate-800">Son Eklenenler</h2>
        </div>
        <PostGrid posts={posts} />
      </section>
    </div>
  )
}
