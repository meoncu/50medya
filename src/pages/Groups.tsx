import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useGroups } from '../hooks/useGroups'
import { ChevronRight, ArrowLeft } from 'lucide-react'
import { cn } from '../lib/utils'
import type { Group } from '../types'

export function Groups() {
  const { groups } = useGroups()
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null)

  const displayedGroups = useMemo(() => {
    return groups.filter(g => g.parentId === selectedParentId && g.visible)
  }, [groups, selectedParentId])

  const parentGroup = useMemo(() => {
    return groups.find(g => g.id === selectedParentId)
  }, [groups, selectedParentId])

  return (
    <div className="max-w-4xl mx-auto px-4 pt-6 pb-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          {selectedParentId ? (
            <button 
              onClick={() => setSelectedParentId(null)}
              className="flex items-center gap-1.5 text-sm font-bold text-primary-600 mb-2 hover:translate-x-[-4px] transition-transform"
            >
              <ArrowLeft size={16} />
              Geri Dön
            </button>
          ) : (
            <div className="h-6 mb-2" />
          )}
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {parentGroup ? `${parentGroup.icon} ${parentGroup.name}` : 'İçerik Grupları'}
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            {parentGroup ? 'Alt gruplardan birini seçin' : 'Kategorilere göz atarak içerikleri keşfedin'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {displayedGroups.map((g) => {
          const subCount = groups.filter(sub => sub.parentId === g.id).length
          
          if (subCount > 0 && !selectedParentId) {
            // It's a parent with children, and we are at top level
            return (
              <button
                key={g.id}
                onClick={() => setSelectedParentId(g.id)}
                className="group relative flex flex-col items-center gap-4 p-6 bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-sm hover:border-primary-400 hover:shadow-xl hover:shadow-primary-500/10 transition-all duration-300 transform hover:-translate-y-1 active:scale-95"
              >
                <div className="relative">
                  <span className="text-5xl group-hover:scale-110 transition-transform duration-300 block">{g.icon}</span>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                    {subCount}
                  </div>
                </div>
                <div className="text-center">
                  <span className="text-sm font-bold text-slate-800 block mb-0.5">{g.name}</span>
                  <span className="text-[10px] font-bold text-primary-500 uppercase tracking-widest bg-primary-50 px-2 py-0.5 rounded-full">Klasör</span>
                </div>
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight size={16} className="text-primary-400" />
                </div>
              </button>
            )
          }

          // Direct link to the group's posts
          return (
            <Link
              key={g.id}
              to={`/grup/${g.slug}`}
              className="group relative flex flex-col items-center gap-4 p-6 bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-sm hover:border-primary-400 hover:shadow-xl hover:shadow-primary-500/10 transition-all duration-300 transform hover:-translate-y-1 active:scale-95"
            >
              <span className="text-5xl group-hover:scale-110 transition-transform duration-300 block">{g.icon}</span>
              <div className="text-center">
                <span className="text-sm font-bold text-slate-800 block mb-0.5">{g.name}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{subCount > 0 ? `${subCount} Alt Grup` : 'İçerikler'}</span>
              </div>
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight size={16} className="text-primary-400" />
              </div>
            </Link>
          )
        })}

        {displayedGroups.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <p className="text-slate-400 font-medium">Bu bölümde henüz bir grup bulunmuyor.</p>
          </div>
        )}
      </div>
    </div>
  )
}
