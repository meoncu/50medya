import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Download, Share2, ExternalLink, Copy, Check, Sparkles, RefreshCw, StickyNote, Save, Edit3 } from 'lucide-react'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../services/firebase'
import type { Post } from '../types'
import { platformLabel, platformColor, timeAgo, cn, getHierarchicalGroups } from '../lib/utils'
import { useStore } from '../store'
import { SummaryModal } from '../components/ui/SummaryModal'
import { fetchLinkPreview } from '../services/linkPreview'

export function PostDetail() {
  const { id } = useParams<{ id: string }>()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [summarizing, setSummarizing] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [summary, setSummary] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Viewer Notes states
  const [noteText, setNoteText] = useState('')
  const [isEditingNote, setIsEditingNote] = useState(false)
  const [savingNote, setSavingNote] = useState(false)
  
  // Content Editing states (Admin)
  const [isEditingContent, setIsEditingContent] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState<string>('')
  const [savingContent, setSavingContent] = useState(false)

  const groups = useStore((s) => s.groups)
  const user = useStore((s) => s.user)

  async function load() {
    if (!id) return
    const snap = await getDoc(doc(db, 'posts', id))
    if (snap.exists()) {
      const d = snap.data()
      const postData = {
        id: snap.id,
        url: d.url,
        platform: d.platform,
        title: d.title,
        description: d.description,
        thumbnail: d.thumbnail,
        mediaType: d.mediaType,
        groupId: d.groupId ?? null,
        createdAt: d.createdAt?.toDate() ?? new Date(),
        createdBy: d.createdBy,
        published: d.published,
        viewerNotes: d.viewerNotes,
      }
      setPost(postData)
      setNoteText(postData.viewerNotes || '')
      setEditTitle(postData.title || '')
      setEditDescription(postData.description || '')
      setSelectedGroupId(postData.groupId || '')

      // Auto-sync if it's a generic placeholder
      if ((postData.platform === 'twitter' && postData.title === 'X (Twitter) Paylaşımı' && !syncing) ||
          (postData.platform === 'instagram' && postData.title === 'Instagram Paylaşımı' && !syncing)) {
        handleRefreshMetadata(postData)
      }
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  async function handleRefreshMetadata(currentPost: Post) {
    if (syncing) return
    setSyncing(true)
    try {
      const result = await fetchLinkPreview(`${currentPost.url}&t=${Date.now()}`)
      if (result && result.title && result.title !== 'X (Twitter) Paylaşımı' && result.title !== 'Instagram Paylaşımı') {
        const updates = {
          title: result.title,
          description: result.description || '',
          thumbnail: result.thumbnail || '',
        }
        await updateDoc(doc(db, 'posts', currentPost.id), updates)
        setPost({ ...currentPost, ...updates })
        setEditTitle(updates.title)
        setEditDescription(updates.description)
      }
    } catch (err) {
      console.error('Metadata sync error:', err)
    } finally {
      setSyncing(false)
    }
  }

  async function handleSaveContent() {
    if (!post || !id) return
    setSavingContent(true)
    try {
      const updates = {
        title: editTitle,
        description: editDescription,
        groupId: selectedGroupId || null
      }
      await updateDoc(doc(db, 'posts', id), updates)
      setPost({ ...post, ...updates })
      setIsEditingContent(false)
    } catch (err) {
      console.error('Error saving content:', err)
      alert('İçerik güncellenemedi.')
    } finally {
      setSavingContent(false)
    }
  }

  async function handleSummarize() {
    if (!post) return
    setIsModalOpen(true)
    setSummarizing(true)
    try {
      const res = await fetch(`/api/summarize?url=${encodeURIComponent(post.url)}`)
      const data = await res.json()
      if (data.summary) {
        setSummary(data.summary)
      } else {
        setSummary('AI servisi şu an yanıt veremiyor.')
      }
    } catch (err) {
      setSummary('Hata oluştu.')
    } finally {
      setSummarizing(false)
    }
  }

  async function handleDownload() {
    if (!post) return
    setDownloading(true)
    try {
      const res = await fetch(`/api/download?url=${encodeURIComponent(post.url)}&type=${post.mediaType}`)
      if (res.ok) {
        const data = await res.json()
        if (data.downloadUrl) {
          window.open(data.downloadUrl, '_blank')
          return
        }
      }
      alert('İndirme şu an başlatılamadı.')
    } catch (err) {
      alert('Servis hatası.')
    } finally {
      setDownloading(false)
    }
  }

  async function handleShare() {
    if (!post) return
    if (navigator.share) {
      await navigator.share({ title: post.title, url: post.url })
    } else {
      await navigator.clipboard.writeText(post.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  async function handleCopyLink() {
    if (!post) return
    await navigator.clipboard.writeText(post.url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleWhatsApp() {
    if (!post) return
    const text = encodeURIComponent(`${post.title}\n${post.url}`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  function handleNotebookLM() {
    if (!post) return
    navigator.clipboard.writeText(post.url)
    window.open(`https://notebooklm.google.com/`, '_blank')
  }

  async function handleSaveNote() {
    if (!post || !id) return
    setSavingNote(true)
    try {
      await updateDoc(doc(db, 'posts', id), {
        viewerNotes: noteText
      })
      setPost({ ...post, viewerNotes: noteText })
      setIsEditingNote(false)
    } catch (err) {
      console.error('Error saving note:', err)
      alert('Not kaydedilemedi.')
    } finally {
      setSavingNote(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="p-4 text-center py-20 text-slate-400">
        <p>İçerik bulunamadı.</p>
        <Link to="/" className="mt-4 inline-block text-primary-600 font-medium">Ana sayfaya dön</Link>
      </div>
    )
  }

  const group = groups.find((g) => g.id === post.groupId)
  const isAdmin = user?.email === import.meta.env.VITE_ADMIN_EMAIL

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <Link to="/" className="flex items-center gap-1 text-sm text-slate-500 hover:text-primary-600 transition-colors">
          <ArrowLeft size={16} />
          Geri
        </Link>
        {isAdmin && (
          <div className="flex gap-2">
            {!isEditingContent && (
              <button
                onClick={() => setIsEditingContent(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <Edit3 size={14} />
                Yazıyı Düzenle
              </button>
            )}
            <button
              onClick={() => handleRefreshMetadata(post)}
              disabled={syncing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
              Bilgileri Güncelle
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {post.platform === 'youtube' ? (
          <div className="relative w-full aspect-video bg-black">
            {(() => {
              const videoId = post.url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/)?.[1]
              return (
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}?rel=0&origin=${window.location.origin}`}
                  title={post.title}
                  className="absolute inset-0 w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )
            })()}
          </div>
        ) : post.thumbnail && (
          <div className="relative w-full aspect-video bg-slate-100">
            <img src={post.thumbnail} alt={post.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
        )}

        <div className="p-4">
          <div className="flex flex-wrap gap-2 mb-3">
            <span className={cn("text-xs px-2 py-1 rounded-full font-medium", platformColor(post.platform))}>
              {platformLabel(post.platform)}
            </span>
            {group && (
              <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">
                {group.icon} {group.name}
              </span>
            )}
          </div>

          {isEditingContent ? (
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Başlık</label>
                <textarea
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full p-2 text-lg font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none resize-none"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Açıklama</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full p-2 text-sm text-slate-600 leading-relaxed bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none resize-none"
                  rows={5}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Grup (Kategori)</label>
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                >
                  <option value="">Grup (Kategori) Seçin</option>
                  {getHierarchicalGroups(groups).map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.displayLabel}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setIsEditingContent(false)
                    setEditTitle(post.title || '')
                    setEditDescription(post.description || '')
                  }}
                  className="px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Vazgeç
                </button>
                <button
                  onClick={handleSaveContent}
                  disabled={savingContent}
                  className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white text-sm font-bold rounded-xl hover:bg-primary-700 transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  {savingContent ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
                  Değişiklikleri Kaydet
                </button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-lg font-bold text-slate-800 mb-2">{post.title}</h1>
              {post.description && (
                <div className="bg-slate-50 rounded-xl p-3 mb-4">
                  <p className="text-sm text-slate-600 leading-relaxed font-normal whitespace-pre-wrap">{post.description}</p>
                </div>
              )}
            </>
          )}

          {/* Viewer Notes Section */}
          <div className="mb-6 p-4 bg-amber-50/50 border border-amber-100 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
                <StickyNote size={18} />
                <span>İzleyici Notları</span>
              </div>
              {!isEditingNote && (
                <button
                  onClick={() => setIsEditingNote(true)}
                  className="text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors"
                >
                  {post.viewerNotes ? 'Düzenle' : 'Not Ekle'}
                </button>
              )}
            </div>

            {isEditingNote ? (
              <div className="space-y-3">
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Bu içerik hakkında bir not bırakın..."
                  className="w-full min-h-[100px] p-3 text-sm bg-white border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-none"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setIsEditingNote(false)
                      setNoteText(post.viewerNotes || '')
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Vazgeç
                  </button>
                  <button
                    onClick={handleSaveNote}
                    disabled={savingNote}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50"
                  >
                    {savingNote ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={14} />}
                    Kaydet
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-amber-800/80 leading-relaxed italic">
                {post.viewerNotes ? (
                  <p className="whitespace-pre-wrap">{post.viewerNotes}</p>
                ) : (
                  <p className="text-amber-600/50">Henüz bir not eklenmemiş.</p>
                )}
              </div>
            )}
          </div>

          <p className="text-xs text-slate-400 mb-4">{timeAgo(post.createdAt)}</p>

          <a href={post.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-primary-600 hover:underline mb-6 break-all">
            <ExternalLink size={14} />
            Kaynağa git
          </a>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center justify-center gap-2 py-2.5 bg-primary-500 text-white text-sm font-medium rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-70"
            >
              <Download size={16} className={downloading ? 'animate-bounce' : ''} />
              {downloading ? 'Hazırlanıyor...' : 'İndir'}
            </button>

            <button
              onClick={handleShare}
              className="flex items-center justify-center gap-2 py-2.5 bg-slate-100 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-200 transition-colors"
            >
              <Share2 size={16} />
              Paylaş
            </button>

            {(post.platform === 'youtube' || post.platform === 'twitter' || post.platform === 'instagram') && (
              <>
                <button
                  onClick={handleSummarize}
                  className="flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  <Sparkles size={16} />
                  AI Özet
                </button>
                <button
                  onClick={handleNotebookLM}
                  className="flex items-center justify-center gap-2 py-2.5 bg-amber-50 text-amber-700 border border-amber-200 text-sm font-medium rounded-xl hover:bg-amber-100 transition-colors"
                >
                  <span className="text-base">📔</span>
                  NotebookLM
                </button>
              </>
            )}

            <button
              onClick={handleWhatsApp}
              className="flex items-center justify-center gap-2 py-2.5 bg-green-500 text-white text-sm font-medium rounded-xl hover:bg-green-600 transition-colors"
            >
              <span className="text-base">💬</span>
              WhatsApp
            </button>

            <button
              onClick={handleCopyLink}
              className="flex items-center justify-center gap-2 py-2.5 bg-slate-100 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-200 transition-colors"
            >
              {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
              {copied ? 'Kopyalandı!' : 'Linki Kopyala'}
            </button>
          </div>
        </div>
      </div>

      <SummaryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        summary={summary}
        loading={summarizing}
      />
    </div>
  )
}
