import { Link, useNavigate } from 'react-router-dom'
import { LogOut, Settings, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { signOutUser } from '../../services/auth'
import { useStore } from '../../store'
import { cn } from '../../lib/utils'

export function Header() {
  const user = useStore((s) => s.user)
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

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
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
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
            className="sm:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {menuOpen && user?.isAdmin && (
        <div className={cn('sm:hidden border-t border-slate-200 bg-white px-4 py-2')}>
          <Link
            to="/admin"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 py-2 text-sm font-medium text-primary-600"
          >
            <Settings size={16} />
            Yönetim Paneli
          </Link>
        </div>
      )}
    </header>
  )
}
