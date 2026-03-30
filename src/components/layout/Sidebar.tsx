import { useState, useEffect } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import { Home, Grid3X3, LayoutDashboard, FileText, Settings, Plus, ChevronDown, ChevronRight } from 'lucide-react'
import { useStore } from '../../store'
import { useGroups } from '../../hooks/useGroups'
import { cn } from '../../lib/utils'

export function Sidebar() {
  const user = useStore((s) => s.user)
  const { groups } = useGroups()
  const location = useLocation()
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  // Automatically expand group if a sub-group is active
  useEffect(() => {
    const currentSlug = location.pathname.split('/').pop()
    if (location.pathname.startsWith('/grup/')) {
      const activeGroup = groups.find(g => g.slug === currentSlug)
      if (activeGroup?.parentId) {
        setExpandedGroups(prev => ({ ...prev, [activeGroup.parentId!]: true }))
      }
    }
  }, [location.pathname, groups])

  const toggleGroup = (groupId: string, e: React.MouseEvent) => {
    e.preventDefault()
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }))
  }

  const mainGroups = groups.filter(g => !g.parentId)

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-slate-200 bg-white min-h-screen pt-4 pb-20 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
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
              'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all',
              isActive
                ? 'bg-primary-50 text-primary-700 shadow-sm ring-1 ring-primary-100'
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
              'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all',
              isActive
                ? 'bg-primary-50 text-primary-700 shadow-sm ring-1 ring-primary-100'
                : 'text-slate-600 hover:bg-slate-50'
            )
          }
        >
          <Grid3X3 size={18} />
          Tüm Gruplar
        </NavLink>

        {mainGroups.length > 0 && (
          <>
            <div className="mt-4 mb-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Gruplar
            </div>
            {mainGroups.map((g) => {
              const subItems = groups.filter(sub => sub.parentId === g.id)
              const isExpanded = expandedGroups[g.id]
              const hasSubs = subItems.length > 0

              return (
                <div key={g.id} className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-0.5 group">
                    <NavLink
                      to={`/grup/${g.slug}`}
                      className={({ isActive }) =>
                        cn(
                          'flex-1 flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all border border-transparent',
                          isActive
                            ? 'bg-primary-50 text-primary-700 font-bold border-primary-100'
                            : 'text-slate-600 hover:bg-slate-50 font-medium'
                        )
                      }
                    >
                      <span className="text-lg">{g.icon}</span>
                      <span className="truncate">{g.name}</span>
                    </NavLink>
                    
                    {hasSubs && (
                      <button
                        onClick={(e) => toggleGroup(g.id, e)}
                        className={cn(
                          "p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-all",
                          isExpanded && "rotate-180 text-primary-500 bg-primary-50"
                        )}
                      >
                        <ChevronDown size={14} />
                      </button>
                    )}
                  </div>

                  {hasSubs && isExpanded && (
                    <div className="pl-9 pr-2 flex flex-col gap-0.5 mt-0.5 border-l-2 border-slate-100 ml-5 animate-in slide-in-from-top-1 duration-200">
                      {subItems.map(subGroup => (
                        <NavLink
                          key={subGroup.id}
                          to={`/grup/${subGroup.slug}`}
                          className={({ isActive }) =>
                            cn(
                              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] transition-all border border-transparent',
                              isActive
                                ? 'text-primary-600 font-bold bg-primary-50/50 border-primary-50'
                                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 font-medium'
                            )
                          }
                        >
                          <span className="text-base mr-1.5">{subGroup.icon}</span>
                          <span className="truncate">{subGroup.name}</span>
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
            <div className="mt-8 mb-2 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Yönetim Paneli
            </div>
            <div className="bg-slate-50/50 rounded-2xl p-1.5 border border-slate-100 space-y-0.5">
              <NavLink
                to="/admin"
                end
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all',
                    isActive
                      ? 'bg-white text-primary-700 shadow-sm ring-1 ring-primary-100'
                      : 'text-slate-600 hover:bg-white hover:shadow-sm'
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
                    'flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all',
                    isActive
                      ? 'bg-white text-primary-700 shadow-sm ring-1 ring-primary-100'
                      : 'text-slate-600 hover:bg-white hover:shadow-sm'
                  )
                }
              >
                <FileText size={18} />
                İçerik Yönetimi
              </NavLink>
              <NavLink
                to="/admin/groups"
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all',
                    isActive
                      ? 'bg-white text-primary-700 shadow-sm ring-1 ring-primary-100'
                      : 'text-slate-600 hover:bg-white hover:shadow-sm'
                  )
                }
              >
                <Grid3X3 size={18} />
                Grup Yönetimi
              </NavLink>
              <NavLink
                to="/admin/settings"
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all',
                    isActive
                      ? 'bg-white text-primary-700 shadow-sm ring-1 ring-primary-100'
                      : 'text-slate-600 hover:bg-white hover:shadow-sm'
                  )
                }
              >
                <Settings size={18} />
                Sistem Ayarları
              </NavLink>
            </div>
          </>
        )}
      </nav>
    </aside>
  )
}
