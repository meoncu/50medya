import { NavLink, Link } from 'react-router-dom'
import { Home, Grid3X3, LayoutDashboard, FileText, Settings, Plus } from 'lucide-react'
import { useStore } from '../../store'
import { useGroups } from '../../hooks/useGroups'
import { cn } from '../../lib/utils'

export function Sidebar() {
  const user = useStore((s) => s.user)
  const { groups } = useGroups()

  return (
    <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-slate-200 bg-white min-h-screen pt-4 pb-20 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
      <nav className="flex flex-col gap-1 px-3">
        {user?.isAdmin && (
          <Link
            to="/admin/posts"
            state={{ addPost: true }}
            className="flex items-center justify-center gap-2 mb-4 px-4 py-2.5 bg-primary-500 text-white rounded-xl font-semibold shadow-md hover:bg-primary-600 transition-all active:scale-95"
          >
            <Plus size={20} strokeWidth={3} />
            Hızlı Paylaş
          </Link>
        )}
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary-50 text-primary-700'
                : 'text-slate-600 hover:bg-slate-50'
            )
          }
        >
          <Home size={18} />
          Son Eklenenler
        </NavLink>

        <NavLink
          to="/gruplar"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary-50 text-primary-700'
                : 'text-slate-600 hover:bg-slate-50'
            )
          }
        >
          <Grid3X3 size={18} />
          Tüm Gruplar
        </NavLink>

        {groups.filter(g => !g.parentId).length > 0 && (
          <>
            <div className="mt-3 mb-1 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Gruplar
            </div>
            {groups.filter(g => !g.parentId).map((g) => {
              const subItems = groups.filter(sub => sub.parentId === g.id)
              return (
                <div key={g.id} className="flex flex-col gap-1">
                  <NavLink
                    to={`/grup/${g.slug}`}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                        isActive
                          ? 'bg-primary-50 text-primary-700 font-medium'
                          : 'text-slate-600 hover:bg-slate-50'
                      )
                    }
                  >
                    <span className="text-base">{g.icon}</span>
                    {g.name}
                  </NavLink>
                  {subItems.length > 0 && (
                    <div className="pl-6 flex flex-col gap-1">
                      {subItems.map(subGroup => (
                        <NavLink
                          key={subGroup.id}
                          to={`/grup/${subGroup.slug}`}
                          className={({ isActive }) =>
                            cn(
                              'flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs transition-colors',
                              isActive
                                ? 'bg-primary-50 text-primary-700 font-medium'
                                : 'text-slate-500 hover:bg-slate-50'
                            )
                          }
                        >
                          <span className="text-sm">{subGroup.icon}</span>
                          {subGroup.name}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </>
        )}

        {user?.isAdmin && (
          <>
            <div className="mt-3 mb-1 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Yönetim
            </div>
            <NavLink
              to="/admin"
              end
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-slate-600 hover:bg-slate-50'
                )
              }
            >
              <LayoutDashboard size={18} />
              Dashboard
            </NavLink>
            <NavLink
              to="/admin/posts"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-slate-600 hover:bg-slate-50'
                )
              }
            >
              <FileText size={18} />
              Postlar
            </NavLink>
            <NavLink
              to="/admin/groups"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-slate-600 hover:bg-slate-50'
                )
              }
            >
              <Grid3X3 size={18} />
              Gruplar
            </NavLink>
            <NavLink
              to="/admin/settings"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-slate-600 hover:bg-slate-50'
                )
              }
            >
              <Settings size={18} />
              Ayarlar
            </NavLink>
          </>
        )}
      </nav>
    </aside>
  )
}
