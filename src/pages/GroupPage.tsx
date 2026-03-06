import { useParams } from 'react-router-dom'
import { usePosts } from '../hooks/usePosts'
import { useGroups } from '../hooks/useGroups'
import { PostGrid } from '../components/post/PostGrid'

export function GroupPage() {
  const { slug } = useParams<{ slug: string }>()
  const { groups } = useGroups()
  const group = groups.find((g) => g.slug === slug)
  const { posts } = usePosts(group?.id)

  return (
    <div>
      <div className="px-4 pt-6 pb-2">
        {group ? (
          <>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{group.icon}</span>
              <h1 className="text-xl font-bold text-slate-800">{group.name}</h1>
            </div>
          </>
        ) : (
          <h1 className="text-xl font-bold text-slate-800">Grup bulunamadı</h1>
        )}
      </div>
      <PostGrid posts={posts} />
    </div>
  )
}
