import { Home, Grid3X3, Settings, Plus } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import { useStore } from '../../store'
import { cn } from '../../lib/utils'

export function BottomNav() {
  const user = useStore((s) => s.user)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 md:hidden">
      <div className="flex items-center justify-around h-16 px-4 max-w-lg mx-auto">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-colors',
              isActive ? 'text-primary-600' : 'text-slate-500'
            )
          }
        >
          <Home size={22} />
          <span className="text-xs font-medium">Ana Sayfa</span>
        </NavLink>

        <NavLink
          to="/gruplar"
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-colors',
              isActive ? 'text-primary-600' : 'text-slate-500'
            )
          }
        >
          <Grid3X3 size={22} />
          <span className="text-xs font-medium">Gruplar</span>
        </NavLink>

        {user?.isAdmin && (
          <Link
            to="/admin/posts"
            state={{ addPost: true }}
            className="flex flex-col items-center justify-center -mt-8 w-14 h-14 bg-primary-500 text-white rounded-full shadow-lg border-4 border-slate-50 transition-transform active:scale-95 mb-1"
          >
            <Plus size={28} strokeWidth={3} />
          </Link>
        )}

        {user?.isAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-colors',
                isActive ? 'text-primary-600' : 'text-slate-500'
              )
            }
          >
            <Settings size={22} />
            <span className="text-xs font-medium">Yönetim</span>
          </NavLink>
        )}
      </div>
    </nav>
  )
}
