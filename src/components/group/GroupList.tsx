import { Link } from 'react-router-dom'
import type { Group } from '../../types'

interface GroupListProps {
  groups: Group[]
}

export function GroupList({ groups }: GroupListProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-4">
      {groups.map((g) => (
        <Link
          key={g.id}
          to={`/grup/${g.slug}`}
          className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-slate-200 hover:border-primary-300 hover:shadow-md transition-all"
        >
          <span className="text-3xl">{g.icon}</span>
          <span className="text-sm font-semibold text-slate-700 text-center">{g.name}</span>
        </Link>
      ))}
    </div>
  )
}
