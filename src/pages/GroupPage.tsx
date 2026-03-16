import { useParams } from 'react-router-dom'
import { usePosts } from '../hooks/usePosts'
import { useGroups } from '../hooks/useGroups'
import { PostGrid } from '../components/post/PostGrid'
import { GroupList } from '../components/group/GroupList'
import { Link } from 'react-router-dom'

export function GroupPage() {
  const { slug } = useParams<{ slug: string }>()
  const { groups } = useGroups()
  const group = groups.find((g) => g.slug === slug)
  const { posts } = usePosts(group?.id)

  const subGroups = groups.filter((g) => g.parentId === group?.id)

  return (
    <div>
      <div className="px-4 pt-6 pb-2">
        {group ? (
          <>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{group.icon}</span>
              <h1 className="text-xl font-bold text-slate-800">{group.name}</h1>
            </div>
            {group.parentId && (
              <Link to={`/grup/${groups.find(g => g.id === group.parentId)?.slug}`} className="text-sm text-primary-500 hover:underline mt-1 inline-block">
                 ← Üst Gruba Dön
              </Link>
            )}
          </>
        ) : (
          <h1 className="text-xl font-bold text-slate-800">Grup bulunamadı</h1>
        )}
      </div>
      {subGroups.length > 0 && (
        <div className="mb-4">
          <GroupList groups={subGroups} />
        </div>
      )}
      <PostGrid posts={posts} />
    </div>
  )
}
