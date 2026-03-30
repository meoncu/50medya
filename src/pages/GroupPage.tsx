import { useParams, Link } from 'react-router-dom'
import { usePosts } from '../hooks/usePosts'
import { useGroups } from '../hooks/useGroups'
import { PostGrid } from '../components/post/PostGrid'
import { ChevronRight, ArrowLeft } from 'lucide-react'
import { cn } from '../lib/utils'

export function GroupPage() {
  const { slug } = useParams<{ slug: string }>()
  const { groups } = useGroups()
  const group = groups.find((g) => g.slug === slug)
  const { posts, loading: postsLoading } = usePosts(group?.id)

  const subGroups = groups.filter((g) => g.parentId === group?.id && g.visible)
  const parentGroup = group?.parentId ? groups.find(g => g.id === group.parentId) : null

  if (!group) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <div className="text-6xl mb-4">🏜️</div>
        <h1 className="text-2xl font-black text-slate-900">Grup Bulunamadı</h1>
        <p className="text-slate-500 mt-2 mb-8 font-medium">Bu link kırılmış olabilir veya grup yayından kaldırılmış olabilir.</p>
        <Link 
          to="/gruplar" 
          className="px-6 py-3 bg-primary-500 text-white font-bold rounded-2xl hover:bg-primary-600 transition-all shadow-lg active:scale-95"
        >
          Gruplara Dön
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto pb-20">
      {/* Header Section */}
      <div className="px-4 pt-8 pb-4">
        <div className="flex items-center gap-2 mb-3">
          {parentGroup ? (
            <Link 
              to={`/grup/${parentGroup.slug}`}
              className="flex items-center gap-1 text-[10px] font-black text-primary-500 uppercase tracking-widest bg-primary-50 px-3 py-1 rounded-full hover:bg-primary-100 transition-colors"
            >
              <ArrowLeft size={10} strokeWidth={3} />
              {parentGroup.name}
            </Link>
          ) : (
            <Link 
              to="/gruplar"
              className="flex items-center gap-1 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full hover:bg-slate-200 transition-colors"
            >
              <ArrowLeft size={10} strokeWidth={3} />
              Tüm Gruplar
            </Link>
          )}
        </div>

        <div className="flex items-end justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <span className="text-4xl drop-shadow-sm">{group.icon}</span>
              {group.name}
            </h1>
            <div className="mt-2 flex items-center gap-3 text-sm font-bold text-slate-400">
               <span>{posts.length} Paylaşım</span>
               {subGroups.length > 0 && (
                 <>
                   <span className="w-1 h-1 bg-slate-300 rounded-full" />
                   <span className="text-primary-500/80">{subGroups.length} Alt Grup</span>
                 </>
               )}
            </div>
          </div>
        </div>
      </div>

      {/* Subgroups Section - drill down */}
      {subGroups.length > 0 && (
        <div className="px-4 mb-10">
          <div className="flex items-center justify-between mb-4 px-1">
             <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Alt Grupları Keşfet</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {subGroups.map((sub) => (
              <Link
                key={sub.id}
                to={`/grup/${sub.slug}`}
                className="group relative flex flex-col items-center gap-3 p-4 bg-white rounded-3xl border-2 border-slate-50 shadow-sm hover:border-primary-400 hover:shadow-xl hover:shadow-primary-500/5 transition-all duration-300 transform hover:-translate-y-1 active:scale-95"
              >
                <span className="text-4xl group-hover:scale-110 transition-transform duration-300">{sub.icon}</span>
                <span className="text-sm font-bold text-slate-700 text-center truncate w-full">{sub.name}</span>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <ChevronRight size={14} className="text-primary-400" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Posts Section */}
      <div className="px-4">
        {posts.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Paylaşımlar</h2>
            </div>
            <PostGrid posts={posts} />
          </>
        ) : (
          !postsLoading && (
            <div className="py-20 text-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
               <div className="text-5xl mb-4">📭</div>
               <p className="text-slate-400 font-bold">Bu grupta henüz içerik bulunmuyor.</p>
               {subGroups.length > 0 && (
                 <p className="text-xs text-slate-400 mt-2 font-medium">Yukarıdaki alt gruplara göz atabilirsiniz.</p>
               )}
            </div>
          )
        )}
        
        {postsLoading && (
          <div className="flex justify-center py-20">
             <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  )
}
