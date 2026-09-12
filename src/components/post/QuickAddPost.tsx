import { useState, useEffect } from 'react'
import { Plus, Check, X, Sparkles, Image as ImageIcon, Upload } from 'lucide-react'
import { addPost } from '../../services/posts'
import { fetchLinkPreview } from '../../services/linkPreview'
import { uploadImage } from '../../services/upload'
import { useStore } from '../../store'
import type { Post } from '../../types'
import { cn } from '../../lib/utils'
import { GroupSelect } from '../ui/GroupSelect'

interface QuickAddPostProps { preSelectedGroupId?: string }

export function QuickAddPost({ preSelectedGroupId }: QuickAddPostProps) {
  const [url, setUrl] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState<Partial<Post> | null>(null)
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState('')

  const user = useStore(s => s.user)
  const groups = useStore(s => s.groups)
  const isAdmin = user?.email === import.meta.env.VITE_ADMIN_EMAIL

  useEffect(() => { if (preSelectedGroupId) setSelectedGroupId(preSelectedGroupId) }, [preSelectedGroupId])
  useEffect(() => () => { if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl) }, [imagePreviewUrl])

  if (!isAdmin) return null

  async function handleFetchPreview() {
    if (!url.trim() || imageFile) return
    setFetching(true)
    try { setPreview(await fetchLinkPreview(url.trim())) }
    catch (err) { console.error('Preview error:', err) }
    finally { setFetching(false) }
  }

  function handleImageSelect(file?: File) {
    if (!file) {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl)
      setImageFile(null); setImagePreviewUrl(''); return
    }
    if (!file.type.startsWith('image/')) { alert('Lütfen bir resim dosyası seçin.'); return }
    if (file.size > 10 * 1024 * 1024) { alert('Resim boyutu en fazla 10 MB olabilir.'); return }
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl)
    setImageFile(file); setImagePreviewUrl(URL.createObjectURL(file)); setUrl(''); setPreview(null)
  }

  async function handleSave() {
    if (!user || (!url.trim() && !imageFile)) return
    setSaving(true)
    try {
      if (imageFile) {
        const imageUrl = await uploadImage(imageFile, user.uid)
        await addPost({ url: imageUrl, platform: 'other', title: imageFile.name.replace(/\.[^/.]+$/, ''), description: '', thumbnail: imageUrl, mediaType: 'image', groupId: selectedGroupId || null, createdAt: new Date(), createdBy: user.uid, published: true })
      } else {
        const finalPreview = preview || await fetchLinkPreview(url.trim())
        await addPost({ url: finalPreview?.url || url.trim(), platform: finalPreview?.platform || 'other', title: finalPreview?.title || '', description: finalPreview?.description || '', thumbnail: finalPreview?.thumbnail || '', mediaType: finalPreview?.mediaType || 'unknown', groupId: selectedGroupId || null, createdAt: new Date(), createdBy: user.uid, published: true })
      }
      reset()
    } catch (err) { alert(err instanceof Error ? err.message : 'Kaydedilirken bir hata oluştu.') }
    finally { setSaving(false) }
  }

  function reset() {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl)
    setUrl(''); setPreview(null); setImageFile(null); setImagePreviewUrl(''); setSelectedGroupId(''); setIsExpanded(false)
  }

  const hasContent = Boolean(url.trim() || imageFile)

  return (
    <div className="max-w-5xl mx-auto px-4 pt-4">
      <div className={cn('bg-white rounded-2xl border border-slate-200 shadow-sm transition-all duration-300', isExpanded ? 'p-4' : 'p-2 px-4 shadow-sm')}>
        {!isExpanded ? (
          <div onClick={() => setIsExpanded(true)} className="flex items-center gap-4 cursor-text group">
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-500 transition-colors"><Plus size={20} /></div>
            <span className="text-slate-400 text-sm font-medium">Yeni bir link, video veya resim paylaşın...</span>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between"><h3 className="text-sm font-bold text-slate-800">Hızlı Post Yayını</h3><button onClick={reset} className="p-1 text-slate-400 hover:text-slate-600"><X size={18} /></button></div>
            {!imageFile && <div className="flex gap-2"><input autoFocus type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="YouTube, Twitter, Instagram veya resim linki..." className="flex-1 px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-400 outline-none" onKeyDown={e => e.key === 'Enter' && handleFetchPreview()} /><button onClick={handleFetchPreview} disabled={fetching || !url.trim()} className="px-5 py-3 bg-primary-50 text-primary-600 text-sm font-bold rounded-xl hover:bg-primary-100 disabled:opacity-50 flex items-center gap-2"><Sparkles size={18} className={fetching ? 'animate-spin' : ''} /><span>{fetching ? '...' : 'Önizle'}</span></button></div>}
            <div className="flex items-center gap-2"><label className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold cursor-pointer hover:bg-slate-100"><Upload size={17} /> Resim Ekle<input type="file" accept="image/*" className="hidden" onChange={e => handleImageSelect(e.target.files?.[0])} /></label>{imageFile && <button onClick={() => handleImageSelect()} className="text-xs text-red-500 hover:underline">Resmi kaldır</button>}</div>
            {(preview || imageFile) && <div className="border border-slate-100 rounded-xl overflow-hidden bg-white shadow-inner"><div className="flex gap-4 p-4"><div className="relative shrink-0">{(imagePreviewUrl || preview?.thumbnail) ? <img src={imagePreviewUrl || preview?.thumbnail} alt="" className="w-24 h-24 rounded-lg object-cover shadow-sm" referrerPolicy="no-referrer" /> : <div className="w-24 h-24 rounded-lg bg-slate-100 flex items-center justify-center"><ImageIcon size={24} className="text-slate-300" /></div>}</div><div className="flex-1 min-w-0 space-y-2"><input value={imageFile ? imageFile.name : (preview?.title || '')} readOnly={Boolean(imageFile)} onChange={e => setPreview({ ...preview, title: e.target.value })} className="w-full text-sm font-bold text-slate-800 bg-transparent border-b border-transparent focus:border-primary-300 p-0 focus:ring-0 outline-none pb-1" placeholder="Başlık girin..." />{!imageFile && <textarea value={preview?.description || ''} onChange={e => setPreview({ ...preview, description: e.target.value })} className="w-full text-xs text-slate-500 bg-transparent border-none p-0 focus:ring-0 outline-none resize-none leading-relaxed" rows={3} placeholder="İçerik açıklaması..." />}</div></div></div>}
            <div className="flex flex-col sm:flex-row gap-3"><GroupSelect groups={groups} value={selectedGroupId} onChange={setSelectedGroupId} className="flex-1" triggerClassName="bg-slate-50 border-none h-[48px]" /><button onClick={handleSave} disabled={saving || !hasContent || fetching} className="px-10 py-3 bg-primary-600 text-white text-sm font-bold rounded-xl hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2 min-w-[140px]">{saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Check size={18} /> Hemen Yayınla</>}</button></div>
          </div>
        )}
      </div>
    </div>
  )
}
