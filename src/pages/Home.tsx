import { usePosts } from '../hooks/usePosts'
import { useGroups } from '../hooks/useGroups'
import { PostGrid } from '../components/post/PostGrid'
import { GroupList } from '../components/group/GroupList'

export function Home() {
  const { posts } = usePosts()
  const { groups } = useGroups()

  return (
    <div>
      {groups.length > 0 && (
        <section>
          <div className="px-4 pt-6 pb-2">
            <h2 className="text-lg font-bold text-slate-800">Gruplar</h2>
          </div>
          <GroupList groups={groups} />
        </section>
      )}

      <section>
        <div className="px-4 pt-4 pb-2">
          <h2 className="text-lg font-bold text-slate-800">Son Eklenenler</h2>
        </div>
        <PostGrid posts={posts} />
      </section>
    </div>
  )
}
