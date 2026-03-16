import { useGroups } from '../hooks/useGroups'
import { GroupList } from '../components/group/GroupList'

export function Groups() {
  const { groups } = useGroups()

  const topLevelGroups = groups.filter(g => !g.parentId)

  return (
    <div>
      <div className="px-4 pt-6 pb-2">
        <h1 className="text-xl font-bold text-slate-800">Ana Gruplar</h1>
        <p className="text-sm text-slate-500 mt-1">İçeriklere gruplar üzerinden ulaşın</p>
      </div>
      <GroupList groups={topLevelGroups} />
    </div>
  )
}
