import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Download, Share2, ExternalLink, Copy, Check, Sparkles, RefreshCw } from 'lucide-react'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../services/firebase'
import type { Post } from '../types'
import { platformLabel, platformColor, timeAgo } from '../lib/utils'
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
      }
      setPost(postData)

      // Auto-sync if it's a generic placeholder
      if (postData.platform === 'twitter' && postData.title === 'X (Twitter) Paylaşımı' && !syncing) {
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
      if (result && result.title && result.title !== 'X (Twitter) Paylaşımı') {
        const updates = {
          title: result.title,
          description: result.description || '',
          thumbnail: result.thumbnail || '',
        }
        await updateDoc(doc(db, 'posts', currentPost.id), updates)
        setPost({ ...currentPost, ...updates })
      }
    } catch (err) {
      console.error('Metadata sync error:', err)
    } finally {
      setSyncing(false)
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
          <button
            onClick={() => handleRefreshMetadata(post)}
            disabled={syncing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            Bilgileri Güncelle
          </button>
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
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${platformColor(post.platform)}`}>
              {platformLabel(post.platform)}
            </span>
            {group && (
              <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">
                {group.icon} {group.name}
              </span>
            )}
          </div>

          <h1 className="text-lg font-bold text-slate-800 mb-2">{post.title}</h1>
          {post.description && (
            <div className="bg-slate-50 rounded-xl p-3 mb-4">
              <p className="text-sm text-slate-600 leading-relaxed font-normal whitespace-pre-wrap">{post.description}</p>
            </div>
          )}
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

            {(post.platform === 'youtube' || post.platform === 'twitter') && (
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
