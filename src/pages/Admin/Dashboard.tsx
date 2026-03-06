import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Grid3X3, TrendingUp } from 'lucide-react'
import { getAllPosts } from '../../services/posts'
import { useStore } from '../../store'

export function AdminDashboard() {
  const [postCount, setPostCount] = useState(0)
  const groups = useStore((s) => s.groups)

  useEffect(() => {
    getAllPosts().then((p) => setPostCount(p.length))
  }, [])

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-slate-800 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
            <FileText size={22} className="text-primary-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Toplam Post</p>
            <p className="text-2xl font-bold text-slate-800">{postCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-accent-500/10 rounded-xl flex items-center justify-center">
            <Grid3X3 size={22} className="text-accent-500" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Toplam Grup</p>
            <p className="text-2xl font-bold text-slate-800">{groups.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <TrendingUp size={22} className="text-green-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Aktif Grup</p>
            <p className="text-2xl font-bold text-slate-800">{groups.filter((g) => g.visible).length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/admin/posts"
          className="bg-white rounded-2xl border border-slate-200 p-6 hover:border-primary-300 hover:shadow-md transition-all"
        >
          <FileText size={28} className="text-primary-500 mb-3" />
          <h3 className="font-semibold text-slate-800">Post Yönetimi</h3>
          <p className="text-sm text-slate-500 mt-1">Post ekle, düzenle ve sil</p>
        </Link>

        <Link
          to="/admin/groups"
          className="bg-white rounded-2xl border border-slate-200 p-6 hover:border-primary-300 hover:shadow-md transition-all"
        >
          <Grid3X3 size={28} className="text-accent-500 mb-3" />
          <h3 className="font-semibold text-slate-800">Grup Yönetimi</h3>
          <p className="text-sm text-slate-500 mt-1">Grupları ekle, sırala ve düzenle</p>
        </Link>
      </div>
    </div>
  )
}
