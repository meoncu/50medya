import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, Share2, Play, Image as ImageIcon, RefreshCw, StickyNote } from 'lucide-react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { incrementPostView } from '../../services/posts'
import type { Post } from '../../types'
import { platformLabel, platformColor, timeAgo, cn } from '../../lib/utils'
import { useStore } from '../../store'
import { fetchLinkPreview } from '../../services/linkPreview'

interface PostCardProps {
  post: Post
  groupName?: string
}

export function PostCard({ post: initialPost, groupName }: PostCardProps) {
  const [post, setPost] = useState(initialPost)
  const user = useStore((s) => s.user)
  const groups = useStore((s) => s.groups)
  const group = groups.find((g) => g.id === post.groupId)
  const [imgError, setImgError] = useState(false)
  const [syncing, setSyncing] = useState(false)

  // Auto-sync if data is missing and user is admin
  useEffect(() => {
    // Only internal/admin sync
    const isAdmin = user?.email === import.meta.env.VITE_ADMIN_EMAIL
    const isGeneric = post.title === 'X (Twitter) Paylaşımı' || post.title === post.url
    const isMissingThumb = !post.thumbnail

    if (isAdmin && (isGeneric || isMissingThumb) && !syncing) {
      handleSync()
    }
  }, [post.id, user, post.title, post.thumbnail])

  async function handleSync() {
    if (syncing) return
    setSyncing(true)
    try {
      const result = await fetchLinkPreview(post.url)
      if (result && result.title && result.title !== 'X (Twitter) Paylaşımı' && result.title !== post.url) {
        const updates = {
          title: result.title,
          description: result.description || '',
          thumbnail: result.thumbnail || '',
        }
        await updateDoc(doc(db, 'posts', post.id), updates)
        setPost({ ...post, ...updates })
      }
    } catch (err) {
      console.error('PostCard sync error:', err)
    } finally {
      setSyncing(false)
    }
  }

  async function handleShare() {
    if (navigator.share) {
      await navigator.share({ title: post.title, url: post.url })
    } else {
      await navigator.clipboard.writeText(post.url)
    }
  }

  return (
    <article className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
      <a 
        href={post.url} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="block relative"
        onClick={() => incrementPostView(post.id)}
      >
        <div className="relative w-full aspect-video bg-slate-100">
          {post.thumbnail && !imgError ? (
            <img
              src={post.thumbnail}
              alt={post.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {syncing ? (
                <RefreshCw size={30} className="text-primary-300 animate-spin" />
              ) : (
                <ImageIcon size={40} className="text-slate-300" />
              )}
            </div>
          )}
          {post.mediaType === 'video' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Play size={22} className="text-white ml-1" fill="white" />
              </div>
            </div>
          )}
        </div>
      </a>

      <div className="p-3">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', platformColor(post.platform))}>
            {platformLabel(post.platform)}
          </span>
          {(group || groupName) && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
              {group?.icon} {group?.name ?? groupName}
            </span>
          )}
        </div>

        <Link to={`/post/${post.id}`}>
          <h3 className="text-sm font-semibold text-slate-800 line-clamp-2 hover:text-primary-600 transition-colors">
            {post.title || post.url}
          </h3>
        </Link>

        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">{timeAgo(post.createdAt)}</span>
            {post.viewerNotes && (
              <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-100">
                <StickyNote size={10} />
                NOT
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <a
              href={`/api/download?url=${encodeURIComponent(post.url)}&type=${post.mediaType}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              title="İndir"
              onClick={(e) => e.stopPropagation()}
            >
              <Download size={16} />
            </a>
            <button
              onClick={handleShare}
              className="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              title="Paylaş"
            >
              <Share2 size={16} />
            </button>
            <Link
              to={`/post/${post.id}`}
              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
              title="İzleyici Notları"
            >
              <StickyNote size={16} />
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}
