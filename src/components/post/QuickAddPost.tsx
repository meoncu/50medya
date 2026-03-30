import { useState } from 'react'
import { Plus, Check, X, Sparkles, Image as ImageIcon } from 'lucide-react'
import { addPost } from '../../services/posts'
import { fetchLinkPreview } from '../../services/linkPreview'
import { useStore } from '../../store'
import type { Post } from '../../types'
import { cn, getHierarchicalGroups } from '../../lib/utils'

export function QuickAddPost() {
  const [url, setUrl] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState<Partial<Post> | null>(null)
  const [selectedGroupId, setSelectedGroupId] = useState('')
  
  const user = useStore(s => s.user)
  const groups = useStore(s => s.groups)
  // Check if admin email matches (using VITE_ADMIN_EMAIL from environment)
  const isAdmin = user?.email === import.meta.env.VITE_ADMIN_EMAIL

  if (!isAdmin) return null

  async function handleFetchPreview() {
    if (!url.trim()) return
    setFetching(true)
    try {
      const result = await fetchLinkPreview(url.trim())
      setPreview(result)
    } catch (err) {
      console.error('Preview error:', err)
    } finally {
      setFetching(false)
    }
  }

  async function handleSave() {
    if (!url.trim() || !user) return
    setSaving(true)
    try {
      let finalPreview = preview
      if (!finalPreview) {
        finalPreview = await fetchLinkPreview(url.trim())
      }

      await addPost({
        url: finalPreview?.url || url.trim(),
        platform: finalPreview?.platform || 'other',
        title: finalPreview?.title || '',
        description: finalPreview?.description || '',
        thumbnail: finalPreview?.thumbnail || '',
        mediaType: finalPreview?.mediaType || 'unknown',
        groupId: selectedGroupId || null,
        createdAt: new Date(),
        createdBy: user.uid,
        published: true,
      })
      
      reset()
    } catch (err) {
      console.error('Save error:', err)
      alert('Kaydedilirken bir hata oluştu.')
    } finally {
      setSaving(false)
    }
  }

  function reset() {
    setUrl('')
    setPreview(null)
    setSelectedGroupId('')
    setIsExpanded(false)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 pt-4">
      <div className={cn(
        "bg-white rounded-2xl border border-slate-200 shadow-sm transition-all duration-300",
        isExpanded ? "p-4" : "p-2 px-4 shadow-sm"
      )}>
        {!isExpanded ? (
          <div 
            onClick={() => setIsExpanded(true)}
            className="flex items-center gap-4 cursor-text group"
          >
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-500 transition-colors">
              <Plus size={20} />
            </div>
            <span className="text-slate-400 text-sm font-medium">Yeni bir link ya da video paylaşın...</span>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Hızlı Post Yayını</h3>
              <button onClick={reset} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="flex gap-2">
              <input
                autoFocus
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="YouTube, Twitter veya Instagram linki yapıştırın..."
                className="flex-1 px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-400 outline-none"
                onKeyDown={(e) => e.key === 'Enter' && handleFetchPreview()}
              />
              <button
                onClick={handleFetchPreview}
                disabled={fetching || !url.trim()}
                className="px-5 py-3 bg-primary-50 text-primary-600 text-sm font-bold rounded-xl hover:bg-primary-100 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {fetching ? <Sparkles size={18} className="animate-spin" /> : <Sparkles size={18} />}
                <span>{fetching ? '...' : 'Önizle'}</span>
              </button>
            </div>

            {preview && (
              <div className="border border-slate-100 rounded-xl overflow-hidden bg-white shadow-inner animate-in zoom-in-95 duration-200">
                <div className="flex gap-4 p-4">
                  <div className="relative shrink-0">
                    {preview.thumbnail ? (
                      <img 
                        src={preview.thumbnail} 
                        alt="" 
                        className="w-24 h-24 rounded-lg object-cover shadow-sm" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-lg bg-slate-100 flex items-center justify-center border border-dashed border-slate-200">
                        <ImageIcon size={24} className="text-slate-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <input
                      value={preview.title || ''}
                      onChange={(e) => setPreview({ ...preview, title: e.target.value })}
                      className="w-full text-sm font-bold text-slate-800 bg-transparent border-b border-transparent focus:border-primary-300 p-0 focus:ring-0 outline-none pb-1"
                      placeholder="Başlık girin..."
                    />
                    <textarea
                      value={preview.description || ''}
                      onChange={(e) => setPreview({ ...preview, description: e.target.value })}
                      className="w-full text-xs text-slate-500 bg-transparent border-none p-0 focus:ring-0 outline-none resize-none leading-relaxed"
                      rows={3}
                      placeholder="İçerik açıklaması..."
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="flex-1 px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-primary-400 outline-none appearance-none cursor-pointer"
              >
                <option value="">Grup (Kategori) Seçin</option>
                {getHierarchicalGroups(groups).map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.displayLabel}
                  </option>
                ))}
              </select>

              <button
                onClick={handleSave}
                disabled={saving || !url.trim() || fetching}
                className="px-10 py-3 bg-primary-600 text-white text-sm font-bold rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-200 hover:shadow-primary-300 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 min-w-[140px]"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Check size={18} />
                    Hemen Yayınla
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
