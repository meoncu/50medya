import { Link, useNavigate, useLocation } from 'react-router-dom'
import { LogOut, Settings, Menu, X, Home, Grid3X3, FileText, LayoutDashboard } from 'lucide-react'
import { useState, useEffect } from 'react'
import { signOutUser } from '../../services/auth'
import { useStore } from '../../store'
import { useGroups } from '../../hooks/useGroups'
import { cn } from '../../lib/utils'

export function Header() {
  const user = useStore((s) => s.user)
  const navigate = useNavigate()
  const location = useLocation()
  const { groups } = useGroups()
  const [menuOpen, setMenuOpen] = useState(false)

  // Close menu on navigation
  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  async function handleSignOut() {
    await signOutUser()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src="/icons/icon.svg" alt="50 Medya" className="w-8 h-8 rounded-lg" />
          <span className="font-bold text-lg bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
            50 Medya
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {user?.isAdmin && (
            <Link
              to="/admin"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            >
              <Settings size={16} />
              Yönetim
            </Link>
          )}

          {user ? (
            <div className="flex items-center gap-2">
              <img
                src={user.photoURL || '/icons/icon-192.png'}
                alt={user.displayName}
                className="w-8 h-8 rounded-full border-2 border-primary-200"
              />
              <button
                onClick={handleSignOut}
                className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Çıkış yap"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="px-4 py-1.5 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-colors"
            >
              Giriş
            </Link>
          )}

          <button
            className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 top-14 z-40 bg-white overflow-y-auto pb-20">
          <div className="p-4 space-y-6">
            <div className="space-y-1">
              <div className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Menü</div>
              <Link to="/" className="flex items-center gap-3 px-3 py-2 text-slate-700 font-medium hover:bg-slate-50 rounded-xl">
                <Home size={20} /> Son Eklenenler
              </Link>
              <Link to="/gruplar" className="flex items-center gap-3 px-3 py-2 text-slate-700 font-medium hover:bg-slate-50 rounded-xl">
                <Grid3X3 size={20} /> Tüm Gruplar
              </Link>
            </div>

            {groups.length > 0 && (
              <div className="space-y-1">
                <div className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Gruplar</div>
                {groups.map((g) => (
                  <Link key={g.id} to={`/grup/${g.slug}`} className="flex items-center gap-3 px-3 py-2 text-slate-700 hover:bg-slate-50 rounded-xl">
                    <span className="text-xl">{g.icon}</span> {g.name}
                  </Link>
                ))}
              </div>
            )}

            {user?.isAdmin && (
              <div className="space-y-1">
                <div className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Yönetim</div>
                <Link to="/admin" className="flex items-center gap-3 px-3 py-2 text-slate-700 hover:bg-slate-50 rounded-xl">
                  <LayoutDashboard size={20} /> Dashboard
                </Link>
                <Link to="/admin/posts" className="flex items-center gap-3 px-3 py-2 text-slate-700 hover:bg-slate-50 rounded-xl">
                  <FileText size={20} /> Postlar
                </Link>
                <Link to="/admin/groups" className="flex items-center gap-3 px-3 py-2 text-slate-700 hover:bg-slate-50 rounded-xl">
                  <Grid3X3 size={20} /> Gruplar
                </Link>
                <Link to="/admin/settings" className="flex items-center gap-3 px-3 py-2 text-slate-700 hover:bg-slate-50 rounded-xl">
                  <Settings size={20} /> Ayarlar
                </Link>
              </div>
            )}

            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2 text-red-600 font-medium hover:bg-red-50 rounded-xl mt-4"
            >
              <LogOut size={20} /> Çıkış Yap
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
