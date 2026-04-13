import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Grid3X3, TrendingUp, BarChart2, Star, TrendingDown } from 'lucide-react'
import { getAllPosts } from '../../services/posts'
import { useStore } from '../../store'
import type { Post } from '../../types'

export function AdminDashboard() {
  const [allPosts, setAllPosts] = useState<Post[]>([])
  const groups = useStore((s) => s.groups)

  useEffect(() => {
    getAllPosts().then(setAllPosts)
  }, [])

  const stats = useMemo(() => {
    if (allPosts.length === 0) return null

    let mostViewedPost = allPosts[0]
    let leastViewedPost = allPosts[0]
    
    const groupViews: Record<string, number> = {}
    groups.forEach(g => { groupViews[g.id] = 0 })

    allPosts.forEach(p => {
      const v = p.views || 0
      if (v > (mostViewedPost.views || 0)) mostViewedPost = p
      if (v < (leastViewedPost.views || 0)) leastViewedPost = p
      
      if (p.groupId) {
        groupViews[p.groupId] = (groupViews[p.groupId] || 0) + v
      }
    })

    let mostViewedGroup = null
    let leastViewedGroup = null
    let maxV = -1
    let minV = Infinity

    for (const [gId, views] of Object.entries(groupViews)) {
      if (views > maxV) { maxV = views; mostViewedGroup = { id: gId, views } }
      if (views < minV) { minV = views; leastViewedGroup = { id: gId, views } }
    }

    const maxGroupObj = groups.find(g => g.id === mostViewedGroup?.id)
    const minGroupObj = groups.find(g => g.id === leastViewedGroup?.id)

    return { 
      mostViewedPost, 
      leastViewedPost, 
      maxGroupObj, maxViews: mostViewedGroup?.views || 0,
      minGroupObj, minViews: leastViewedGroup?.views || 0,
    }
  }, [allPosts, groups])

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
            <p className="text-2xl font-bold text-slate-800">{allPosts.length}</p>
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

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 className="text-primary-500" size={20} />
              <h2 className="font-bold text-slate-800">Video & İçerik İstatistikleri</h2>
            </div>
            
            <div className="space-y-4">
              <div className="p-3 bg-green-50 border border-green-100 rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-green-700 flex items-center gap-1"><TrendingUp size={14}/> En Çok İzlenen</span>
                  <span className="text-xs font-bold bg-green-200 text-green-800 px-2 py-0.5 rounded-full">{stats.mostViewedPost.views || 0} görüntülenme</span>
                </div>
                <Link to={`/post/${stats.mostViewedPost.id}`} className="text-sm font-semibold text-slate-800 hover:text-primary-600 line-clamp-1">
                  {stats.mostViewedPost.title || stats.mostViewedPost.url}
                </Link>
              </div>

              <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-red-700 flex items-center gap-1"><TrendingDown size={14}/> En Az İzlenen</span>
                  <span className="text-xs font-bold bg-red-200 text-red-800 px-2 py-0.5 rounded-full">{stats.leastViewedPost.views || 0} görüntülenme</span>
                </div>
                <Link to={`/post/${stats.leastViewedPost.id}`} className="text-sm font-semibold text-slate-800 hover:text-primary-600 line-clamp-1">
                  {stats.leastViewedPost.title || stats.leastViewedPost.url}
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Star className="text-amber-500" size={20} />
              <h2 className="font-bold text-slate-800">Grup İstatistikleri</h2>
            </div>
            
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-amber-700 flex items-center gap-1 mb-1"><TrendingUp size={14}/> En Popüler Grup</div>
                  <div className="text-sm font-semibold text-slate-800">
                    {stats.maxGroupObj ? `${stats.maxGroupObj.icon} ${stats.maxGroupObj.name}` : 'Belirsiz'}
                  </div>
                </div>
                <div className="text-xs font-bold bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">{stats.maxViews} görüntülenme</div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-500 flex items-center gap-1 mb-1"><TrendingDown size={14}/> En Az İlgi Gören Grup</div>
                  <div className="text-sm font-semibold text-slate-800">
                     {stats.minGroupObj ? `${stats.minGroupObj.icon} ${stats.minGroupObj.name}` : 'Belirsiz'}
                  </div>
                </div>
                <div className="text-xs font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{stats.minViews} görüntülenme</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/admin/posts"
          className="bg-white rounded-2xl border border-slate-200 p-6 hover:border-primary-300 hover:shadow-md transition-all group"
        >
          <FileText size={28} className="text-primary-500 mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-semibold text-slate-800">Post Yönetimi</h3>
          <p className="text-sm text-slate-500 mt-1">Post ekle, düzenle ve sil</p>
        </Link>

        <Link
          to="/admin/groups"
          className="bg-white rounded-2xl border border-slate-200 p-6 hover:border-primary-300 hover:shadow-md transition-all group"
        >
          <Grid3X3 size={28} className="text-accent-500 mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-semibold text-slate-800">Grup Yönetimi</h3>
          <p className="text-sm text-slate-500 mt-1">Grupları ekle, sırala ve düzenle</p>
        </Link>
      </div>
    </div>
  )
}
