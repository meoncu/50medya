import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Download, Share2, ExternalLink, Copy, Check } from 'lucide-react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../services/firebase'
import type { Post } from '../types'
import { platformLabel, platformColor, timeAgo } from '../lib/utils'
import { useStore } from '../store'

export function PostDetail() {
  const { id } = useParams<{ id: string }>()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const groups = useStore((s) => s.groups)

  useEffect(() => {
    if (!id) return
    getDoc(doc(db, 'posts', id)).then((snap) => {
      if (snap.exists()) {
        const d = snap.data()
        setPost({
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
        })
      }
      setLoading(false)
    })
  }, [id])

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

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Link to="/" className="flex items-center gap-1 text-sm text-slate-500 hover:text-primary-600 mb-4 transition-colors">
        <ArrowLeft size={16} />
        Geri
      </Link>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {post.thumbnail && (
          <div className="relative w-full aspect-video bg-slate-100">
            <img src={post.thumbnail} alt={post.title} className="w-full h-full object-cover" />
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
            <p className="text-sm text-slate-600 mb-3">{post.description}</p>
          )}
          <p className="text-xs text-slate-400 mb-4">{timeAgo(post.createdAt)}</p>

          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-primary-600 hover:underline mb-6 break-all"
          >
            <ExternalLink size={14} />
            Kaynağa git
          </a>

          <div className="grid grid-cols-2 gap-2">
            <a
              href={`/api/download?url=${encodeURIComponent(post.url)}&type=${post.mediaType}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-2.5 bg-primary-500 text-white text-sm font-medium rounded-xl hover:bg-primary-600 transition-colors"
            >
              <Download size={16} />
              İndir
            </a>

            <button
              onClick={handleShare}
              className="flex items-center justify-center gap-2 py-2.5 bg-slate-100 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-200 transition-colors"
            >
              <Share2 size={16} />
              Paylaş
            </button>

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
    </div>
  )
}
